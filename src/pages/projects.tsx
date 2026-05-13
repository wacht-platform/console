import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "@posthog/react";
import { OrganizationSwitcher, UserButton } from "@wacht/react-router";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ArrowUpRightIcon,
    GlobeAltIcon,
    RocketLaunchIcon,
    BeakerIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Navbar, NavbarSpacer } from "@/components/ui/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ProjectLoadingGrid } from "@/components/ui/loading-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useProjectStore } from "@/lib/store/project";
import { ProjectWithDeployments } from "@/types/project";
import { useTour, useTourCompletion } from "@/lib/tour";

function projectHasMode(
    project: ProjectWithDeployments,
    mode: "production" | "staging",
) {
    return project.deployments.some((deployment) => deployment.mode === mode);
}

function filterProjects(projects: ProjectWithDeployments[], query: string) {
    if (!query.trim()) return projects;
    const term = query.toLowerCase();
    return projects.filter((project) => {
        const hostText = project.deployments
            .map((deployment) => deployment.frontend_host)
            .join(" ");
        return `${project.name} ${hostText}`.toLowerCase().includes(term);
    });
}

export default function ProjectsPage() {
    const { projects, isLoading } = useProjects();
    const { data: billingAccount } = useBillingAccount();
    const [createProjectDialogOpen, setCreateProjectDialogOpen] =
        useState(false);
    const [billingSetupDialogOpen, setBillingSetupDialogOpen] = useState(false);
    const [pendingBillingDialogOpen, setPendingBillingDialogOpen] =
        useState(false);
    const [query, setQuery] = useState("");

    const handleCreateProject = () => {
        if (
            !billingAccount ||
            billingAccount.status === "cancelled" ||
            billingAccount.status === "failed"
        ) {
            setBillingSetupDialogOpen(true);
        } else if (billingAccount.status === "pending") {
            setPendingBillingDialogOpen(true);
        } else {
            setCreateProjectDialogOpen(true);
        }
    };

    const allProjects = useMemo(() => projects ?? [], [projects]);
    const productionProjects = allProjects.filter((project) =>
        projectHasMode(project, "production"),
    );
    const stagingProjects = allProjects.filter((project) =>
        projectHasMode(project, "staging"),
    );

    const filteredAllProjects = useMemo(
        () => filterProjects(allProjects, query),
        [allProjects, query],
    );
    const filteredProductionProjects = useMemo(
        () => filterProjects(productionProjects, query),
        [productionProjects, query],
    );
    const filteredStagingProjects = useMemo(
        () => filterProjects(stagingProjects, query),
        [stagingProjects, query],
    );

    useTour("first-deployment-create", !isLoading);

    const hasAnyDeployment = useMemo(
        () =>
            (projects ?? []).some(
                (project) => project.deployments.length > 0,
            ),
        [projects],
    );
    useTourCompletion("first-deployment-create", hasAnyDeployment);

    const createdThisMonth = allProjects.filter((project) => {
        const created = new Date(project.created_at);
        const now = new Date();
        return (
            created.getUTCFullYear() === now.getUTCFullYear() &&
            created.getUTCMonth() === now.getUTCMonth()
        );
    }).length;

    return (
        <div className="min-h-screen bg-background">
            <Navbar className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/70 bg-background/90 backdrop-blur-md">
                <div className="mx-auto flex h-full w-full max-w-7xl items-center px-6 lg:px-8">
                    <section className="w-50">
                        <OrganizationSwitcher />
                    </section>
                    <NavbarSpacer />
                    <UserButton showName={false} showOrgSwitcher={false} />
                </div>
            </Navbar>

            <main className="mx-auto max-w-7xl px-6 pt-14 pb-16 lg:px-8">
                <section className="mt-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl tracking-tight text-foreground md:text-2xl">
                                Projects
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                                Centralize every app and deployment environment
                                in one control plane.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <div className="relative sm:w-80">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search by project or host..."
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                data-tour-id="projects-create-button"
                                onClick={handleCreateProject}
                                className="gap-2"
                            >
                                <PlusIcon className="h-4 w-4" />
                                New project
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <MetricCard
                        title="Total Projects"
                        value={allProjects.length}
                        icon={<GlobeAltIcon className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Production"
                        value={productionProjects.length}
                        icon={<RocketLaunchIcon className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Staging"
                        value={stagingProjects.length}
                        icon={<BeakerIcon className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Created This Month"
                        value={createdThisMonth}
                        icon={<ClockIcon className="h-4 w-4" />}
                    />
                </section>

                <section className="mt-7">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="h-10 rounded-xl border border-border/80 bg-muted/40 p-1">
                            <TabsTrigger
                                value="all"
                                className="h-8 rounded-lg px-4 text-xs"
                            >
                                All
                            </TabsTrigger>
                            <TabsTrigger
                                value="production"
                                className="h-8 rounded-lg px-4 text-xs"
                            >
                                Production
                            </TabsTrigger>
                            <TabsTrigger
                                value="staging"
                                className="h-8 rounded-lg px-4 text-xs"
                            >
                                Staging
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-5">
                            <ProjectsGrid
                                isLoading={isLoading}
                                projects={filteredAllProjects}
                                query={query}
                                emptyTitle="No projects yet"
                                emptyDescription="Create your first project to get started."
                                onCreateProject={handleCreateProject}
                            />
                        </TabsContent>

                        <TabsContent value="production" className="mt-5">
                            <ProjectsGrid
                                isLoading={isLoading}
                                projects={filteredProductionProjects}
                                query={query}
                                emptyTitle="No production deployments"
                                emptyDescription="Deploy a production environment to see projects here."
                                onCreateProject={handleCreateProject}
                                highlightMode="production"
                            />
                        </TabsContent>

                        <TabsContent value="staging" className="mt-5">
                            <ProjectsGrid
                                isLoading={isLoading}
                                projects={filteredStagingProjects}
                                query={query}
                                emptyTitle="No staging deployments"
                                emptyDescription="Create a staging environment to see projects here."
                                onCreateProject={handleCreateProject}
                                highlightMode="staging"
                            />
                        </TabsContent>
                    </Tabs>
                </section>
            </main>

            <CreateProjectDialog
                open={createProjectDialogOpen}
                onClose={() => setCreateProjectDialogOpen(false)}
            />

            <BillingSetupDialog
                open={billingSetupDialogOpen}
                onClose={() => setBillingSetupDialogOpen(false)}
                onSuccess={() => setBillingSetupDialogOpen(false)}
            />

            <Dialog
                open={pendingBillingDialogOpen}
                onOpenChange={(isOpen) =>
                    !isOpen && setPendingBillingDialogOpen(false)
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <DialogTitle>Subscription Not Complete</DialogTitle>
                        </div>
                        <DialogDescription>
                            <Text>
                                Your billing account has been created but the
                                subscription payment has not been completed yet.
                            </Text>
                            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                                <li>
                                    You closed checkout before finishing payment
                                </li>
                                <li>The payment may still be processing</li>
                                <li>
                                    There may be an issue with your payment
                                    method
                                </li>
                            </ul>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setPendingBillingDialogOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setPendingBillingDialogOpen(false);
                                setBillingSetupDialogOpen(true);
                            }}
                        >
                            Complete Checkout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function MetricCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <Card className="border-border/80 bg-card">
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl tracking-tight text-foreground">
                        {value}
                    </p>
                </div>
                <div className="rounded-lg border border-border/80 bg-muted/40 p-2 text-muted-foreground">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}

function ProjectsGrid({
    isLoading,
    projects,
    query,
    emptyTitle,
    emptyDescription,
    onCreateProject,
    highlightMode,
}: {
    isLoading: boolean;
    projects: ProjectWithDeployments[];
    query: string;
    emptyTitle: string;
    emptyDescription: string;
    onCreateProject: () => void;
    highlightMode?: "production" | "staging";
}) {
    if (isLoading) {
        return <ProjectLoadingGrid items={6} />;
    }

    if (projects.length === 0 && query.trim().length > 0) {
        return (
            <EmptyState
                title="No matching projects"
                description={`No results found for "${query}"`}
                actionLabel="Create Project"
                onAction={onCreateProject}
            />
        );
    }

    if (projects.length === 0) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                actionLabel="Create Project"
                onAction={onCreateProject}
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_120px_130px_28px] items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:grid">
                <span>Project</span>
                <span>Host</span>
                <span>Environment</span>
                <span>Deployments</span>
                <span>Created</span>
                <span />
            </div>
            <AnimatePresence initial={false}>
                {projects.map((project, index) => (
                    <ProjectRow
                        key={project.id}
                        project={project}
                        index={index}
                        highlightMode={highlightMode}
                        isFirst={index === 0}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ProjectRow({
    project,
    index,
    highlightMode,
    isFirst,
}: {
    project: ProjectWithDeployments;
    index: number;
    highlightMode?: "production" | "staging";
    isFirst: boolean;
}) {
    const navigate = useNavigate();
    const { setSelectedProject, setSelectedDeployment } = useProjectStore();
    const posthog = usePostHog();
    const { id, name, image_url, deployments, created_at } = project;

    const production = deployments.find(
        (deployment) => deployment.mode === "production",
    );
    const staging = deployments.find(
        (deployment) => deployment.mode === "staging",
    );
    const primary = production || staging || deployments[0];

    const navigateToProject = () => {
        let targetDeployment = highlightMode
            ? deployments.find(
                  (deployment) => deployment.mode === highlightMode,
              )
            : production || deployments[0];

        if (!targetDeployment) targetDeployment = deployments[0];
        if (!targetDeployment) return;

        posthog?.capture("project_opened", {
            project_id: id,
            project_name: name,
            deployment_mode: targetDeployment.mode,
        });

        setSelectedProject(project);
        setSelectedDeployment(targetDeployment);
        navigate(`/project/${id}/deployment/${targetDeployment.id}`);
    };

    return (
        <motion.button
            type="button"
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, delay: index * 0.02 }}
            onClick={navigateToProject}
            data-tour-id={isFirst ? "project-card" : undefined}
            className={`group w-full border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${isFirst ? "" : "border-t"}`}
        >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_120px_130px_28px] md:items-center">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-md border border-border/80">
                            <AvatarImage src={image_url} />
                            <AvatarFallback className="rounded-md bg-muted text-xs">
                                {name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-sm text-foreground">
                                {name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground md:hidden">
                                {primary?.frontend_host ?? "No host"}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="hidden truncate text-xs text-muted-foreground md:block">
                    {primary?.frontend_host ?? "No host"}
                </p>

                <div className="flex items-center gap-2">
                    {production && (
                        <Badge className="rounded-md border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400">
                            Prod
                        </Badge>
                    )}
                    {staging && (
                        <Badge className="rounded-md border-sky-500/20 bg-sky-500/10 px-1.5 py-0 text-[10px] text-sky-600 dark:text-sky-400">
                            Staging
                        </Badge>
                    )}
                    {!production && !staging && (
                        <Badge
                            variant="outline"
                            className="rounded-md px-1.5 py-0 text-[10px]"
                        >
                            Unlabeled
                        </Badge>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    {deployments.length}
                </p>
                <p className="text-xs text-muted-foreground">
                    {format(new Date(created_at), "MMM d, yyyy")}
                </p>
                <ArrowUpRightIcon className="hidden h-4 w-4 text-muted-foreground group-hover:text-primary md:block" />
            </div>
        </motion.button>
    );
}
