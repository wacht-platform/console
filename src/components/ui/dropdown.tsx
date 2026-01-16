import * as React from "react"
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./dropdown-menu"
import { Button } from "./button"
import { cn } from "@/lib/utils"

// Legacy <Dropdown> is now the Root
export function Dropdown({ children, ...props }: React.ComponentProps<typeof ShadcnDropdownMenu>) {
  return <ShadcnDropdownMenu {...props}>{children}</ShadcnDropdownMenu>
}

// Legacy <DropdownButton> is the Trigger
export function DropdownButton({
  as: Component = Button,
  className,
  children,
  ...props
}: { as?: any, className?: string } & React.ComponentProps<typeof DropdownMenuTrigger>) {
  // If 'as' is provided, we might need to handle it carefully or just wrap it.
  // Radix Trigger usually wraps its child.
  return (
    <DropdownMenuTrigger asChild>
      <Component className={className} {...props}>
        {children}
      </Component>
    </DropdownMenuTrigger>
  )
}

// Legacy <DropdownMenu> was the Content container
export function DropdownMenu({
  className,
  anchor,
  children,
  ...props
}: { className?: string; anchor?: any } & React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent className={className} {...props}>
      {children}
    </DropdownMenuContent>
  )
}

// Legacy <DropdownItem>
export function DropdownItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem> & { href?: string }) {
  if (props.href) {
    return (
      <DropdownMenuItem className={className} asChild>
        <a href={props.href} {...(props as any)}>{children}</a>
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuItem className={className} {...props}>
      {children}
    </DropdownMenuItem>
  )
}

export function DropdownHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2 py-1.5 text-sm font-normal", className)} {...props} />
}

export function DropdownSection({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 py-1", className)} {...props} />
}

export function DropdownHeading({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel className={className} {...props} />
}

export function DropdownDivider({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return <DropdownMenuSeparator className={className} {...props} />
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel className={className} {...props} />
}

export function DropdownDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2 py-1 text-xs text-muted-foreground", className)} {...props} />
}

export function DropdownShortcut({ keys, className, ...props }: { keys: string | string[] } & React.ComponentProps<"span">) {
  const k = Array.isArray(keys) ? keys.join(" ") : keys;
  return (
    <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props}>
      {k}
    </span>
  )
}

// Expose other shadcn components directly under compatible names or new ones
export {
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
}
