import clsx from "clsx";

export function Divider({
	soft = false,
	className,
	...props
}: { soft?: boolean } & React.ComponentPropsWithoutRef<"hr">) {
	return (
		<hr
			{...props}
			className={clsx(
				className,
				"w-full border-t",
				soft && "border-border/40",
				!soft && "border-border",
			)}
		/>
	);
}
