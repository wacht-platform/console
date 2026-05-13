import * as React from "react";
import { useTourController } from "./context";
import type { TourActionHandler } from "./context";
import type { TourActionId, TourId } from "./registry";

/**
 * Auto-starts a tour on mount if the user hasn't completed the current version
 * of it. Safe to mount in multiple places — the controller dedupes.
 */
export function useTour(tourId: TourId, enabled: boolean = true) {
    const { start } = useTourController();

    React.useEffect(() => {
        if (!enabled) return;
        const handle = window.requestAnimationFrame(() => start(tourId));
        return () => window.cancelAnimationFrame(handle);
    }, [tourId, enabled, start]);
}

/**
 * Externally mark a tour as completed once an underlying business outcome is
 * reached. Use with `persist: true` tours.
 */
export function useTourCompletion(tourId: TourId, isComplete: boolean) {
    const { complete, isSeen } = useTourController();

    React.useEffect(() => {
        if (!isComplete) return;
        if (isSeen(tourId)) return;
        complete(tourId);
    }, [tourId, isComplete, complete, isSeen]);
}

/**
 * Register a handler the tour can invoke as a step's `primaryAction`. Use
 * this when the tour needs to trigger app behaviour the user can't yet see —
 * e.g., opening a dialog so the next step has something to spotlight.
 */
export function useTourAction(
    id: TourActionId,
    handler: TourActionHandler,
) {
    const { registerAction } = useTourController();
    const handlerRef = React.useRef(handler);
    handlerRef.current = handler;

    React.useEffect(() => {
        return registerAction(id, () => handlerRef.current());
    }, [id, registerAction]);
}
