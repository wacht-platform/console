import { useLocation, useParams } from "react-router";
import { SectionTabs, type SectionTab } from "@/components/ui/section-tabs";

const TABS = [
    { label: "Active", segment: "active" },
    { label: "Invited", segment: "invited" },
    { label: "Waitlist", segment: "waitlist" },
] as const;

export function UsersTabs() {
    const { projectId, deploymentId } = useParams();
    const { pathname } = useLocation();
    const base = `/project/${projectId}/deployment/${deploymentId}/users`;

    const current = pathname.endsWith("/invited")
        ? "invited"
        : pathname.endsWith("/waitlist")
          ? "waitlist"
          : "active";

    const tabs: SectionTab[] = TABS.map((tab) => ({
        label: tab.label,
        to: `${base}/${tab.segment}`,
        active: current === tab.segment,
    }));

    return <SectionTabs tabs={tabs} />;
}
