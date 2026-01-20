import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  open,
  onClose,
  onOpenChange,
  children,
  size, // Ignored for now, handled by shadcn fixed max-width
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  onClose?: (open: boolean) => void
  size?: string // Legacy prop support
}) {
  // Compatibility: handle onClose for Headless UI style usage
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    }
    if (onClose) {
      onClose(newOpen)
    }
  }

  // If we have direct children that are not Trigger/Content, we assume legacy mode
  // and wrap them in Content automatically if needed, or expects children to include Content
  // But legacy usage was: <Dialog open={...}> <DialogPanel>...</DialogPanel> </Dialog>
  // Actually Headless UI usage was:
  // <Dialog open={isOpen} onClose={setIsOpen}>
  //   <DialogPanel>
  //     <DialogTitle>...</DialogTitle>
  //     ...
  //   </DialogPanel>
  // </Dialog>

  // Shadcn usage:
  // <Dialog>
  //   <DialogTrigger />
  //   <DialogContent />
  // </Dialog>

  // Hybrid approach:
  // If `open` is provided, we use controlled mode.
  // We need to render the Root.
  // If children contains text or divs directly, we might need to be careful.
  // Legacy `Dialog` component in console-frontend renders `Dialog` -> `DialogBackdrop` -> `DialogPanel`.
  // We will simply render Root here. The children are responsible for rendering Content.
  // BUT: Legacy children usage often includes the Panel directly.
  // In Shadcn, content must be inside `DialogContent`.

  // Let's modify the legacy usages to use the new structure, OR
  // Adapting this component to auto-wrap is hard because DialogContent renders a Portal.

  // STRATEGY: We will keep standard Shadcn exports.
  // AND we will add a "CompatDialog" wrapper that behaves like the old one if needed, 
  // OR simpler: We assume refactoring of usages is required (as per plan).
  // BUT the instruction was to "refactor usages".

  // However, to make the migration easier, let's keep the standard exports cleanly 
  // and handle the "open/onClose" bridging in the Root.

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      data-slot="dialog"
      {...props}
    >
      {children}
    </DialogPrimitive.Root>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 z-50 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-normal", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

// Compatibility Components for Legacy Usage
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("py-4", className)} {...props} />
}

function DialogActions({ className, ...props }: React.ComponentProps<"div">) {
  return <DialogFooter className={className} {...props} />
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
  // Compat exports
  DialogBody,
  DialogActions,
}
