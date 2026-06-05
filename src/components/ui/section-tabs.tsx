import { Link } from "react-router";
import { cn } from "@/lib/utils";

export type SectionTab = {
    label: string;
    to: string;
    active: boolean;
};

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
    return (
        <div className="inline-flex h-8 w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-border bg-secondary p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
                <Link
                    key={tab.to}
                    to={tab.to}
                    className={cn(
                        "inline-flex h-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-[13px] font-medium transition-colors",
                        tab.active
                            ? "bg-card text-foreground shadow-[0_0_0_0.5px_var(--input),0_1px_2px_rgba(0,0,0,0.06)]"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
