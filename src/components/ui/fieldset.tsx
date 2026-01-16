import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

const FieldContext = React.createContext<{ id: string } | undefined>(undefined)

export function Field({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FieldContext.Provider value={{ id }}>
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </FieldContext.Provider>
  )
}

export function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />
}

export function Fieldset({
  className,
  ...props
}: React.ComponentProps<"fieldset">) {
  return <fieldset className={cn("flex flex-col gap-6", className)} {...props} />
}

export function Legend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      className={cn("text-base font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground", className)}
      {...props}
    />
  )
}

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { id } = React.useContext(FieldContext) || {}

  return (
    <LabelPrimitive.Root
      htmlFor={id}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
        className
      )}
      {...props}
    />
  )
}

export function Description({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
}

export function ErrorMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    />
  )
}

export { useId } from "react"
export const useFieldContext = () => React.useContext(FieldContext)
