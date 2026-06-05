import { motion } from "framer-motion";
import { Spinner } from "./app-spinner";
import { Skeleton } from "./skeleton";
import { SkeletonTable, SkeletonList, SkeletonCard } from "./app-skeleton";

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
		<div className={`overflow-hidden rounded-xl border border-border/80 bg-card ${className}`}>
			<div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_120px_130px_28px] items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-2 md:grid">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-3 w-14" />
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-3 w-3 rounded-sm" />
			</div>

			<div>
				{Array.from({ length: items }).map((_, index) => (
					<div
						key={`project-row-skeleton-${index}`}
						className={`px-4 py-3 ${index === 0 ? "" : "border-t border-border/70"}`}
					>
						<div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_120px_130px_28px] md:items-center">
							<div className="min-w-0">
								<div className="flex items-center gap-3">
									<Skeleton className="h-8 w-8 rounded-md" />
									<div className="min-w-0 space-y-2">
										<Skeleton className="h-3 w-36" />
										<Skeleton className="h-3 w-28 md:hidden" />
									</div>
								</div>
							</div>
							<Skeleton className="hidden h-3 w-40 md:block" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-10 rounded-md" />
								<Skeleton className="h-4 w-14 rounded-md" />
							</div>
							<Skeleton className="h-3 w-8" />
							<Skeleton className="h-3 w-20" />
							<Skeleton className="hidden h-4 w-4 rounded-sm md:block" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function AppLoading() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-card"
		>
			<div className="relative h-16 w-16">
				<motion.div
					animate={{
						scale: [1, 1.07, 1],
					}}
					transition={{
						duration: 1.8,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					className="flex h-full w-full items-center justify-center rounded-[18px] border border-border bg-[oklch(1_0_0)] shadow-lg shadow-black/10"
				>
					<img
						src="/favicon.ico"
						alt="Wacht"
						className="h-9 w-9 object-contain"
					/>
				</motion.div>
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
					className="h-full w-full rounded-full border-2 border-border dark:border-border border-t-blue-600 dark:border-t-blue-400"
				/>
			</motion.div>
		</div>
	);
}
