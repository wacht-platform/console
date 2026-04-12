import * as React from "react"
import { cn } from "@/lib/utils"

export function CheckboxField({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="checkbox-field"
      className={cn("flex flex-row items-start space-x-3 space-y-0", className)}
      {...props}
    />
  )
}
