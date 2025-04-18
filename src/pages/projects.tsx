import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownIcon,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
} from '@/components/ui/dropdown'
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Navbar, NavbarItem, NavbarLabel, NavbarSpacer } from "@/components/ui/navbar";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { ProjectWithDeployments } from "@/types/project";
import { format } from "date-fns";
import { ArrowRightStartOnRectangleIcon, ChevronDownIcon, Cog8ToothIcon, LightBulbIcon, PlusIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useProjectStore } from "@/lib/store/project";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { useState } from "react";

function AccountDropdownMenu({
    anchor,
}: {
    anchor: "top start" | "bottom end";
}) {
    return (
        <DropdownMenu className="min-w-64" anchor={anchor}>
            <DropdownItem href="#">
                <DropdownIcon icon={UserCircleIcon} />
                <DropdownLabel>My account</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="#">
                <DropdownIcon icon={ShieldCheckIcon} />
                <DropdownLabel>Privacy policy</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="#">
                <DropdownIcon icon={LightBulbIcon} />
                <DropdownLabel>Share feedback</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="#">
                <DropdownIcon icon={ArrowRightStartOnRectangleIcon} />
                <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
        </DropdownMenu>
    );
}

export default function ProjectsPage() {
    const { projects, isLoading } = useProjects();
    const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 pt-20 space-y-8">
            <Navbar className="fixed top-0 left-0 right-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-12 py-3">
                <Dropdown>
                    <DropdownButton as={NavbarItem}>
                        <Avatar src="/tailwind-logo.svg" />
                        <NavbarLabel>Tailwind Labs</NavbarLabel>
                        <ChevronDownIcon />
                    </DropdownButton>
                    <DropdownMenu className="min-w-64" anchor="bottom start">
                        <DropdownItem href="/teams/1/settings">
                            <Cog8ToothIcon />
                            <DropdownLabel>Settings</DropdownLabel>
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem href="/teams/1">
                            <Avatar slot="icon" src="/tailwind-logo.svg" />
                            <DropdownLabel>Tailwind Labs</DropdownLabel>
                        </DropdownItem>
                        <DropdownItem href="/teams/2">
                            <Avatar slot="icon" initials="WC" className="bg-purple-500 text-white" />
                            <DropdownLabel>Workcation</DropdownLabel>
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem href="/teams/create">
                            <PlusIcon />
                            <DropdownLabel>New team&hellip;</DropdownLabel>
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                <NavbarSpacer />
                <Dropdown>
                    <DropdownButton as={NavbarItem}>
                        <Avatar src="https://github.com/erica.png" square />
                    </DropdownButton>
                    <AccountDropdownMenu anchor="bottom end" />
                </Dropdown>
            </Navbar>

            <div className="flex items-center justify-between">
                <h1 className="text-lg">Your Projects</h1>
                <Button onClick={() => setCreateProjectDialogOpen(true)}>
                    <PlusIcon />
                    <span>New Project</span>
                </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects?.map((project) => (
                    <ApplicationCard
                        key={project.id}
                        {...project}
                    />
                ))}
            </div>

            <CreateProjectDialog open={createProjectDialogOpen} onClose={() => setCreateProjectDialogOpen(false)} />
        </div>
    )
}

function ApplicationCard({ name, image_url, deployments, created_at, id }: ProjectWithDeployments) {
    const navigate = useNavigate();
    const { setSelectedProject, setSelectedDeployment, projects } = useProjectStore();

    const navigateToProject = () => {
        const productionDeployment = deployments.find((deployment) => deployment.mode === "production") || deployments[0];
        const project = projects?.find((project) => project.id === id);
        if (project && productionDeployment) {
            setSelectedProject(project);
            setSelectedDeployment(productionDeployment);
            navigate(`/project/${id}/deployment/${productionDeployment.id}`);
        }
    }

    return (
        <Card
            className="cursor-pointer group overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="px-4 pb-3 mt-2" onClick={navigateToProject}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar
                            className="w-5 h-5"
                            initials={name.charAt(0)}
                            src={image_url}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400"
                        >
                            {deployments.length} deployment(s)
                        </Badge>
                    </div>
                </div>
                <div className="my-3 space-y-1">
                    <h3 className="text-sm text-slate-900 dark:text-white">{name}</h3>
                    <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400">
                        https://{deployments[0].frontend_host}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50 pt-3 pb-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                Created {format(new Date(created_at), "MMM d, yyyy")}
            </CardFooter>
        </Card>
    )
}
