import { useActors } from "@/lib/api/hooks/use-manage-apps";
import { AppManager } from "./app-manager";

export default function AgentObservabilityPage() {
    return (
        <AppManager
            useApps={useActors}
            navigable={false}
            eyebrow="Manage"
            title="Agent Actors"
            sub="Identities your agents act on behalf of across this deployment."
            appHeader="Actor"
            identifierHeader="External key"
            searchPlaceholder="Search by name or key…"
            activeLabel="active"
            inactiveLabel="archived"
            emptyTitle="No actors"
            emptyMessage="Actors will appear here once your agents start acting on behalf of subjects."
            searchEmptyTitle="No actors found"
            searchEmptyMessage="No actor matches that search."
        />
    );
}
