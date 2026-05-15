import { apiClient } from "@/lib/api/client";

/**
 * Per-tour completion record. Versions match `registry.ts::tours[*].version`;
 * we keep the same shape on disk + over the wire so client and server speak
 * the same dialect.
 */
export type TourSeenState = {
    completed_at: string;
    version: number;
};

export type BuddyServerState = {
    disabled: boolean;
    tours: Record<string, TourSeenState>;
};

export interface TourStorage {
    isSeen(tourId: string, version: number): boolean;
    markSeen(tourId: string, version: number): void;
    reset(tourId?: string): void;
    /** Globally turn Buddy on/off across the whole console. */
    isDisabled(): boolean;
    setDisabled(disabled: boolean): void;
}

type ServerTourUpdate = {
    disabled?: boolean;
    tours?: Record<string, TourSeenState>;
    reset?: boolean;
};

async function patchServer(update: ServerTourUpdate): Promise<void> {
    try {
        await apiClient.patch("/buddy/state", update);
    } catch (err) {
        // Failed sync is non-fatal — local state still drives the session.
        // Log so we can spot persistent failures in prod.
        console.warn("[buddy] failed to sync state to server", err);
    }
}

/**
 * Build a tour storage backed by an in-memory cache that the provider
 * hydrates from the signed-in user's `public_metadata.buddy`. Writes hit
 * the cache synchronously and fire the server PATCH in the background.
 *
 * Returned `hydrate` is what the provider calls when the user object lands
 * (or changes — e.g. after sign-out → sign-in within the same SPA load).
 */
export function createServerTourStorage(): TourStorage & {
    hydrate: (state: BuddyServerState | null | undefined) => void;
    isHydrated: () => boolean;
} {
    let hydrated = false;
    let state: BuddyServerState = { disabled: false, tours: {} };

    return {
        hydrate(initial) {
            state = {
                disabled: Boolean(initial?.disabled),
                tours: { ...(initial?.tours ?? {}) },
            };
            hydrated = true;
        },
        isHydrated() {
            return hydrated;
        },
        isSeen(tourId, version) {
            const entry = state.tours[tourId];
            if (!entry) return false;
            return entry.version >= version;
        },
        markSeen(tourId, version) {
            const entry: TourSeenState = {
                completed_at: new Date().toISOString(),
                version,
            };
            state.tours[tourId] = entry;
            void patchServer({ tours: { [tourId]: entry } });
        },
        reset(tourId) {
            if (tourId) {
                delete state.tours[tourId];
                // No partial-delete op on the server — easiest correct write
                // is the full remaining map plus reset:true to clear first.
                void patchServer({ reset: true, tours: { ...state.tours } });
                return;
            }
            state.tours = {};
            void patchServer({ reset: true });
        },
        isDisabled() {
            return state.disabled;
        },
        setDisabled(disabled) {
            state.disabled = disabled;
            void patchServer({ disabled });
        },
    };
}
