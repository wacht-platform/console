"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
  {
    variants: {
      variant: {
        // Underline tab strip (matches the design's wa-tabs).
        // Scrolls horizontally instead of overflowing on narrow / mobile views.
        default:
          "h-9 w-full max-w-full justify-start gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] group-data-vertical/tabs:h-fit group-data-vertical/tabs:w-fit group-data-vertical/tabs:overflow-visible group-data-vertical/tabs:border-b-0 [&::-webkit-scrollbar]:hidden",
        line: "h-9 w-full max-w-full justify-start gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // Segmented control — matches the shared Segmented component.
        pill: "h-8 w-fit items-center gap-0.5 rounded-md border border-border bg-secondary p-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Underline tab (default / line). Accent underline + foreground text when active.
        "relative -mb-px inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap border-b-[1.5px] border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:border-primary data-active:text-foreground group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:border-b-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Segmented control overrides — matches the shared Segmented component.
        "group-data-[variant=pill]/tabs-list:mb-0 group-data-[variant=pill]/tabs-list:h-full group-data-[variant=pill]/tabs-list:rounded-sm group-data-[variant=pill]/tabs-list:border-0 group-data-[variant=pill]/tabs-list:px-3 group-data-[variant=pill]/tabs-list:text-[13px] group-data-[variant=pill]/tabs-list:data-active:bg-card group-data-[variant=pill]/tabs-list:data-active:text-foreground group-data-[variant=pill]/tabs-list:data-active:shadow-[0_0_0_0.5px_var(--input),0_1px_2px_rgba(0,0,0,0.06)]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
