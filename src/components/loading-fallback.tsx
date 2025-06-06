import { motion } from "framer-motion";
import { Spinner } from "./ui/spinner";

interface LoadingFallbackProps {
	message?: string;
	variant?: "default" | "minimal" | "detailed";
	size?: "sm" | "md" | "lg";
}

export const LoadingFallback = ({
	variant = "default",
	size = "sm",
}: LoadingFallbackProps) => {
	if (variant === "minimal") {
		return (
			<div className="flex items-center justify-center p-4">
				<Spinner size={size} variant="dots" color="primary" />
			</div>
		);
	}

	if (variant === "detailed") {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-white dark:bg-zinc-900">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="flex flex-col items-center gap-6 p-8"
				>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="relative"
					>
						<div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
						<Spinner size="xl" variant="ring" color="primary" />
					</motion.div>
				</motion.div>
			</div>
		);
	}

	// Default variant
	return (
		<div className="flex items-center justify-center min-h-[120px] w-full">
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex flex-col items-center gap-2"
			>
				<Spinner
					size={size === "lg" ? "md" : size}
					variant="dots"
					color="primary"
				/>
			</motion.div>
		</div>
	);
};
