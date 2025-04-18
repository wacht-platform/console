import * as Headless from "@headlessui/react";
import type React from "react";
import { forwardRef } from "react";
import { Link as RouterLink } from "react-router";

export const Link = forwardRef(function Link(
	props: { href: string } & React.ComponentPropsWithoutRef<"a">,
	ref: React.ForwardedRef<HTMLAnchorElement>,
) {
	return (
		<Headless.DataInteractive>
			<RouterLink to={props.href} {...props} ref={ref} />
		</Headless.DataInteractive>
	);
});
