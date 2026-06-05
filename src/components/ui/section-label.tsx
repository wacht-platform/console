import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionLabel({
    children,
    action,
}: {
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div
            className={cn(
                "relative flex items-center gap-3",
                action && "min-h-8",
            )}
        >
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {children}
            </span>
            <div className="h-px flex-1 bg-border" />
            {action ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-background pl-3">
                    {action}
                </div>
            ) : null}
        </div>
    );
}
