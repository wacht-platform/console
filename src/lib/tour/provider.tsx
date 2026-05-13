import * as React from "react";
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
import { localTourStorage, type TourStorage } from "./storage";
import {
    TourContext,
    type TourActionHandler,
    type TourContextValue,
} from "./context";
import { TourOverlay } from "./overlay";

/**
 * Hard kill switch: while true, no Buddy tour ever fires (including forced
 * starts, intros, and overlays). Flip to `false` to re-enable once the
 * onboarding work is finished.
 */
const BUDDY_KILL_SWITCH = true;

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

export function TourProvider({
    children,
    storage = localTourStorage,
}: {
    children: React.ReactNode;
    storage?: TourStorage;
}) {
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
            if (BUDDY_KILL_SWITCH) return;
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
        [storage],
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
            {!BUDDY_KILL_SWITCH && activePayload ? (
                <TourOverlay payload={activePayload} />
            ) : null}
        </TourContext.Provider>
    );
}
