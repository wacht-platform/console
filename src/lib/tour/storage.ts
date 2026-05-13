const STORAGE_PREFIX = "wacht.tour.";
const DISABLED_KEY = "wacht.buddy.disabled";

export type TourSeenState = {
    completedAt: string;
    version: number;
};

export interface TourStorage {
    isSeen(tourId: string, version: number): boolean;
    markSeen(tourId: string, version: number): void;
    reset(tourId?: string): void;
    /** Globally turn Buddy on/off across the whole console. */
    isDisabled(): boolean;
    setDisabled(disabled: boolean): void;
}

function safeRead(key: string): TourSeenState | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<TourSeenState>;
        if (
            typeof parsed?.completedAt === "string" &&
            typeof parsed?.version === "number"
        ) {
            return parsed as TourSeenState;
        }
        return null;
    } catch {
        return null;
    }
}

function safeWrite(key: string, value: TourSeenState) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // quota / private mode — silently ignore
    }
}

export const localTourStorage: TourStorage = {
    isSeen(tourId, version) {
        const state = safeRead(STORAGE_PREFIX + tourId);
        if (!state) return false;
        return state.version >= version;
    },
    markSeen(tourId, version) {
        safeWrite(STORAGE_PREFIX + tourId, {
            completedAt: new Date().toISOString(),
            version,
        });
    },
    reset(tourId) {
        if (typeof window === "undefined") return;
        if (tourId) {
            window.localStorage.removeItem(STORAGE_PREFIX + tourId);
            return;
        }
        const keys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
        }
        keys.forEach((k) => window.localStorage.removeItem(k));
    },
    isDisabled() {
        if (typeof window === "undefined") return false;
        try {
            return window.localStorage.getItem(DISABLED_KEY) === "true";
        } catch {
            return false;
        }
    },
    setDisabled(disabled) {
        if (typeof window === "undefined") return;
        try {
            if (disabled) {
                window.localStorage.setItem(DISABLED_KEY, "true");
            } else {
                window.localStorage.removeItem(DISABLED_KEY);
            }
        } catch {
            // quota / private mode — silently ignore
        }
    },
};
