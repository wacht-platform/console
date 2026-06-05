import { cn } from "@/lib/utils";
import * as React from "react";

const noteVariants = {
    info: "bg-secondary border-border text-foreground",
    warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-100",
    error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-100",
    success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-900 dark:text-green-100",
};

interface NoteProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof noteVariants;
}

export function Note({ className, variant = "info", children, ...props }: NoteProps) {
    return (
        <div
            className={cn(
                "flex gap-3 rounded-lg border p-4 text-sm",
                noteVariants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function NoteTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h5
            className={cn("mb-1 font-medium leading-none tracking-tight", className)}
            {...props}
        />
    );
}

export function NoteDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <div
            className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
            {...props}
        />
    );
}
