import * as React from "react";
import { useUser } from "@wacht/react-router";
import type { CurrentUser } from "@wacht/types";
import {
    getTour,
    type LinearTour,
    type ReactiveScene,
    type ReactiveStep,
    type ReactiveTour,
    type TourActionId,
    type TourDefinition,
    type TourId,
    type TourStep,
} from "./registry";
import {
    createServerTourStorage,
    type BuddyServerState,
    type TourStorage,
} from "./storage";
import {
    TourContext,
    type TourActionHandler,
    type TourContextValue,
} from "./context";
import { TourOverlay } from "./overlay";

/**
 * Temporary kill switch. While true, no tour ever fires (including forced
 * starts and intros) and the overlay never renders. Flip to `false` to
 * re-enable Buddy. Lives here (not in storage) so it doesn't depend on the
 * server-backed buddy state — useful for hard-disabling during an outage
 * or while we iterate on tour content.
 */
const BUDDY_DISABLED = false;

export type ActiveTourPayload =
    | {
          kind: "intro";
          tour: TourDefinition;
          onPrimary: () => void;
          onSkip: () => void;
          onTurnOff: () => void;
      }
    | {
          kind: "linear-step";
          tour: LinearTour;
          stepIndex: number;
          step: TourStep;
          isFirst: boolean;
          isLast: boolean;
          onNext: () => void;
          onPrev: () => void;
          onSkip: () => void;
          onTurnOff: () => void;
      }
    | {
          kind: "reactive-step";
          tour: ReactiveTour;
          scene: ReactiveScene;
          step: ReactiveStep;
          stepIndex: number;
          isLastInScene: boolean;
          onNext: () => void;
          onPrev: () => void;
          onSkip: () => void;
          onTurnOff: () => void;
      };

type SessionState =
    | { phase: "intro"; tour: TourDefinition }
    | { phase: "linear"; tour: LinearTour; stepIndex: number }
    | {
          phase: "reactive";
          tour: ReactiveTour;
          sceneTrigger: string | null;
          stepIndex: number;
      };

function elementVisible(target: string): HTMLElement | null {
    const el = document.querySelector<HTMLElement>(
        `[data-tour-id="${target}"]`,
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return el;
}

function pickReactiveScene(tour: ReactiveTour): ReactiveScene | null {
    for (let i = tour.scenes.length - 1; i >= 0; i -= 1) {
        const scene = tour.scenes[i];
        if (elementVisible(scene.trigger)) return scene;
    }
    return null;
}

/**
 * Pull `public_metadata.buddy` off the user object. `useUser()` returns
 * `Partial<CurrentUser>` while SWR is loading, hence the partial shape here.
 * Defensive against stale / hand-edited metadata, too.
 */
function readBuddyMetadata(
    user: Partial<CurrentUser> | null | undefined,
): BuddyServerState | null {
    const buddy = user?.public_metadata?.buddy;
    if (!buddy || typeof buddy !== "object") return null;
    return buddy as BuddyServerState;
}

export function TourProvider({
    children,
    storage: storageProp,
}: {
    children: React.ReactNode;
    storage?: TourStorage;
}) {
    // One instance per provider mount. The provider hydrates it from the
    // signed-in user's `public_metadata.buddy` as soon as `useUser()` lands.
    const serverStorage = React.useMemo(() => createServerTourStorage(), []);
    const storage = storageProp ?? serverStorage;
    const { user, loading: userLoading } = useUser();
    const [hydrated, setHydrated] = React.useState(false);

    React.useEffect(() => {
        if (userLoading || !user) return;
        if (storageProp) {
            setHydrated(true);
            return;
        }
        const buddyState = readBuddyMetadata(user);
        serverStorage.hydrate(buddyState);
        setHydrated(true);
    }, [user, userLoading, serverStorage, storageProp]);

    const [session, setSession] = React.useState<SessionState | null>(null);
    const dismissedRef = React.useRef<Set<TourId>>(new Set());
    const actionRegistry = React.useRef(
        new Map<TourActionId, TourActionHandler>(),
    );

    const runAction = React.useCallback<TourContextValue["runAction"]>(
        (id, arg) => {
            const handler = actionRegistry.current.get(id);
            if (!handler) {
                console.warn(`[tour] no handler registered for action "${id}"`);
                return;
            }
            return handler(arg);
        },
        [],
    );

    const reactiveTour =
        session?.phase === "reactive" ? session.tour : null;

    // Reactive watcher — picks the active scene from what's currently in the DOM.
    React.useEffect(() => {
        if (!reactiveTour) return;
        const tour = reactiveTour;

        let rafId = 0;
        let nullTimer: number | null = null;

        const clearNullTimer = () => {
            if (nullTimer !== null) {
                window.clearTimeout(nullTimer);
                nullTimer = null;
            }
        };

        const tick = () => {
            rafId = 0;
            const scene = pickReactiveScene(tour);
            if (scene) {
                clearNullTimer();
                setSession((prev) => {
                    if (!prev || prev.phase !== "reactive") return prev;
                    if (prev.sceneTrigger === scene.trigger) return prev;
                    return {
                        ...prev,
                        sceneTrigger: scene.trigger,
                        stepIndex: 0,
                    };
                });
                return;
            }
            // Brief mid-transition gap — defer the null state so the overlay
            // doesn't flicker off during a modal close animation.
            if (nullTimer !== null) return;
            nullTimer = window.setTimeout(() => {
                nullTimer = null;
                const reCheck = pickReactiveScene(tour);
                if (reCheck) {
                    setSession((prev) => {
                        if (!prev || prev.phase !== "reactive") return prev;
                        if (prev.sceneTrigger === reCheck.trigger) return prev;
                        return {
                            ...prev,
                            sceneTrigger: reCheck.trigger,
                            stepIndex: 0,
                        };
                    });
                    return;
                }
                setSession((prev) => {
                    if (!prev || prev.phase !== "reactive") return prev;
                    if (prev.sceneTrigger === null) return prev;
                    return { ...prev, sceneTrigger: null, stepIndex: 0 };
                });
            }, 350);
        };
        const schedule = () => {
            if (rafId) return;
            rafId = window.requestAnimationFrame(tick);
        };

        const observer = new MutationObserver(schedule);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
        });
        window.addEventListener("scroll", schedule, true);
        window.addEventListener("resize", schedule);
        schedule();

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", schedule);
            if (rafId) window.cancelAnimationFrame(rafId);
            clearNullTimer();
        };
    }, [reactiveTour]);

    // Run a step's `navigateTo` effect when the active step changes.
    const activeStep: TourStep | ReactiveStep | null = React.useMemo(() => {
        if (!session) return null;
        if (session.phase === "linear")
            return session.tour.steps[session.stepIndex] ?? null;
        if (session.phase === "reactive") {
            const scene = session.tour.scenes.find(
                (s) => s.trigger === session.sceneTrigger,
            );
            if (!scene) return null;
            return (
                scene.steps[
                    Math.min(session.stepIndex, scene.steps.length - 1)
                ] ?? null
            );
        }
        return null;
    }, [session]);
    const navigateTo = activeStep?.navigateTo;
    React.useEffect(() => {
        if (!navigateTo) return;
        Promise.resolve(runAction("tour:navigate", navigateTo)).catch((err) =>
            console.error("[tour] navigate action failed", err),
        );
    }, [navigateTo, runAction]);

    const finishSession = React.useCallback(
        (tourId: TourId, markSeen: boolean) => {
            const tour = getTour(tourId);
            if (!tour) return;
            if (markSeen || !tour.persist) {
                storage.markSeen(tourId, tour.version);
            } else {
                dismissedRef.current.add(tourId);
            }
            setSession(null);
        },
        [storage],
    );

    const start = React.useCallback<TourContextValue["start"]>(
        (tourId, opts) => {
            // Hard kill switch — short-circuit before any hydration / storage
            // / dismiss logic. See `BUDDY_DISABLED` at the top of this file.
            if (BUDDY_DISABLED) return;
            // Wait for the user-backed state to land before deciding what to
            // show — otherwise we could replay a tour the user already
            // completed on another device.
            if (!hydrated) {
                return;
            }
            const tour = getTour(tourId);
            if (!tour) return;
            if (!opts?.force && storage.isDisabled()) return;
            if (!opts?.force && storage.isSeen(tourId, tour.version)) return;
            if (!opts?.force && dismissedRef.current.has(tourId)) return;
            if (tour.intro) {
                setSession({ phase: "intro", tour });
            } else if (tour.mode === "linear") {
                setSession({ phase: "linear", tour, stepIndex: 0 });
            } else {
                setSession({
                    phase: "reactive",
                    tour,
                    sceneTrigger: null,
                    stepIndex: 0,
                });
            }
        },
        [storage, hydrated],
    );

    const setBuddyDisabled = React.useCallback(
        (disabled: boolean) => {
            storage.setDisabled(disabled);
            if (disabled) setSession(null);
        },
        [storage],
    );

    const turnOff = React.useCallback(() => {
        storage.setDisabled(true);
        setSession(null);
    }, [storage]);

    const skip = React.useCallback(() => {
        if (!session) return;
        finishSession(session.tour.id as TourId, false);
    }, [session, finishSession]);

    const complete = React.useCallback<TourContextValue["complete"]>(
        (tourId) => {
            const targetId =
                tourId ?? (session ? (session.tour.id as TourId) : undefined);
            if (!targetId) return;
            const tour = getTour(targetId);
            if (tour) storage.markSeen(targetId, tour.version);
            if (session && session.tour.id === targetId) setSession(null);
        },
        [session, storage],
    );

    const registerAction = React.useCallback<
        TourContextValue["registerAction"]
    >((id, handler) => {
        actionRegistry.current.set(id, handler);
        return () => {
            const existing = actionRegistry.current.get(id);
            if (existing === handler) actionRegistry.current.delete(id);
        };
    }, []);

    const advanceFromIntro = React.useCallback(() => {
        if (!session || session.phase !== "intro") return;
        const tour = session.tour;
        const action = tour.intro?.primaryAction;
        if (action) {
            Promise.resolve(runAction(action)).catch((err) =>
                console.error("[tour] intro action failed", err),
            );
        }
        if (tour.mode === "linear") {
            setSession({ phase: "linear", tour, stepIndex: 0 });
        } else {
            setSession({
                phase: "reactive",
                tour,
                sceneTrigger: null,
                stepIndex: 0,
            });
        }
    }, [session, runAction]);

    const linearNext = React.useCallback(() => {
        setSession((prev) => {
            if (!prev || prev.phase !== "linear") return prev;
            const lastIndex = prev.tour.steps.length - 1;
            if (prev.stepIndex >= lastIndex) {
                storage.markSeen(prev.tour.id, prev.tour.version);
                return null;
            }
            return { ...prev, stepIndex: prev.stepIndex + 1 };
        });
    }, [storage]);

    const linearPrev = React.useCallback(() => {
        setSession((prev) => {
            if (!prev || prev.phase !== "linear") return prev;
            return { ...prev, stepIndex: Math.max(0, prev.stepIndex - 1) };
        });
    }, []);

    const reactiveNext = React.useCallback(() => {
        setSession((prev) => {
            if (!prev || prev.phase !== "reactive") return prev;
            const scene = prev.tour.scenes.find(
                (s) => s.trigger === prev.sceneTrigger,
            );
            if (!scene) return prev;
            if (prev.stepIndex >= scene.steps.length - 1) return prev;
            return { ...prev, stepIndex: prev.stepIndex + 1 };
        });
    }, []);

    const reactivePrev = React.useCallback(() => {
        setSession((prev) => {
            if (!prev || prev.phase !== "reactive") return prev;
            return { ...prev, stepIndex: Math.max(0, prev.stepIndex - 1) };
        });
    }, []);

    const activePayload = React.useMemo<ActiveTourPayload | null>(() => {
        if (!session) return null;

        if (session.phase === "intro") {
            return {
                kind: "intro",
                tour: session.tour,
                onPrimary: advanceFromIntro,
                onSkip: skip,
                onTurnOff: turnOff,
            };
        }

        if (session.phase === "linear") {
            const { tour, stepIndex } = session;
            const step = tour.steps[stepIndex];
            if (!step) return null;
            return {
                kind: "linear-step",
                tour,
                stepIndex,
                step,
                isFirst: stepIndex === 0,
                isLast: stepIndex === tour.steps.length - 1,
                onNext: linearNext,
                onPrev: linearPrev,
                onSkip: skip,
                onTurnOff: turnOff,
            };
        }

        const scene = session.tour.scenes.find(
            (s) => s.trigger === session.sceneTrigger,
        );
        if (!scene) return null;
        const safeIndex = Math.min(session.stepIndex, scene.steps.length - 1);
        const step = scene.steps[safeIndex];
        if (!step) return null;
        return {
            kind: "reactive-step",
            tour: session.tour,
            scene,
            step,
            stepIndex: safeIndex,
            isLastInScene: safeIndex === scene.steps.length - 1,
            onNext: reactiveNext,
            onPrev: reactivePrev,
            onSkip: skip,
            onTurnOff: turnOff,
        };
    }, [
        session,
        advanceFromIntro,
        linearNext,
        linearPrev,
        reactiveNext,
        reactivePrev,
        skip,
        turnOff,
    ]);

    const value = React.useMemo<TourContextValue>(
        () => ({
            start,
            next: () => {
                if (session?.phase === "linear") linearNext();
                else if (session?.phase === "reactive") reactiveNext();
            },
            prev: () => {
                if (session?.phase === "linear") linearPrev();
                else if (session?.phase === "reactive") reactivePrev();
            },
            skip,
            complete,
            runAction,
            registerAction,
            isSeen: (tourId) =>
                storage.isSeen(tourId, getTour(tourId).version),
            isDismissedThisSession: (tourId) =>
                dismissedRef.current.has(tourId),
            resetTour: (tourId) => {
                storage.reset(tourId);
                if (tourId) dismissedRef.current.delete(tourId);
                else dismissedRef.current.clear();
            },
            isBuddyDisabled: () => storage.isDisabled(),
            setBuddyDisabled,
        }),
        [
            session,
            start,
            linearNext,
            linearPrev,
            reactiveNext,
            reactivePrev,
            skip,
            complete,
            runAction,
            registerAction,
            storage,
            setBuddyDisabled,
        ],
    );

    return (
        <TourContext.Provider value={value}>
            {children}
            {!BUDDY_DISABLED && hydrated && activePayload ? (
                <TourOverlay payload={activePayload} />
            ) : null}
        </TourContext.Provider>
    );
}
