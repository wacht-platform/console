import * as React from "react"
import { cn } from "@/lib/utils"

function FieldCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="field-card"
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      {children}
    </div>
  )
}

function FieldRow({
  label,
  desc,
  children,
  tour,
  align = "center",
  endAlign = false,
}: {
  label: React.ReactNode
  desc?: React.ReactNode
  children: React.ReactNode
  tour?: string
  align?: "center" | "start"
  endAlign?: boolean
}) {
  return (
    <div
      data-tour-id={tour}
      className={cn(
        "grid gap-2.5 px-6 py-5 sm:grid-cols-[300px_1fr] sm:gap-8",
        align === "center" ? "sm:items-center" : "sm:items-start"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {desc}
          </p>
        ) : null}
      </div>
      <div className={cn("min-w-0 sm:max-w-md", endAlign && "flex sm:justify-end")}>
        {children}
      </div>
    </div>
  )
}

export { FieldRow, FieldCard }
