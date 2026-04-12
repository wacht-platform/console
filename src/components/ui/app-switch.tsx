import * as React from "react"
import { cn } from "@/lib/utils"
import { Field } from "@/components/ui/fieldset"

export function SwitchField({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const childrenArray = React.Children.toArray(children)
  const content = childrenArray.slice(0, -1)
  const control = childrenArray.slice(-1)

  return (
    <Field
      className={cn("flex flex-row items-center justify-between py-2.5", className)}
      {...props}
    >
      <div className="flex flex-col space-y-1">{content}</div>
      {control}
    </Field>
  )
}

export function SwitchGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
}
