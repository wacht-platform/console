import { useApiAuthApps } from "@/lib/api/hooks/use-manage-apps";
import { AppManager } from "./app-manager";

export default function ApiGatewayPage() {
    const { data: apps = [], isLoading } = useApiAuthApps();
    return (
        <AppManager
            kind="api-auth"
            apps={apps}
            loading={isLoading}
            eyebrow="Manage"
            title="API Gateway"
            sub="API auth apps, keys, rate limits and audit logs for this deployment."
            emptyTitle="No API auth apps"
            emptyMessage="API gateway apps will appear here once created."
        />
    );
}
