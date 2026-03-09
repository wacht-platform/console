import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { ProjectWithDeployments } from "@/types/project";
import { Deployment } from "@/types/deployment";

interface DeploymentSwitcherProps {
    project?: ProjectWithDeployments;
    selectedDeployment?: Deployment;
    onDeploymentSelect: (deployment: Deployment) => void;
    onCreateStaging: () => void;
    onCreateProduction: () => void;
    canCreateStaging: boolean;
    canCreateProduction: boolean;
}

export function DeploymentSwitcher({
    project,
    selectedDeployment,
    onDeploymentSelect,
    onCreateStaging,
    onCreateProduction,
    canCreateStaging,
    canCreateProduction,
}: DeploymentSwitcherProps) {
    if (!project) return null;

    const hasProduction = project.deployments.some(d => d.mode === 'production');
    const environmentLabel = (deployment: Deployment) =>
        deployment.mode === "production" ? "Production" : "Staging";
    const selectedLabel = () => project.name;
    const deploymentLabel = (deployment: Deployment) => {
        const appName = (deployment.name || project.name || "App").trim();
        const env = environmentLabel(deployment);
        return `${appName} (${env})`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">
                        {selectedDeployment ? selectedLabel() : "Select Deployment"}
                    </span>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48" align="start">
                {project.deployments.map((deployment) => (
                    <DropdownMenuItem
                        key={deployment.id}
                        onSelect={() => onDeploymentSelect(deployment)}
                        className="cursor-pointer"
                    >
                        <div className={clsx(
                            'h-1.5 w-1.5 rounded-full mr-2',
                            deployment.mode === 'production' ? 'bg-green-500' : 'bg-yellow-500'
                        )} />
                        <span className="truncate">
                            {deploymentLabel(deployment)}
                        </span>
                    </DropdownMenuItem>
                ))}

                {(canCreateStaging || (!hasProduction && canCreateProduction)) && (
                    <>
                        <DropdownMenuSeparator />
                        {canCreateStaging && (
                            <DropdownMenuItem onSelect={onCreateStaging} className="gap-2 cursor-pointer">
                                <PlusIcon className="h-4 w-4" />
                                <span>Add Staging</span>
                            </DropdownMenuItem>
                        )}
                        {!hasProduction && canCreateProduction && (
                            <DropdownMenuItem onSelect={onCreateProduction} className="gap-2 cursor-pointer">
                                <PlusIcon className="h-4 w-4" />
                                <span>Add Production</span>
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
