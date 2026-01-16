
import type React from "react";
import { forwardRef } from "react";
import { Link as RouterLink } from "react-router";

export const Link = forwardRef(function Link(
	props: { href: string } & React.ComponentPropsWithoutRef<"a">,
	ref: React.ForwardedRef<HTMLAnchorElement>,
) {
	return (
		<RouterLink to={props.href} {...props} ref={ref} />
	);
});
