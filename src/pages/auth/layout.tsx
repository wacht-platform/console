import { Outlet, useLocation, useParams } from "react-router";
import { useTour } from "@/lib/tour";
import { PageHead } from "@/components/ui/page-head";
import { SectionTabs } from "@/components/ui/section-tabs";

export default function AuthLayout() {
    useTour("first-auth-settings");
    const { projectId, deploymentId } = useParams();
    const { pathname } = useLocation();
    const base = `/project/${projectId}/deployment/${deploymentId}/auth`;

    const current = pathname.includes("/auth/sso")
        ? "sso"
        : pathname.includes("/auth/sessions")
          ? "sessions"
          : pathname.includes("/auth/restrictions")
            ? "restrictions"
            : pathname.includes("/auth/jwt-templates")
              ? "jwt-templates"
              : "schema-factors";

    const tabs = [
        {
            label: "Schema & factors",
            to: base,
            active: current === "schema-factors",
        },
        {
            label: "Social connections",
            to: `${base}/sso`,
            active: current === "sso",
        },
        {
            label: "Sessions",
            to: `${base}/sessions`,
            active: current === "sessions",
        },
        {
            label: "Restrictions",
            to: `${base}/restrictions`,
            active: current === "restrictions",
        },
        {
            label: "JWT templates",
            to: `${base}/jwt-templates`,
            active: current === "jwt-templates",
        },
    ];

    return (
        <div className="flex flex-1 flex-col gap-6" data-tour-id="auth-page">
            <PageHead
                className="mb-0"
                eyebrow="Configuration"
                title="Authentication"
                sub="Configure required user fields, sign-in methods and session policies."
            />
            <SectionTabs tabs={tabs} />
            <Outlet />
        </div>
    );
}
