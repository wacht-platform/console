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
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectWithDeployments } from "@/types/project";
import { Deployment } from "@/types/deployment";
import { capitalize } from '@/lib/capitalize';

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

    const handleDeploymentClick = (project: ProjectWithDeployments, deployment: Deployment) => {
        onProjectSelect(project);
        onDeploymentSelect(deployment);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 group">
                    {isLoading ? (
                        <>
                            <div className="h-5 w-5 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                            <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        </>
                    ) : selectedProject ? (
                        <>
                            <Avatar className="h-5 w-5 rounded-md">
                                <AvatarImage src={selectedProject.image_url} />
                                <AvatarFallback className="text-[9px]">{selectedProject.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-[150px] truncate">
                                {selectedProject.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-zinc-300 dark:border-zinc-700">
                                <PlusIcon className="h-3 w-3 text-zinc-500" />
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-[150px] truncate">
                                Select Project
                            </span>
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto" align="start">
                {projects.map((project) => (
                    <DropdownMenuSub key={project.id}>
                        <DropdownMenuSubTrigger
                            className="py-2"
                        >
                            <Avatar className="mr-2 h-4 w-4 rounded-md">
                                <AvatarImage src={project.image_url} />
                                <AvatarFallback className="text-[8px]">{project.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{project.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {project.deployments.map(deployment => (
                                <DropdownMenuItem key={deployment.id} onSelect={() => handleDeploymentClick(project, deployment)}>
                                    <div className={clsx(
                                        'h-1.5 w-1.5 rounded-full mr-2',
                                        deployment.mode === 'production' ? 'bg-green-500' : 'bg-yellow-500'
                                    )} />
                                    {deployment.name || capitalize(deployment.mode)}
                                </DropdownMenuItem>
                            ))}
                            {project.deployments.length === 0 && (
                                <div className="px-2 py-1 text-xs text-muted-foreground">No deployments</div>
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
