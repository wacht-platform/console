import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { PageHead } from "@/components/ui/page-head";
import { SectionTabs, type SectionTab } from "@/components/ui/section-tabs";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

export type ManageListContext = {
    search: string;
};

type Section = "api-gateway" | "webhook-apps" | "agent-actors";

const SECTIONS: Record<
    Section,
    { label: string; title: string; sub: string; placeholder: string }
> = {
    "api-gateway": {
        label: "API Gateway",
        title: "API Gateway",
        sub: "API auth apps, keys, rate limits and audit logs for this deployment.",
        placeholder: "Search by slug…",
    },
    "webhook-apps": {
        label: "Webhook Apps",
        title: "Webhook Apps",
        sub: "Webhook apps, endpoints and delivery history for this deployment.",
        placeholder: "Search by slug…",
    },
    "agent-actors": {
        label: "Agent Actors",
        title: "Agent Actors",
        sub: "Identities your agents act on behalf of across this deployment.",
        placeholder: "Search by name or key…",
    },
};

const TAB_ORDER: Section[] = ["api-gateway", "webhook-apps", "agent-actors"];

export default function ManageLayout() {
    const { pathname } = useLocation();
    const { projectId, deploymentId } = useParams();
    const base = `/project/${projectId}/deployment/${deploymentId}/access`;

    const section: Section =
        TAB_ORDER.find((s) => pathname.includes(`/access/${s}`)) ??
        "api-gateway";
    const config = SECTIONS[section];

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);

    // Clear the filter when switching tabs.
    useEffect(() => {
        setSearch("");
    }, [section]);

    const tabs: SectionTab[] = TAB_ORDER.map((s) => ({
        label: SECTIONS[s].label,
        to: `${base}/${s}`,
        active: section === s,
    }));

    const context = useMemo<ManageListContext>(
        () => ({ search: debouncedSearch }),
        [debouncedSearch],
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Access"
                title={config.title}
                sub={config.sub}
                actions={
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={config.placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-56 bg-secondary pl-8 text-[13px]"
                        />
                    </div>
                }
            />

            <SectionTabs tabs={tabs} />

            <Outlet context={context} />
        </div>
    );
}
