import { Outlet, useLocation, useParams } from "react-router";
import { useTour } from "@/lib/tour";
import { PageHead } from "@/components/ui/page-head";
import { SectionTabs } from "@/components/ui/section-tabs";

export default function SetupLayout() {
    useTour("first-deployment-settings");
    const { projectId, deploymentId } = useParams();
    const { pathname } = useLocation();
    const base = `/project/${projectId}/deployment/${deploymentId}/setup`;

    const current = pathname.includes("/setup/emails")
        ? "emails"
        : pathname.includes("/setup/webhook-catalogs")
          ? "webhook-catalogs"
          : pathname.includes("/setup/rate-limit-schemes")
            ? "rate-limit-schemes"
            : "deployment-settings";

    const tabs = [
        {
            label: "Deployment settings",
            to: base,
            active: current === "deployment-settings",
        },
        {
            label: "Email settings",
            to: `${base}/emails`,
            active: current === "emails",
        },
        {
            label: "Webhook catalogs",
            to: `${base}/webhook-catalogs`,
            active: current === "webhook-catalogs",
        },
        {
            label: "Rate limit schemes",
            to: `${base}/rate-limit-schemes`,
            active: current === "rate-limit-schemes",
        },
    ];

    return (
        <div
            className="flex flex-1 flex-col gap-6"
            data-tour-id="setup-page"
        >
            <PageHead
                className="mb-0"
                eyebrow="Configuration"
                title="Manage deployment"
                sub="Branding, email delivery, webhooks and rate limits."
            />
            <SectionTabs tabs={tabs} />
            <Outlet />
        </div>
    );
}
