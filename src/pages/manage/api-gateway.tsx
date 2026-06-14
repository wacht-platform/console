import { useOutletContext } from "react-router";
import { useApiAuthApps } from "@/lib/api/hooks/use-manage-apps";
import { AppManager } from "./app-manager";
import type { ManageListContext } from "./layout";

export default function ApiGatewayPage() {
    const { search } = useOutletContext<ManageListContext>();
    return (
        <AppManager
            search={search}
            useApps={useApiAuthApps}
            getKey={(a) => a.app_slug}
            getTitle={(a) => a.name}
            getIdentifier={(a) => a.app_slug}
            getActive={(a) => a.is_active}
            getSubtitle={(a) => a.description}
            emptyTitle="No API auth apps"
            emptyMessage="API gateway apps will appear here once created."
            searchEmptyTitle="No apps found"
            searchEmptyMessage="No app matches that slug."
        />
    );
}
