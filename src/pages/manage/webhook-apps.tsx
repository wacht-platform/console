import { useWebhookApps } from "@/lib/api/hooks/use-manage-apps";
import { AppManager } from "./app-manager";

export default function WebhookAppsPage() {
    return (
        <AppManager
            useApps={useWebhookApps}
            eyebrow="Manage"
            title="Webhook Apps"
            sub="Webhook apps, endpoints and delivery history for this deployment."
            emptyTitle="No webhook apps"
            emptyMessage="Webhook apps will appear here once created."
        />
    );
}
