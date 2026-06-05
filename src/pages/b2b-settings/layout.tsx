import { Outlet, useLocation, useParams } from "react-router";
import { PageHead } from "@/components/ui/page-head";
import { SectionTabs } from "@/components/ui/section-tabs";

export default function B2BSettingsLayout() {
    const { projectId, deploymentId } = useParams();
    const { pathname } = useLocation();
    const base = `/project/${projectId}/deployment/${deploymentId}/b2b-settings`;

    const current = pathname.includes("/b2b-settings/workspaces")
        ? "workspaces"
        : "organizations";

    const tabs = [
        {
            label: "Organizations",
            to: base,
            active: current === "organizations",
        },
        {
            label: "Workspaces",
            to: `${base}/workspaces`,
            active: current === "workspaces",
        },
    ];

    return (
        <div className="flex flex-1 flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Configuration"
                title="Multi-tenancy"
                sub="Configure organizations and workspaces for your B2B application."
            />
            <SectionTabs tabs={tabs} />
            <Outlet />
        </div>
    );
}
