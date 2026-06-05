import * as React from "react"
import { cn } from "@/lib/utils"

type SegmentedOption<T extends string> = {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
}) {
  return (
    <div
      data-slot="segmented"
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          data-state={value === opt.value ? "on" : "off"}
          className={cn(
            "inline-flex h-full items-center gap-1.5 rounded-sm px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
            value === opt.value
              ? "bg-card text-foreground shadow-[0_0_0_0.5px_var(--input),0_1px_2px_rgba(0,0,0,0.06)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export { Segmented, type SegmentedOption }
