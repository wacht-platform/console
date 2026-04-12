import { Spinner } from "./ui/app-spinner";

interface LoadingFallbackProps {
	message?: string;
	variant?: "default" | "minimal" | "detailed";
	size?: "sm" | "md" | "lg";
}

export const LoadingFallback = ({
	message,
	variant = "default",
	size = "md",
}: LoadingFallbackProps) => {
	if (variant === "minimal") {
		return (
			<div className="flex items-center justify-center p-4">
				<Spinner size={size} />
			</div>
		);
	}

	if (variant === "detailed") {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-white dark:bg-zinc-900">
				<div className="flex flex-col items-center gap-4 p-8">
					<Spinner size="lg" />
					{message && (
						<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
					)}
				</div>
			</div>
		);
	}

	// Default variant
	return (
		<div className="flex items-center justify-center min-h-[120px] w-full">
			<div className="flex flex-col items-center gap-3">
				<Spinner size={size} />
				{message && (
					<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
				)}
			</div>
		</div>
	);
};
