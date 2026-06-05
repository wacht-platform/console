import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { ProjectWithDeployments } from "@/types/project";
import { Deployment } from "@/types/deployment";
import { capitalize } from "@/lib/capitalize";

interface ProjectSwitcherProps {
    projects?: ProjectWithDeployments[];
    selectedProject?: ProjectWithDeployments;
    isLoading?: boolean;
    onProjectSelect: (project: ProjectWithDeployments) => void;
    onDeploymentSelect: (deployment: Deployment) => void;
    onCreateProject: () => void;
}

export function ProjectSwitcher({
    projects = [],
    selectedProject,
    isLoading = false,
    onProjectSelect,
    onDeploymentSelect,
    onCreateProject,
}: ProjectSwitcherProps) {
    const handleDeploymentClick = (
        project: ProjectWithDeployments,
        deployment: Deployment,
    ) => {
        onProjectSelect(project);
        onDeploymentSelect(deployment);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring group">
                    {isLoading ? (
                        <>
                            <div className="h-5 w-5 rounded-md bg-secondary animate-pulse" />
                            <div className="h-4 w-24 rounded bg-secondary animate-pulse" />
                        </>
                    ) : selectedProject ? (
                        <>
                            <span className="font-normal text-foreground max-w-37.5 truncate">
                                {selectedProject.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-border dark:border-border">
                                <PlusIcon className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="font-normal text-foreground max-w-37.5 truncate">
                                Select Project
                            </span>
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56 max-h-100 overflow-y-auto"
                align="start"
            >
                {projects.map((project) => (
                    <DropdownMenuSub key={project.id}>
                        <DropdownMenuSubTrigger className="py-2">
                            <span className="truncate">{project.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {project.deployments.map((deployment) => (
                                <DropdownMenuItem
                                    key={deployment.id}
                                    onSelect={() =>
                                        handleDeploymentClick(
                                            project,
                                            deployment,
                                        )
                                    }
                                >
                                    <div
                                        className={clsx(
                                            "h-1.5 w-1.5 rounded-full mr-2",
                                            deployment.mode === "production"
                                                ? "bg-green-500"
                                                : "bg-yellow-500",
                                        )}
                                    />
                                    {deployment.name ||
                                        capitalize(deployment.mode)}
                                </DropdownMenuItem>
                            ))}
                            {project.deployments.length === 0 && (
                                <div className="px-2 py-1 text-xs text-muted-foreground">
                                    No deployments
                                </div>
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onCreateProject} className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Create new project</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
