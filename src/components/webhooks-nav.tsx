import { Link, useParams, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Overview", path: "" },
    { label: "Endpoints", path: "/endpoints" },
    { label: "Deliveries", path: "/deliveries" },
    { label: "Analytics", path: "/analytics" },
];

export function WebhooksNav() {
    const { projectId, deploymentId } = useParams();
    const location = useLocation();

    const basePath = `/project/${projectId}/deployment/${deploymentId}/webhooks`;

    return (
        <nav className="flex gap-6 border-b mb-6">
            {NAV_ITEMS.map((item) => {
                const fullPath = `${basePath}${item.path}`;
                const isActive = location.pathname === fullPath;

                return (
                    <Link
                        key={item.path}
                        to={fullPath}
                        className={cn(
                            "pb-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors",
                            isActive
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
