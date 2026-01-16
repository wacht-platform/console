import { useLocation, Link } from "react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { capitalize } from "@/lib/capitalize";

export function DynamicBreadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    const resolveName = (segment: string) => {
        return capitalize(segment.replace(/-/g, " "));
    };

    // Find where the breadcrumbs should start.
    // Pattern: /project/:pid/deployment/:did/...
    // We want to skip everything up to and including the deployment ID.
    let startIndex = 0;
    const deploymentIndex = pathnames.indexOf("deployment");
    if (deploymentIndex !== -1 && pathnames.length > deploymentIndex + 1) {
        // Start AFTER the deployment ID
        startIndex = deploymentIndex + 2;
    } else {
        // Logic for non-nested routes or if we are AT the deployment root? 
        // If we are at /project/x/deployment/y, there are no extra crumbs. 
        startIndex = pathnames.length;
    }

    const breadcrumbs = pathnames.slice(startIndex).map((segment, i) => {
        const indexInPath = startIndex + i;
        const path = `/${pathnames.slice(0, indexInPath + 1).join("/")}`;
        return {
            name: resolveName(segment),
            path: path,
            isPage: i === (pathnames.length - startIndex) - 1
        };
    });

    if (breadcrumbs.length === 0) return null;

    return (
        <Breadcrumb className="hidden md:flex items-center">
            <BreadcrumbList>
                <BreadcrumbSeparator className="text-zinc-300 dark:text-zinc-600" />
                {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={crumb.path}>
                        {index < breadcrumbs.length - 1 ? (
                            <>
                                <BreadcrumbLink asChild>
                                    <Link to={crumb.path}>{crumb.name}</Link>
                                </BreadcrumbLink>
                                <BreadcrumbSeparator />
                            </>
                        ) : (
                            <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                        )}
                    </BreadcrumbItem>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
