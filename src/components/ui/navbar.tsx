"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { LayoutGroup } from "framer-motion";
import type React from "react";
import { forwardRef, useId } from "react";
import { TouchTarget } from "./button";
import { Link } from "./link";

export function Navbar({
	className,
	...props
}: React.ComponentPropsWithoutRef<"nav">) {
	return (
		<nav
			{...props}
			className={clsx(
				className, 
				"flex flex-1 items-center gap-4 py-3"
			)}
		/>
	);
}

export function NavbarDivider({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	return (
		<div
			aria-hidden="true"
			{...props}
			className={clsx(className, "h-5 w-px bg-gray-200")}
		/>
	);
}

export function NavbarSection({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	const id = useId();

	return (
		<LayoutGroup id={id}>
			<div {...props} className={clsx(className, "flex items-center gap-3")} />
		</LayoutGroup>
	);
}

export function NavbarSpacer({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	return (
		<div
			aria-hidden="true"
			{...props}
			className={clsx(className, "flex-1")}
		/>
	);
}

export const NavbarItem = forwardRef(function NavbarItem(
	{
		current,
		className,
		children,
		...props
	}: { current?: boolean; className?: string; children: React.ReactNode } & (
		| Omit<Headless.ButtonProps, "as" | "className">
		| Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
	),
	ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>,
) {
	const classes = clsx(
		// Base
		"relative flex min-w-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
		// Colors
		"text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100",
		"hover:bg-gray-100",
		"transition-colors",
		// Icons
		"*:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0",
		"*:data-[slot=avatar]:size-6 *:data-[slot=avatar]:shrink-0",
		// Current state
		current && "text-zinc-900 dark:text-zinc-100 bg-gray-100",
	);

	return (
		<span className={clsx(className, "relative")}>
			{"href" in props ? (
				<Link
					{...props}
					className={classes}
					data-current={current ? "true" : undefined}
					ref={ref as React.ForwardedRef<HTMLAnchorElement>}
				>
					<TouchTarget>{children}</TouchTarget>
				</Link>
			) : (
				<Headless.Button
					{...props}
					className={classes}
					data-current={current ? "true" : undefined}
					ref={ref}
				>
					<TouchTarget>{children}</TouchTarget>
				</Headless.Button>
			)}
		</span>
	);
});

export function NavbarLabel({
	className,
	...props
}: React.ComponentPropsWithoutRef<"span">) {
	return <span {...props} className={clsx(className, "truncate")} />;
}