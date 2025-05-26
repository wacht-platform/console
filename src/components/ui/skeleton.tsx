import clsx from "clsx";

interface SkeletonProps {
	className?: string;
	variant?: "text" | "circular" | "rectangular" | "rounded";
	width?: string | number;
	height?: string | number;
	lines?: number;
}

export function Skeleton({
	className,
	variant = "rectangular",
	width,
	height,
	lines = 1,
}: SkeletonProps) {
	const baseClasses = "loading-shimmer";

	const variantClasses = {
		text: "h-3 rounded",
		circular: "rounded-full",
		rectangular: "rounded-none",
		rounded: "rounded-lg",
	};

	const style = {
		width: typeof width === "number" ? `${width}px` : width,
		height: typeof height === "number" ? `${height}px` : height,
	};

	if (variant === "text" && lines > 1) {
		return (
			<div className={clsx("space-y-1.5", className)}>
				{Array.from({ length: lines }).map((_, index) => (
					<div
						key={`skeleton-line-${index}`}
						className={clsx(baseClasses, variantClasses.text)}
						style={{
							width: index === lines - 1 ? "75%" : "100%",
							height: "12px",
						}}
					/>
				))}
			</div>
		);
	}

	return (
		<div
			className={clsx(baseClasses, variantClasses[variant], className)}
			style={style}
		/>
	);
}

// Predefined skeleton components for common use cases
export function SkeletonText({
	lines = 3,
	className,
}: { lines?: number; className?: string }) {
	return <Skeleton variant="text" lines={lines} className={className} />;
}

export function SkeletonAvatar({
	size = 40,
	className,
}: { size?: number; className?: string }) {
	return (
		<Skeleton
			variant="circular"
			width={size}
			height={size}
			className={className}
		/>
	);
}

export function SkeletonCard({ className }: { className?: string }) {
	return (
		<div className={clsx("p-3 space-y-2", className)}>
			<Skeleton variant="rounded" height={120} />
			<SkeletonText lines={2} />
			<div className="flex items-center space-x-2">
				<SkeletonAvatar size={24} />
				<Skeleton variant="text" width="60%" height={12} />
			</div>
		</div>
	);
}

export function SkeletonTable({
	rows = 5,
	columns = 4,
	className,
}: {
	rows?: number;
	columns?: number;
	className?: string;
}) {
	return (
		<div className={clsx("space-y-2 w-full", className)}>
			{/* Header */}
			<div className="flex space-x-3 w-full">
				{Array.from({ length: columns }).map((_, index) => (
					<Skeleton
						key={`header-${index}`}
						variant="text"
						height={14}
						className="flex-1 min-w-0"
					/>
				))}
			</div>

			{/* Rows */}
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div key={`row-${rowIndex}`} className="flex space-x-3 w-full">
					{Array.from({ length: columns }).map((_, colIndex) => (
						<Skeleton
							key={`cell-${rowIndex}-${colIndex}`}
							variant="text"
							height={12}
							className="flex-1 min-w-0"
						/>
					))}
				</div>
			))}
		</div>
	);
}

export function SkeletonList({
	items = 5,
	className,
}: { items?: number; className?: string }) {
	return (
		<div className={clsx("space-y-3", className)}>
			{Array.from({ length: items }).map((_, index) => (
				<div key={`list-item-${index}`} className="flex items-center space-x-3">
					<SkeletonAvatar size={32} />
					<div className="flex-1 space-y-1.5">
						<Skeleton variant="text" width="40%" height={12} />
						<Skeleton variant="text" width="60%" height={10} />
					</div>
				</div>
			))}
		</div>
	);
}

// New component for table row skeletons that look like actual table rows
export function SkeletonTableRows({
	rows = 5,
	columns = 4,
	className,
}: {
	rows?: number;
	columns?: number;
	className?: string;
}) {
	return (
		<>
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<tr
					key={`skeleton-row-${rowIndex}`}
					className={clsx(
						"border-b border-zinc-950/5 dark:border-white/5",
						className,
					)}
				>
					{Array.from({ length: columns }).map((_, colIndex) => (
						<td
							key={`skeleton-cell-${rowIndex}-${colIndex}`}
							className="relative px-4 py-4 first:pl-2 last:pr-2 sm:first:pl-1 sm:last:pr-1"
						>
							{colIndex === 0 ? (
								// First column with avatar + text (like user column)
								<div className="flex items-center gap-3">
									<SkeletonAvatar size={20} />
									<Skeleton variant="text" width="120px" height={14} />
								</div>
							) : (
								// Other columns with varying text widths
								<Skeleton
									variant="text"
									width={
										colIndex === 1
											? "140px" // Email column
											: colIndex === 2
												? "80px" // Username column
												: colIndex === 3
													? "120px" // Phone column
													: "90px" // Date column
									}
									height={14}
								/>
							)}
						</td>
					))}
				</tr>
			))}
		</>
	);
}
