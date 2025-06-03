import { motion } from "framer-motion";
import { Spinner } from "./spinner";
import { SkeletonTable, SkeletonList, SkeletonCard } from "./skeleton";

interface LoadingScreenProps {
	type?: "page" | "table" | "list" | "card" | "inline";
	message?: string;
	rows?: number;
	columns?: number;
	items?: number;
	className?: string;
}

export function LoadingScreen({
	type = "page",
	message = "Loading...",
	rows = 5,
	columns = 4,
	items = 5,
	className = "",
}: LoadingScreenProps) {
	if (type === "table") {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className={`p-4 ${className}`}
			>
				<div className="flex items-center gap-2 mb-4">
					<Spinner size="sm" variant="dots" color="primary" />
					<p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
				</div>
				<SkeletonTable rows={rows} columns={columns} />
			</motion.div>
		);
	}

	if (type === "list") {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className={`p-4 ${className}`}
			>
				<div className="flex items-center gap-2 mb-4">
					<Spinner size="sm" variant="dots" color="primary" />
					<p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
				</div>
				<SkeletonList items={items} />
			</motion.div>
		);
	}

	if (type === "card") {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className={`p-4 ${className}`}
			>
				<div className="flex items-center gap-2 mb-4">
					<Spinner size="sm" variant="dots" color="primary" />
					<p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: items }).map((_, index) => (
						<SkeletonCard key={`card-${index}`} />
					))}
				</div>
			</motion.div>
		);
	}

	if (type === "inline") {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className={`flex items-center gap-3 p-4 ${className}`}
			>
				<Spinner size="sm" variant="dots" color="primary" />
				<p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
			</motion.div>
		);
	}

	// Default page loading
	return (
		<div
			className={`flex items-center justify-center min-h-[400px] w-full ${className}`}
		>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex flex-col items-center gap-4"
			>
				<Spinner size="lg" variant="ring" color="primary" />
				<p className="text-sm text-zinc-600 dark:text-zinc-400 loading-dots">
					{message}
				</p>
			</motion.div>
		</div>
	);
}

// Convenience components for common use cases
export function TableLoadingScreen({
	message = "Loading data...",
	rows = 5,
	columns = 4,
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return (
		<LoadingScreen
			type="table"
			message={message}
			rows={rows}
			columns={columns}
			className={className}
		/>
	);
}

export function ListLoadingScreen({
	message = "Loading items...",
	items = 5,
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return (
		<LoadingScreen
			type="list"
			message={message}
			items={items}
			className={className}
		/>
	);
}

export function CardLoadingScreen({
	message = "Loading cards...",
	items = 6,
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return (
		<LoadingScreen
			type="card"
			message={message}
			items={items}
			className={className}
		/>
	);
}

export function InlineLoadingScreen({
	message = "Loading...",
	className = "",
}: Omit<LoadingScreenProps, "type">) {
	return (
		<LoadingScreen type="inline" message={message} className={className} />
	);
}
