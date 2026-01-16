import * as React from "react"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select"
import { cn } from "@/lib/utils"

export function Listbox<T extends string>({
	className,
	placeholder,
	autoFocus,
	"aria-label": ariaLabel,
	children,
	value,
	onChange,
	...props
}: {
	className?: string;
	placeholder?: React.ReactNode;
	autoFocus?: boolean;
	"aria-label"?: string;
	children?: React.ReactNode;
	value?: T;
	name?: string;
	onChange?: (value: T) => void;
}) {
	return (
		<Select value={value} onValueChange={onChange} name={props.name}>
			<SelectTrigger className={className} autoFocus={autoFocus} aria-label={ariaLabel}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{children}
			</SelectContent>
		</Select>
	)
}

export function ListboxOption<T>({
	children,
	className,
	value,
	...props
}: { className?: string; children?: React.ReactNode; value: T }) {
	// Radix SelectItem value must be string
	const strValue = String(value);
	return (
		<SelectItem value={strValue} className={className} {...props}>
			{children}
		</SelectItem>
	)
}

export function ListboxLabel({
	className,
	...props
}: React.ComponentPropsWithoutRef<"span">) {
	// Shadcn SelectItem handles the label rendering inside children usually
	return (
		<span
			{...props}
			className={cn(className, "truncate")}
		/>
	)
}

export function ListboxDescription({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<"span">) {
	return (
		<span
			{...props}
			className={cn(
				className,
				"text-xs text-muted-foreground ml-2"
			)}
		>
			{children}
		</span>
	)
}

