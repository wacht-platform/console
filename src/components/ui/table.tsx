import clsx from "clsx";
import type React from "react";
import { createContext, useContext, useState } from "react";
import { Link } from "./link";

const TableContext = createContext<{
	bleed: boolean;
	dense: boolean;
	grid: boolean;
	striped: boolean;
	modern: boolean;
}>({
	bleed: false,
	dense: false,
	grid: false,
	striped: false,
	modern: false,
});

export function Table({
	bleed = false,
	dense = false,
	grid = false,
	striped = false,
	modern = false,
	className,
	children,
	...props
}: {
	bleed?: boolean;
	dense?: boolean;
	grid?: boolean;
	striped?: boolean;
	modern?: boolean;
} & React.ComponentPropsWithoutRef<"div">) {
	return (
		<TableContext.Provider
			value={
				{ bleed, dense, grid, striped, modern } as React.ContextType<
					typeof TableContext
				>
			}
		>
			<div className="flow-root">
				<div
					{...props}
					className={clsx(
						className,
						"-mx-(--gutter) overflow-x-auto whitespace-nowrap",
					)}
				>
					<div
						className={clsx(
							"inline-block min-w-full align-middle",
							!bleed && "sm:px-(--gutter)",
						)}
					>
						<div
							className={clsx(
								modern &&
									"rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800",
							)}
						>
							<table
								className={clsx(
									"min-w-full text-left text-sm/6",
									modern
										? ["text-zinc-950 dark:text-zinc-200"]
										: ["text-zinc-950 dark:text-white"],
								)}
							>
								{children}
							</table>
						</div>
					</div>
				</div>
			</div>
		</TableContext.Provider>
	);
}

export function TableHead({
	className,
	...props
}: React.ComponentPropsWithoutRef<"thead">) {
	const { modern } = useContext(TableContext);
	return (
		<thead
			{...props}
			className={clsx(
				className,
				modern
					? "text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900"
					: "text-zinc-500 dark:text-zinc-400",
			)}
		/>
	);
}

export function TableBody(props: React.ComponentPropsWithoutRef<"tbody">) {
	return <tbody {...props} />;
}

const TableRowContext = createContext<{
	href?: string;
	target?: string;
	title?: string;
}>({
	href: undefined,
	target: undefined,
	title: undefined,
});

export function TableRow({
	href,
	target,
	title,
	className,
	...props
}: {
	href?: string;
	target?: string;
	title?: string;
} & React.ComponentPropsWithoutRef<"tr">) {
	const { striped } = useContext(TableContext);

	return (
		<TableRowContext.Provider
			value={
				{ href, target, title } as React.ContextType<typeof TableRowContext>
			}
		>
			<tr
				{...props}
				className={clsx(
					className,
					href &&
						"has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2 has-[[data-row-link][data-focus]]:outline-blue-500 dark:focus-within:bg-white/[2.5%]",
					striped && "even:bg-zinc-950/[2.5%] dark:even:bg-white/[2.5%]",
					href && striped && "hover:bg-zinc-950/5 dark:hover:bg-white/5",
					href &&
						!striped &&
						"hover:bg-zinc-950/[2.5%] dark:hover:bg-white/[2.5%]",
				)}
			/>
		</TableRowContext.Provider>
	);
}

export function TableHeader({
	className,
	...props
}: React.ComponentPropsWithoutRef<"th">) {
	const { bleed, grid, modern } = useContext(TableContext);

	return (
		<th
			{...props}
			className={clsx(
				className,
				modern
					? [
							"border-b border-zinc-200 px-4 py-3 font-medium first:pl-(--gutter,--spacing(4)) last:pr-(--gutter,--spacing(4)) dark:border-zinc-800",
							"first:first-of-type:rounded-tl-lg last:last-of-type:rounded-tr-lg",
						]
					: [
							"border-b border-b-zinc-950/10 px-4 py-2 font-medium first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2)) dark:border-b-white/10",
						],
				grid &&
					modern &&
					"border-l border-l-zinc-200 first:border-l-0 dark:border-l-zinc-800",
				grid &&
					!modern &&
					"border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5",
				!bleed && modern && "sm:first:pl-5 sm:last:pr-5",
				!bleed && !modern && "sm:first:pl-1 sm:last:pr-1",
			)}
		/>
	);
}

export function TableCell({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<"td">) {
	const { bleed, dense, grid, striped, modern } = useContext(TableContext);
	const { href, target, title } = useContext(TableRowContext);
	const [cellRef, setCellRef] = useState<HTMLElement | null>(null);

	return (
		<td
			ref={href ? setCellRef : undefined}
			{...props}
			className={clsx(
				className,
				modern
					? [
							"relative px-5 first:pl-(--gutter,--spacing(4)) last:pr-(--gutter,--spacing(4))",
							"last-of-type:first:last-of-type:rounded-bl-lg last-of-type:last:last-of-type:rounded-br-lg",
						]
					: [
							"relative px-4 first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))",
						],
				!striped && modern && "border-b border-zinc-200 dark:border-zinc-800",
				!striped && !modern && "border-b border-zinc-950/5 dark:border-white/5",
				grid &&
					modern &&
					"border-l border-l-zinc-200 first:border-l-0 dark:border-l-zinc-800",
				grid &&
					!modern &&
					"border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5",
				dense ? "py-2.5" : "py-4",
				!bleed && modern && "sm:first:pl-5 sm:last:pr-5",
				!bleed && !modern && "sm:first:pl-1 sm:last:pr-1",
			)}
		>
			{href && (
				<Link
					data-row-link
					href={href}
					target={target}
					aria-label={title}
					tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
					className="absolute inset-0 focus:outline-hidden"
				/>
			)}
			{children}
		</td>
	);
}
