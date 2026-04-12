import { cn } from "@/lib/utils"
import { IconLoader } from "@tabler/icons-react"

export interface SpinnerProps extends React.ComponentProps<typeof IconLoader> {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
} as const

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <IconLoader
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", sizeClasses[size], className)}
      {...props}
    />
  )
}

export { Spinner }
