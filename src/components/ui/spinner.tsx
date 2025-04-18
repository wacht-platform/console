import clsx from "clsx";

export function Spinner({ className }: { className?: string }) {
    return (
        <div className={clsx("w-4 h-4 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin", className)}></div>
    )
}