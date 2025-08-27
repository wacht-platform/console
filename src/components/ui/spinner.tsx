import clsx from "clsx";

export interface SpinnerProps {
	className?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
	xs: "w-3 h-3 border",
	sm: "w-4 h-4 border",
	md: "w-5 h-5 border-2",
	lg: "w-6 h-6 border-2",
	xl: "w-8 h-8 border-2",
};

export function Spinner({
	className,
	size = "md",
}: SpinnerProps) {
	return (
		<div
			className={clsx(
				"border-zinc-200 border-t-zinc-600 rounded-full animate-spin",
				"dark:border-zinc-700 dark:border-t-zinc-300",
				sizeClasses[size],
				className,
			)}
		/>
	);
}
