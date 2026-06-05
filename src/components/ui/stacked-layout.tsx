import { Sheet, SheetContent } from "@/components/ui/sheet";
import type React from "react";
import { useState } from "react";
import { NavbarItem } from "./navbar";



function MobileSidebar({
	open,
	close,
	children,
}: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
	return (
		<Sheet open={open} onOpenChange={close}>
			<SheetContent side="left" className="w-full max-w-xs p-0 bg-card ring-1 shadow-xs ring-border dark:ring-white/10">
				<div className="flex h-full flex-col">
					<div className="-mb-3 px-4 pt-3">
						{/* Close button handled by SheetContent default or we can add custom if needed. 
                 Previous implementation had explicit close button. 
                 Shadcn Sheet has a close button top-right. 
                 The legacy implementation had it inside the navbar item list? No, at the top.
             */}
					</div>
					{children}
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function StackedLayout({
	navbar,
	sidebar,
	children,
}: React.PropsWithChildren<{
	navbar: React.ReactNode;
	sidebar: React.ReactNode;
}>) {
	const [showSidebar, setShowSidebar] = useState(false);

	return (
		<div className="relative isolate flex min-h-svh w-full flex-col bg-card lg:bg-secondary">
			{/* Sidebar on mobile */}
			<MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
				{sidebar}
			</MobileSidebar>

			{/* Navbar */}
			<header className="flex items-center px-4">
				<div className="py-2.5 lg:hidden">
					<NavbarItem
						onClick={() => setShowSidebar(true)}
						aria-label="Open navigation"
					>
						<svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
							<path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
						</svg>
					</NavbarItem>
				</div>
				<div className="min-w-0 flex-1">{navbar}</div>
			</header>

			{/* Content */}
			<main className="flex flex-1 flex-col pb-2 lg:px-2">
				<div className="grow p-6 lg:rounded-lg lg:bg-card lg:p-10 lg:ring-1 lg:shadow-xs lg:ring-border dark:lg:bg-primary dark:lg:ring-white/10">
					<div className="mx-auto max-w-6xl">{children}</div>
				</div>
			</main>
		</div>
	);
}
