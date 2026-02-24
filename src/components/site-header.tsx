import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell, UserButton } from "@wacht/react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { ProjectSwitcher } from "@/components/project-switcher";
import { DeploymentSwitcher } from "@/components/deployment-switcher";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useProjectStore } from "@/lib/store/project";

interface SiteHeaderProps {
    onCreateProject: () => void;
    onCreateStaging: () => void;
    onCreateProduction: () => void;
    canCreateStaging: boolean;
    canCreateProduction: boolean;
}

export function SiteHeader({
    onCreateProject,
    onCreateStaging: _onCreateStaging,
    onCreateProduction,
    canCreateStaging: _canCreateStaging,
    canCreateProduction,
}: SiteHeaderProps) {
    const { projects, isLoading } = useProjects();
    const {
        selectedProject,
        selectedDeployment,
        setSelectedProject,
        setSelectedDeployment,
    } = useProjectStore();

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-2 px-4 lg:px-6">
                <SidebarTrigger className="-ml-1 md:hidden" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 md:hidden"
                />
                <div className="flex items-center gap-2">
                    <ProjectSwitcher
                        projects={projects || []}
                        selectedProject={selectedProject || undefined}
                        isLoading={isLoading}
                        onProjectSelect={(p) => setSelectedProject(p)}
                        onDeploymentSelect={(d) => setSelectedDeployment(d)}
                        onCreateProject={onCreateProject}
                    />
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <DeploymentSwitcher
                        project={selectedProject || undefined}
                        selectedDeployment={selectedDeployment || undefined}
                        onDeploymentSelect={(d) => setSelectedDeployment(d)}
                        onCreateProduction={onCreateProduction}
                        canCreateProduction={canCreateProduction}
                    />
                    <DynamicBreadcrumbs />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                    <NotificationBell />
                    <UserButton showName={false} />
                </div>
            </div>
        </header>
    );
}
