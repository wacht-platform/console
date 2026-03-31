import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { ProjectWithDeployments } from "@/types/project";
import { Deployment } from "@/types/deployment";
import { capitalize } from "@/lib/capitalize";

interface ProjectDeploymentSelectorProps {
    projects?: ProjectWithDeployments[];
    selectedProject?: ProjectWithDeployments;
    selectedDeployment?: Deployment;
    onProjectSelect: (project: ProjectWithDeployments) => void;
    onDeploymentSelect: (deployment: Deployment) => void;
    onCreateProject: () => void;
    onCreateStaging: () => void;
    onCreateProduction: () => void;
    canCreateStaging: boolean;
    canCreateProduction: boolean;
}

export function ProjectDeploymentSelector({
    projects = [],
    selectedProject,
    selectedDeployment,
    onProjectSelect,
    onDeploymentSelect,
    onCreateProject,
    onCreateStaging,
    onCreateProduction,
    canCreateStaging,
    canCreateProduction,
}: ProjectDeploymentSelectorProps) {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
        new Set(projects.map((p) => p.id)),
    );

    const toggleProjectExpanded = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const handleProjectClick = (e: Event, project: ProjectWithDeployments) => {
        if (project.deployments.length > 0) {
            e.preventDefault();
            toggleProjectExpanded(project.id);
        } else {
            onProjectSelect(project);
        }
    };

    const handleDeploymentClick = (
        project: ProjectWithDeployments,
        deployment: Deployment,
    ) => {
        onProjectSelect(project);
        onDeploymentSelect(deployment);
    };

    const deploymentLabel = (projectName: string, deployment: Deployment) => {
        const appName = (deployment.name || projectName || "App").trim();
        const env = deployment.mode === "production" ? "Production" : "Staging";
        return `${appName} (${env})`;
    };
    const selectedLabel = (deployment: Deployment) =>
        (deployment.name || "").trim() || capitalize(deployment.mode);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-sm">
                            <span className="text-zinc-900 dark:text-zinc-100">
                                {selectedProject
                                    ? selectedProject.name
                                    : "Select Project"}
                            </span>
                            <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">
                                /
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {selectedDeployment && selectedProject
                                    ? selectedLabel(selectedDeployment)
                                    : "..."}
                            </span>
                        </div>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-zinc-400 opacity-50" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-64 max-h-100 overflow-y-auto"
                align="start"
            >
                {projects.map((project) => {
                    const isExpanded = expandedProjects.has(project.id);
                    const isProjectSelected =
                        selectedProject?.id === project.id;

                    return (
                        <div key={project.id}>
                            <DropdownMenuItem
                                onSelect={(e) => handleProjectClick(e, project)}
                                className={clsx(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer",
                                    isProjectSelected &&
                                        !isExpanded &&
                                        "bg-zinc-100 dark:bg-zinc-800/50",
                                )}
                            >
                                {project.deployments.length > 0 && (
                                    <ChevronRightIcon
                                        className={clsx(
                                            "h-3 w-3 text-zinc-400 transition-transform",
                                            isExpanded && "rotate-90",
                                        )}
                                    />
                                )}
                                <span className="flex-1 truncate font-medium">
                                    {project.name}
                                </span>
                            </DropdownMenuItem>

                            {isExpanded && (
                                <>
                                    {project.deployments.map((deployment) => (
                                        <DropdownMenuItem
                                            key={deployment.id}
                                            onSelect={() =>
                                                handleDeploymentClick(
                                                    project,
                                                    deployment,
                                                )
                                            }
                                            className={clsx(
                                                "w-full flex items-center pl-9 pr-2 py-1.5 text-sm cursor-pointer",
                                                selectedDeployment?.id ===
                                                    deployment.id &&
                                                    "bg-zinc-100 dark:bg-zinc-800/50",
                                            )}
                                        >
                                            <div
                                                className={clsx(
                                                    "h-1.5 w-1.5 rounded-full mr-2",
                                                    deployment.mode ===
                                                        "production"
                                                        ? "bg-green-500"
                                                        : "bg-yellow-500",
                                                )}
                                            />
                                            <span className="truncate text-zinc-600 dark:text-zinc-400">
                                                {deploymentLabel(
                                                    project.name,
                                                    deployment,
                                                )}
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                    {isProjectSelected &&
                                        (canCreateStaging ||
                                            canCreateProduction) && (
                                            <>
                                                <DropdownMenuSeparator className="mx-2 my-1" />
                                                {canCreateStaging && (
                                                    <DropdownMenuItem
                                                        onSelect={
                                                            onCreateStaging
                                                        }
                                                        className="pl-9 pr-2 py-1.5 text-xs text-zinc-500"
                                                    >
                                                        <PlusIcon className="mr-1 h-3 w-3" />{" "}
                                                        Add Staging
                                                    </DropdownMenuItem>
                                                )}
                                                {canCreateProduction && (
                                                    <DropdownMenuItem
                                                        onSelect={
                                                            onCreateProduction
                                                        }
                                                        className="pl-9 pr-2 py-1.5 text-xs text-zinc-500"
                                                    >
                                                        <PlusIcon className="mr-1 h-3 w-3" />{" "}
                                                        Add Production
                                                    </DropdownMenuItem>
                                                )}
                                            </>
                                        )}
                                </>
                            )}
                        </div>
                    );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onCreateProject} className="gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-zinc-300">
                        <PlusIcon className="h-3 w-3" />
                    </div>
                    <span>Create new project</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
