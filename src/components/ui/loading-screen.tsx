import { motion } from "framer-motion";
import { Spinner } from "./spinner";
import { SkeletonTable, SkeletonList, SkeletonCard, SkeletonProjectCard } from "./skeleton";

interface LoadingScreenProps {
	type?: "page" | "table" | "list" | "card" | "inline";
	message?: string;
	className?: string;
	rows?: number;
	items?: number;
}

export function LoadingScreen({
	type = "page",
	message = "Loading...",
	className = "",
	rows = 5,
	items = 3,
}: LoadingScreenProps) {
	if (type === "table") {
		return <SkeletonTable rows={rows} />;
	}

	if (type === "list") {
		return <SkeletonList items={items} />;
	}

	if (type === "card") {
		return <SkeletonCard />;
	}

	if (type === "inline") {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<Spinner size="sm" />
				<span className="text-sm text-muted-foreground">{message}</span>
			</div>
		);
	}

	// Default "page" type
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className={`flex min-h-[400px] w-full items-center justify-center ${className}`}
		>
			<div className="flex flex-col items-center gap-4">
				<Spinner size="lg" />
				<span className="text-sm text-muted-foreground">{message}</span>
			</div>
		</motion.div>
	);
}

// Convenience exports for specific loading types
export function PageLoadingScreen({
	message = "Loading...",
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return (
		<LoadingScreen type="page" message={message} className={className} />
	);
}

export function TableLoadingScreen({
	rows = 5,
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return <LoadingScreen type="table" rows={rows} className={className} />;
}

export function ListLoadingScreen({
	items = 3,
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return <LoadingScreen type="list" items={items} className={className} />;
}

export function CardLoadingScreen({
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return <LoadingScreen type="card" className={className} />;
}

export function InlineLoadingScreen({
	message = "Loading...",
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return (
		<LoadingScreen type="inline" message={message} className={className} />
	);
}

export function ProjectLoadingGrid({
	items = 6,
	className = "",
}: {
	items?: number;
	className?: string;
}) {
	return (
		<div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
			{Array.from({ length: items }).map((_, index) => (
				<SkeletonProjectCard key={`project-skeleton-${index}`} />
			))}
		</div>
	);
}

export function AppLoading() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-neutral-950"
		>
			<div className="relative flex flex-col items-center gap-8">
				{/* Branded Pulse Animation */}
				<div className="relative h-16 w-16">
					<motion.div
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.3, 0.1, 0.3],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						className="absolute inset-0 rounded-2xl bg-blue-500 blur-xl"
					/>
					<motion.div
						animate={{
							scale: [1, 1.05, 1],
						}}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						className="relative flex h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl shadow-blue-500/10"
					>
						<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 p-1.5">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="h-full w-full text-white"
							>
								<path
									d="M12 4L4 8L12 12L20 8L12 4Z"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M4 12L12 16L20 12"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M4 16L12 20L20 16"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
}

export function InlineLoader() {
	return (
		<div className="flex items-center justify-center min-h-[400px] w-full">
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.2 }}
				className="relative h-12 w-12"
			>
				<motion.div
					animate={{
						rotate: 360,
					}}
					transition={{
						duration: 1,
						repeat: Infinity,
						ease: "linear",
					}}
					className="h-full w-full rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-blue-600 dark:border-t-blue-400"
				/>
			</motion.div>
		</div>
	);
}