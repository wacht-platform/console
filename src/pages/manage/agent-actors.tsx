import { useOutletContext } from "react-router";
import { useActors } from "@/lib/api/hooks/use-manage-apps";
import { AppManager } from "./app-manager";
import type { ManageListContext } from "./layout";

export default function AgentActorsPage() {
    const { search } = useOutletContext<ManageListContext>();
    return (
        <AppManager
            search={search}
            useApps={useActors}
            getKey={(a) => a.id}
            getTitle={(a) => a.display_name?.trim() || a.external_key}
            getIdentifier={(a) => a.external_key}
            getActive={(a) => !a.archived_at}
            getSubtitle={(a) => a.subject_type}
            appHeader="Actor"
            identifierHeader="External key"
            activeLabel="active"
            inactiveLabel="archived"
            emptyTitle="No actors"
            emptyMessage="Actors will appear here once your agents start acting on behalf of subjects."
            searchEmptyTitle="No actors found"
            searchEmptyMessage="No actor matches that search."
        />
    );
}
