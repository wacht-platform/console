import * as React from "react"
import { cn } from "@/lib/utils"

function Tag({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex h-5 w-fit items-center rounded-sm bg-primary/10 px-[7px] font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-primary",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Tag }
