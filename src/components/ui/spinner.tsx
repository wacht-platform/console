import clsx from "clsx";

export interface SpinnerProps {
	className?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	variant?: "default" | "dots" | "pulse" | "bounce" | "ring";
	color?: "primary" | "secondary" | "white" | "gray";
}

const sizeClasses = {
	xs: "w-3 h-3",
	sm: "w-4 h-4",
	md: "w-6 h-6",
	lg: "w-8 h-8",
	xl: "w-12 h-12",
};

const colorClasses = {
	primary: "border-blue-500 text-blue-500",
	secondary: "border-zinc-500 text-zinc-500",
	white: "border-white text-white",
	gray: "border-gray-500 text-gray-500",
};

export function Spinner({
	className,
	size = "md",
	variant = "default",
	color = "primary",
}: SpinnerProps) {
	const baseClasses = sizeClasses[size];
	const colorClass = colorClasses[color];

	if (variant === "dots") {
		return (
			<div className={clsx("flex space-x-1", className)}>
				<div
					className={clsx(
						"rounded-full loading-bounce",
						baseClasses,
						colorClass.split(" ")[1],
					)}
					style={{ animationDelay: "0ms", backgroundColor: "currentColor" }}
				/>
				<div
					className={clsx(
						"rounded-full loading-bounce",
						baseClasses,
						colorClass.split(" ")[1],
					)}
					style={{ animationDelay: "150ms", backgroundColor: "currentColor" }}
				/>
				<div
					className={clsx(
						"rounded-full loading-bounce",
						baseClasses,
						colorClass.split(" ")[1],
					)}
					style={{ animationDelay: "300ms", backgroundColor: "currentColor" }}
				/>
			</div>
		);
	}

	if (variant === "pulse") {
		return (
			<div
				className={clsx(
					"rounded-full loading-pulse",
					baseClasses,
					colorClass.split(" ")[1],
				)}
				style={{ backgroundColor: "currentColor" }}
			/>
		);
	}

	if (variant === "bounce") {
		return (
			<div
				className={clsx(
					"rounded-full loading-bounce",
					baseClasses,
					colorClass.split(" ")[1],
				)}
				style={{ backgroundColor: "currentColor" }}
			/>
		);
	}

	if (variant === "ring") {
		return (
			<div
				className={clsx(
					"border-4 border-transparent rounded-full loading-spin",
					baseClasses,
					colorClass,
				)}
			>
				<div
					className={clsx(
						"border-4 border-current border-t-transparent rounded-full",
						baseClasses,
					)}
				/>
			</div>
		);
	}

	// Default spinner
	return (
		<div
			className={clsx(
				"border-2 border-transparent border-t-current rounded-full loading-spin",
				baseClasses,
				colorClass,
				className,
			)}
		/>
	);
}
