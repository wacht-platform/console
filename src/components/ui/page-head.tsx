import * as React from "react"
import { cn } from "@/lib/utils"

function PageHead({
  eyebrow,
  title,
  sub,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="page-head"
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {sub ? (
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export { PageHead }
