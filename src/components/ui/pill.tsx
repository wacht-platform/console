import * as React from "react"
import { cn } from "@/lib/utils"

type PillTone = "ok" | "info" | "warn" | "err" | "mute"

const dotTone: Record<PillTone, string> = {
  ok: "bg-emerald-500",
  info: "bg-blue-500",
  warn: "bg-amber-500",
  err: "bg-red-500",
  mute: "bg-muted-foreground",
}

function Pill({
  tone = "mute",
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { tone?: PillTone }) {
  return (
    <span
      data-slot="pill"
      className={cn(
        "inline-flex h-[22px] w-fit items-center gap-1.5 rounded-sm border border-border bg-secondary px-2 font-mono text-[11px] font-medium lowercase text-secondary-foreground",
        className
      )}
      {...props}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotTone[tone])} />
      {children}
    </span>
  )
}

export { Pill, type PillTone }
