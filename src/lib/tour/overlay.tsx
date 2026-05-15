import * as React from "react";
import { createPortal } from "react-dom";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    arrow,
    FloatingArrow,
    type Placement,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, ArrowRight, BellOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveTourPayload } from "./provider";
import type { ReactiveStep, TourStep } from "./registry";

type Rect = { top: number; left: number; width: number; height: number };

const SPOTLIGHT_PAD = 12;
const SPOTLIGHT_RADIUS = 12;

function getTargetEl(id?: string): HTMLElement | null {
    if (!id || typeof document === "undefined") return null;
    return document.querySelector<HTMLElement>(`[data-tour-id="${id}"]`);
}

function measureRect(el: HTMLElement | null): Rect | null {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function useTargetRect(target?: string) {
    const [el, setEl] = React.useState<HTMLElement | null>(null);
    const [rect, setRect] = React.useState<Rect | null>(null);

    React.useEffect(() => {
        if (!target) {
            setEl(null);
            setRect(null);
            return;
        }
        let cancelled = false;
        let frame = 0;
        const tick = () => {
            if (cancelled) return;
            const found = getTargetEl(target);
            if (found) {
                const r = measureRect(found);
                if (r) {
                    setEl(found);
                    setRect(r);
                    found.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest",
                    });
                    return;
                }
            }
            frame = window.requestAnimationFrame(tick);
        };
        tick();
        return () => {
            cancelled = true;
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [target]);

    React.useEffect(() => {
        if (!el) return;
        let frame = 0;
        const remeasure = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                if (!document.body.contains(el)) {
                    setEl(null);
                    setRect(null);
                    return;
                }
                const r = measureRect(el);
                if (r) setRect(r);
            });
        };
        const ro = new ResizeObserver(remeasure);
        ro.observe(el);
        window.addEventListener("scroll", remeasure, true);
        window.addEventListener("resize", remeasure);
        return () => {
            ro.disconnect();
            window.removeEventListener("scroll", remeasure, true);
            window.removeEventListener("resize", remeasure);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [el]);

    return { el, rect };
}

/**
 * Buddy's "face". A Sparkles glyph on a soft primary-tinted disc with a
 * gentle continuous pulse — reads as a personable guide, not a system icon.
 */
function BuddyAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
    const dims =
        size === "lg"
            ? "h-11 w-11"
            : size === "sm"
              ? "h-7 w-7"
              : "h-9 w-9";
    const iconSize =
        size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

    return (
        <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className={cn(
                "relative flex shrink-0 items-center justify-center rounded-full",
                "bg-gradient-to-br from-primary/25 via-primary/10 to-primary/5",
                "ring-1 ring-primary/30 shadow-sm",
                dims,
            )}
        >
            <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0, 0.45] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            <Sparkles
                className={cn("relative text-primary", iconSize)}
                strokeWidth={2.1}
            />
        </motion.div>
    );
}

/**
 * Step pips — thin horizontal pills that fill as the user advances. Renders
 * nothing for single-step tours since there's no progress to show.
 */
function StepProgress({
    current,
    total,
}: {
    current: number;
    total: number;
}) {
    if (total <= 1) return null;
    return (
        <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={current + 1}
            className="flex w-full items-center gap-1"
        >
            {Array.from({ length: total }).map((_, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <span
                        key={i}
                        className={cn(
                            "h-[3px] flex-1 rounded-full transition-[background-color,box-shadow] duration-300",
                            done && "bg-primary/80",
                            active &&
                                "bg-primary shadow-[0_0_8px_-1px_rgba(99,102,241,0.55)]",
                            !done && !active && "bg-muted-foreground/20",
                        )}
                    />
                );
            })}
        </div>
    );
}

function SpotlightMask({ rect }: { rect: Rect }) {
    const x = Math.max(0, rect.left - SPOTLIGHT_PAD);
    const y = Math.max(0, rect.top - SPOTLIGHT_PAD);
    const w = rect.width + SPOTLIGHT_PAD * 2;
    const h = rect.height + SPOTLIGHT_PAD * 2;

    const dim =
        "pointer-events-auto absolute bg-[rgba(9,9,11,0.55)] backdrop-blur-[1px]";
    const transition = {
        type: "spring" as const,
        stiffness: 320,
        damping: 34,
        mass: 0.6,
    };

    return (
        <>
            <motion.div
                className={dim}
                style={{ left: 0, right: 0, top: 0 }}
                initial={false}
                animate={{ height: y }}
                transition={transition}
            />
            <motion.div
                className={dim}
                style={{ left: 0, right: 0, bottom: 0 }}
                initial={false}
                animate={{ top: y + h }}
                transition={transition}
            />
            <motion.div
                className={dim}
                style={{ left: 0 }}
                initial={false}
                animate={{ top: y, width: x, height: h }}
                transition={transition}
            />
            <motion.div
                className={dim}
                style={{ right: 0 }}
                initial={false}
                animate={{ top: y, left: x + w, height: h }}
                transition={transition}
            />
            <motion.div
                aria-hidden
                className="pointer-events-none absolute"
                initial={false}
                animate={{ top: y, left: x, width: w, height: h }}
                transition={transition}
                style={{
                    borderRadius: SPOTLIGHT_RADIUS,
                    boxShadow:
                        "inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 50px 6px rgba(255,255,255,0.06)",
                }}
            />
        </>
    );
}

function placementToFloating(
    side?: TourStep["side"],
    align?: TourStep["align"],
): Placement {
    const s = side ?? "bottom";
    if (!align || align === "center") return s as Placement;
    return `${s}-${align}` as Placement;
}

function PopoverCard({
    target,
    title,
    body,
    side,
    align,
    leftSlot,
    rightSlot,
    onClose,
    onTurnOff,
    progress,
}: {
    target?: string;
    title: string;
    body: React.ReactNode;
    side?: TourStep["side"];
    align?: TourStep["align"];
    leftSlot?: React.ReactNode;
    rightSlot: React.ReactNode;
    onClose: () => void;
    onTurnOff: () => void;
    progress?: { current: number; total: number };
}) {
    const arrowRef = React.useRef<SVGSVGElement>(null);
    const { refs, floatingStyles, context } = useFloating({
        placement: placementToFloating(side, align),
        strategy: "fixed",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(14),
            flip({ padding: 16 }),
            shift({ padding: 16 }),
            arrow({ element: arrowRef }),
        ],
    });

    React.useLayoutEffect(() => {
        if (!target) return;
        const el = getTargetEl(target);
        if (el) refs.setReference(el);
    }, [target, refs]);

    // Re-bind reference whenever the target's element identity changes
    // (e.g., the same selector now resolves to a different element after a
    // re-render).
    React.useEffect(() => {
        if (!target) return;
        let frame = 0;
        let last: HTMLElement | null = getTargetEl(target);
        if (last) refs.setReference(last);
        const tick = () => {
            const current = getTargetEl(target);
            if (current && current !== last) {
                last = current;
                refs.setReference(current);
            }
            frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(frame);
    }, [target, refs]);

    return (
        <div
            ref={refs.setFloating}
            style={{
                ...floatingStyles,
                transition:
                    "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), top 220ms cubic-bezier(0.22, 1, 0.36, 1), left 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="pointer-events-auto z-[1001]"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 6 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="relative w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-border/70 bg-popover text-popover-foreground shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:ring-white/5"
            >
                <FloatingArrow
                    ref={arrowRef}
                    context={context}
                    className="fill-popover"
                    stroke="var(--border)"
                    strokeWidth={1}
                    width={14}
                    height={7}
                />
                <div className="relative bg-gradient-to-br from-primary/[0.08] via-primary/[0.02] to-transparent px-5 pt-4 pb-4">
                    <div className="mb-3 flex items-center gap-2.5">
                        <BuddyAvatar size="sm" />
                        <div className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                                Buddy
                            </span>
                            <span className="truncate text-[10.5px] text-muted-foreground">
                                Your console guide
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onTurnOff}
                            aria-label="Turn off Buddy"
                            title="Turn off Buddy"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <BellOff className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Skip tour"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="text-[14px] font-semibold leading-snug tracking-tight">
                        {title}
                    </div>
                    {progress ? (
                        <div className="mt-3">
                            <StepProgress
                                current={progress.current}
                                total={progress.total}
                            />
                        </div>
                    ) : null}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={typeof title === "string" ? title : "step"}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                        }}
                        className="px-5 py-4 text-[13px] leading-relaxed text-foreground/85"
                    >
                        {body}
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/40 px-3.5 py-2.5">
                    <div className="flex items-center">{leftSlot}</div>
                    <div className="flex items-center gap-1.5">
                        {rightSlot}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function CenterCard({
    title,
    body,
    primaryLabel,
    onPrimary,
    onSkip,
    onTurnOff,
    skipLabel,
    keyId,
}: {
    title: string;
    body: React.ReactNode;
    primaryLabel: string;
    onPrimary: () => void;
    onSkip: () => void;
    onTurnOff: () => void;
    skipLabel?: string;
    keyId: string;
}) {
    return (
        <motion.div
            key={keyId}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="pointer-events-auto fixed left-1/2 top-1/2 z-[1001] w-[440px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/70 bg-popover text-popover-foreground shadow-[0_36px_80px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/5 dark:ring-white/5"
        >
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.14] via-primary/[0.04] to-transparent px-7 pt-7 pb-6">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-2xl"
                />
                <button
                    type="button"
                    onClick={onTurnOff}
                    aria-label="Turn off Buddy"
                    title="Turn off Buddy"
                    className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    <BellOff className="h-3.5 w-3.5" />
                </button>
                <div className="relative flex items-center gap-3">
                    <BuddyAvatar size="lg" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                            Buddy
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            Your friendly Wacht guide
                        </span>
                    </div>
                </div>
                <div className="relative mt-5 text-[17px] font-semibold leading-snug tracking-tight">
                    {title}
                </div>
            </div>
            <div className="px-7 py-5 text-[13.5px] leading-relaxed text-foreground/85">
                {body}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/40 px-4 py-3">
                <button
                    type="button"
                    onClick={onSkip}
                    className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                    {skipLabel ?? "Not now"}
                </button>
                <button
                    type="button"
                    onClick={onPrimary}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:brightness-[1.08]"
                >
                    {primaryLabel}
                    <ArrowRight className="h-3 w-3" />
                </button>
            </div>
        </motion.div>
    );
}

function FooterButton({
    onClick,
    variant,
    children,
    disabled,
}: {
    onClick: () => void;
    variant: "primary" | "ghost" | "secondary";
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                variant === "primary" &&
                    "bg-primary text-primary-foreground shadow-sm hover:brightness-[1.08]",
                variant === "ghost" &&
                    "text-muted-foreground hover:bg-background hover:text-foreground",
                variant === "secondary" &&
                    "border border-border bg-transparent text-foreground/80 hover:bg-background hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

export function TourOverlay({ payload }: { payload: ActiveTourPayload }) {
    React.useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                payload.onSkip();
                return;
            }
            if (payload.kind === "linear-step") {
                if (e.key === "ArrowRight" || e.key === "Enter") {
                    e.preventDefault();
                    payload.onNext();
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    payload.onPrev();
                }
            } else if (
                payload.kind === "reactive-step" &&
                !payload.isLastInScene
            ) {
                // Reactive sub-step within a scene: allow keyboard nav, but
                // only when the user isn't typing into an input/textarea (we
                // don't want Enter while filling a form field to advance the
                // tour).
                const target = e.target as HTMLElement | null;
                const inForm =
                    target &&
                    (target.tagName === "INPUT" ||
                        target.tagName === "TEXTAREA" ||
                        target.isContentEditable);
                if (inForm) return;
                if (e.key === "ArrowRight" || e.key === "Enter") {
                    e.preventDefault();
                    payload.onNext();
                } else if (e.key === "ArrowLeft" && payload.stepIndex > 0) {
                    e.preventDefault();
                    payload.onPrev();
                }
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [payload]);

    if (typeof document === "undefined") return null;

    // Intro / centered card mode
    if (payload.kind === "intro") {
        return createPortal(
            <div
                data-tour-overlay
                className="pointer-events-none fixed inset-0 z-[1000]"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-auto absolute inset-0 bg-foreground/45 backdrop-blur-[3px]"
                    onClick={payload.onSkip}
                />
                <AnimatePresence mode="wait">
                    <CenterCard
                        key={`intro-${payload.tour.id}`}
                        keyId={`intro-${payload.tour.id}`}
                        title={payload.tour.intro!.title}
                        body={payload.tour.intro!.body}
                        primaryLabel={
                            payload.tour.intro!.primaryLabel ?? "Show me"
                        }
                        onPrimary={payload.onPrimary}
                        onSkip={payload.onSkip}
                        onTurnOff={payload.onTurnOff}
                    />
                </AnimatePresence>
            </div>,
            document.body,
        );
    }

    // Linear or reactive — both highlight a target.
    const step = payload.step;
    const target = step.target;

    return (
        <TourTargetedFrame
            target={target}
            payload={payload}
            step={step}
        />
    );
}

type TargetedPayload = Exclude<ActiveTourPayload, { kind: "intro" }>;

function TourTargetedFrame({
    target,
    payload,
    step,
}: {
    target?: string;
    payload: TargetedPayload;
    step: TourStep | ReactiveStep;
}) {
    const { rect } = useTargetRect(target);

    const isWaiting = !!target && !rect;

    return createPortal(
        <div
            data-tour-overlay
            className="pointer-events-none fixed inset-0 z-[1000]"
        >
            {rect ? <SpotlightMask rect={rect} /> : null}

            <AnimatePresence mode="wait">
                {target && !rect ? (
                    <WaitingCenter
                        key="waiting"
                        title={step.title}
                        body={step.body}
                        onSkip={payload.onSkip}
                        onTurnOff={payload.onTurnOff}
                    />
                ) : (
                    <PopoverCard
                        key="popover"
                        target={target}
                        title={step.title}
                        body={step.body}
                        side={step.side}
                        align={step.align}
                        onClose={payload.onSkip}
                        onTurnOff={payload.onTurnOff}
                        progress={
                            payload.kind === "linear-step"
                                ? {
                                      current: payload.stepIndex,
                                      total: payload.tour.steps.length,
                                  }
                                : payload.scene.steps.length > 1
                                  ? {
                                        current: payload.stepIndex,
                                        total: payload.scene.steps.length,
                                    }
                                  : undefined
                        }
                        leftSlot={
                            payload.kind === "reactive-step" &&
                            payload.scene.steps.length === 1 ? (
                                <FooterButton
                                    onClick={payload.onSkip}
                                    variant="ghost"
                                >
                                    Skip tour
                                </FooterButton>
                            ) : (
                                <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                    Step{" "}
                                    {payload.kind === "linear-step"
                                        ? `${payload.stepIndex + 1} of ${payload.tour.steps.length}`
                                        : `${payload.stepIndex + 1} of ${payload.scene.steps.length}`}
                                </span>
                            )
                        }
                        rightSlot={
                            payload.kind === "linear-step" ? (
                                <>
                                    {!payload.isFirst ? (
                                        <FooterButton
                                            onClick={payload.onPrev}
                                            variant="ghost"
                                        >
                                            <ArrowLeft className="h-3 w-3" />
                                            Back
                                        </FooterButton>
                                    ) : null}
                                    <FooterButton
                                        onClick={payload.onNext}
                                        variant="primary"
                                        disabled={isWaiting}
                                    >
                                        {payload.isLast ? "Done" : "Next"}
                                        {!payload.isLast ? (
                                            <ArrowRight className="h-3 w-3" />
                                        ) : null}
                                    </FooterButton>
                                </>
                            ) : !payload.isLastInScene ? (
                                <>
                                    {payload.stepIndex > 0 ? (
                                        <FooterButton
                                            onClick={payload.onPrev}
                                            variant="ghost"
                                        >
                                            <ArrowLeft className="h-3 w-3" />
                                            Back
                                        </FooterButton>
                                    ) : null}
                                    <FooterButton
                                        onClick={payload.onNext}
                                        variant="primary"
                                        disabled={isWaiting}
                                    >
                                        Next
                                        <ArrowRight className="h-3 w-3" />
                                    </FooterButton>
                                </>
                            ) : (
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    Click the highlighted button to continue
                                </span>
                            )
                        }
                    />
                )}
            </AnimatePresence>
        </div>,
        document.body,
    );
}

function WaitingCenter({
    title,
    body,
    onSkip,
    onTurnOff,
}: {
    title: string;
    body: React.ReactNode;
    onSkip: () => void;
    onTurnOff: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto fixed left-1/2 top-1/2 z-[1001] w-[380px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/30"
        >
            <div className="relative bg-gradient-to-br from-primary/[0.08] via-primary/[0.02] to-transparent px-5 pt-4 pb-4">
                <div className="mb-3 flex items-center gap-2.5">
                    <BuddyAvatar size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-primary">
                            Buddy
                        </span>
                        <span className="truncate text-[10.5px] text-muted-foreground">
                            Your console guide
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onTurnOff}
                        aria-label="Turn off Buddy"
                        title="Turn off Buddy"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <BellOff className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={onSkip}
                        aria-label="Skip tour"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="text-[14px] font-semibold leading-snug tracking-tight">
                    {title}
                </div>
            </div>
            <div className="px-4 py-4 text-[13px] leading-relaxed text-foreground/85">
                {body}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/50 px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    Waiting…
                </span>
                <FooterButton onClick={onSkip} variant="ghost">
                    Skip tour
                </FooterButton>
            </div>
        </motion.div>
    );
}
