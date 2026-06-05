import { Button } from "./button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  /** Tighter padding/tile for an empty *section* (vs. a whole empty screen). */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-9" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:!text-primary",
          compact ? "size-9 [&_svg]:!size-4" : "size-11 [&_svg]:!size-5",
        )}
      >
        {icon ?? (
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-[13px]" : "text-sm",
          )}
        >
          {title}
        </p>
        {description && (
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={compact ? "sm" : "default"}
          className="mt-1"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
