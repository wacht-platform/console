import * as React from "react";
import type { TourActionId, TourId } from "./registry";

export type TourActionHandler = (arg?: string) => void | Promise<void>;

export type TourContextValue = {
    start: (tourId: TourId, opts?: { force?: boolean }) => void;
    next: () => void;
    prev: () => void;
    skip: () => void;
    complete: (tourId?: TourId) => void;
    runAction: (id: TourActionId, arg?: string) => void | Promise<void>;
    registerAction: (id: TourActionId, handler: TourActionHandler) => () => void;
    isSeen: (tourId: TourId) => boolean;
    isDismissedThisSession: (tourId: TourId) => boolean;
    resetTour: (tourId?: TourId) => void;
    /** Buddy on/off across the whole console (localStorage backed). */
    isBuddyDisabled: () => boolean;
    setBuddyDisabled: (disabled: boolean) => void;
};

export const TourContext = React.createContext<TourContextValue | null>(null);

export function useTourController(): TourContextValue {
    const ctx = React.useContext(TourContext);
    if (!ctx) {
        throw new Error("useTourController must be used inside <TourProvider>");
    }
    return ctx;
}
