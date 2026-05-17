import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router";
import { usePostHog } from "@posthog/react";
import { OrganizationSwitcher, UserButton } from "@wacht/react-router";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    FolderOpenIcon,
} from "@heroicons/react/24/outline";

import { Navbar, NavbarSpacer } from "@/components/ui/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { Text } from "@/components/ui/text";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useProjectStore } from "@/lib/store/project";
import { cn } from "@/lib/utils";
import type { ProjectWithDeployments } from "@/types/project";
import type { Deployment } from "@/types/deployment";
import { useTour, useTourCompletion } from "@/lib/tour";

type Mode = "all" | "production" | "staging";

function projectHasMode(
    project: ProjectWithDeployments,
    mode: "production" | "staging",
) {
    return project.deployments.some((deployment) => deployment.mode === mode);
}

function filterProjects(
    projects: ProjectWithDeployments[],
    query: string,
    mode: Mode,
) {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
        if (mode !== "all" && !projectHasMode(project, mode)) return false;
        if (!term) return true;
        const hostText = project.deployments
            .map((deployment) => deployment.frontend_host)
            .join(" ");
        return `${project.name} ${hostText}`.toLowerCase().includes(term);
    });
}

function relativeTime(value: string | Date | undefined) {
    if (!value) return "—";
    try {
        return `${formatDistanceToNowStrict(new Date(value))} ago`;
    } catch {
        return "—";
    }
}

function mostRecentDeploymentTime(project: ProjectWithDeployments) {
    const times = project.deployments
        .map((d) => new Date(d.updated_at ?? d.created_at ?? project.created_at))
        .map((d) => d.getTime())
        .filter((t) => Number.isFinite(t));
    if (times.length === 0) return new Date(project.created_at).getTime();
    return Math.max(...times);
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
    const [mode, setMode] = useState<Mode>("all");

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
    const productionCount = allProjects.filter((p) =>
        projectHasMode(p, "production"),
    ).length;
    const stagingCount = allProjects.filter((p) =>
        projectHasMode(p, "staging"),
    ).length;
    const createdThisMonth = allProjects.filter((project) => {
        const created = new Date(project.created_at);
        const now = new Date();
        return (
            created.getUTCFullYear() === now.getUTCFullYear() &&
            created.getUTCMonth() === now.getUTCMonth()
        );
    }).length;

    const ranked = useMemo(
        () =>
            [...allProjects].sort(
                (a, b) =>
                    mostRecentDeploymentTime(b) - mostRecentDeploymentTime(a),
            ),
        [allProjects],
    );

    const filteredProjects = useMemo(
        () => filterProjects(ranked, query, mode),
        [ranked, query, mode],
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

            <main className="mx-auto max-w-7xl px-6 pt-14 pb-20 lg:px-8">
                <header className="mt-10 mb-6 flex flex-col gap-1">
                    <h1 className="text-2xl font-normal tracking-tight text-foreground">
                        Projects
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your projects and jump into a deployment.
                    </p>
                </header>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile label="Total" value={allProjects.length} />
                    <StatTile
                        label="Production"
                        value={productionCount}
                        tone="emerald"
                    />
                    <StatTile
                        label="Staging"
                        value={stagingCount}
                        tone="sky"
                    />
                    <StatTile label="New this month" value={createdThisMonth} />
                </div>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1 sm:max-w-sm">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search projects or hosts"
                            className="pl-9"
                        />
                    </div>

                    <ToggleGroup
                        type="single"
                        value={mode}
                        onValueChange={(value) => {
                            if (value) setMode(value as Mode);
                        }}
                        variant="outline"
                        size="sm"
                        className="*:data-[slot=toggle-group-item]:!px-3.5 *:data-[slot=toggle-group-item]:!text-[13px]"
                    >
                        <ToggleGroupItem value="all">All</ToggleGroupItem>
                        <ToggleGroupItem value="production">
                            Production
                        </ToggleGroupItem>
                        <ToggleGroupItem value="staging">
                            Staging
                        </ToggleGroupItem>
                    </ToggleGroup>

                    <Button
                        data-tour-id="projects-create-button"
                        onClick={handleCreateProject}
                        className="gap-2 sm:ml-auto"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New project
                    </Button>
                </div>

                <ProjectsTable
                    isLoading={isLoading}
                    projects={filteredProjects}
                    query={query}
                    mode={mode}
                    onCreateProject={handleCreateProject}
                />
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

function StatTile({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone?: "emerald" | "sky";
}) {
    const dotColor =
        tone === "emerald"
            ? "bg-emerald-500"
            : tone === "sky"
              ? "bg-sky-500"
              : "bg-muted-foreground/40";
    return (
        <div className="rounded-lg border border-border/70 bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                {label}
            </div>
            <div className="mt-1 text-2xl font-normal tabular-nums text-foreground">
                {value}
            </div>
        </div>
    );
}

function ProjectsTable({
    isLoading,
    projects,
    query,
    mode,
    onCreateProject,
}: {
    isLoading: boolean;
    projects: ProjectWithDeployments[];
    query: string;
    mode: Mode;
    onCreateProject: () => void;
}) {
    const showEmpty = !isLoading && projects.length === 0;
    const emptyTitle = query.trim()
        ? "No matching projects"
        : mode === "production"
          ? "No production deployments"
          : mode === "staging"
            ? "No staging deployments"
            : "No projects yet";
    const emptyDescription = query.trim()
        ? `No results found for "${query}"`
        : mode === "all"
          ? "Create your first project to get started."
          : `Deploy a ${mode} environment to see projects here.`;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden md:table-cell">
                        Environments
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                        Hosts
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                        Updated
                    </TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <SkeletonTableRows rows={6} columns={5} withAvatar />
                ) : showEmpty ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-40">
                            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                                <FolderOpenIcon className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm font-medium text-foreground">
                                    {emptyTitle}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {emptyDescription}
                                </p>
                                {!query.trim() && mode === "all" ? (
                                    <Button
                                        size="sm"
                                        className="mt-3 gap-2"
                                        onClick={onCreateProject}
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Create project
                                    </Button>
                                ) : null}
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    projects.map((project, index) => (
                        <ProjectRow
                            key={project.id}
                            project={project}
                            isFirst={index === 0}
                        />
                    ))
                )}
            </TableBody>
        </Table>
    );
}

function ProjectRow({
    project,
    isFirst,
}: {
    project: ProjectWithDeployments;
    isFirst: boolean;
}) {
    const navigate = useNavigate();
    const { setSelectedProject, setSelectedDeployment } = useProjectStore();
    const posthog = usePostHog();

    const production = project.deployments.find((d) => d.mode === "production");
    const staging = project.deployments.find((d) => d.mode === "staging");
    const primary = production ?? staging ?? project.deployments[0];

    const openProject = () => {
        if (!primary) return;
        posthog?.capture("project_opened", {
            project_id: project.id,
            project_name: project.name,
            deployment_mode: primary.mode,
        });
        setSelectedProject(project);
        setSelectedDeployment(primary);
        navigate(`/project/${project.id}/deployment/${primary.id}`);
    };

    const lastTouched = mostRecentDeploymentTime(project);
    const initials = project.name.slice(0, 2).toUpperCase();
    const hostSummary = hostsLabel(production, staging);

    return (
        <TableRow
            data-tour-id={isFirst ? "project-card" : undefined}
            className="cursor-pointer"
            onClick={openProject}
        >
            <TableCell className="py-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={project.image_url} alt={project.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <div className="truncate text-sm text-foreground">
                            {project.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">
                            {relativeTime(new Date(lastTouched).toISOString())}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1.5">
                    {production ? <EnvPill tone="emerald" label="Production" /> : null}
                    {staging ? <EnvPill tone="sky" label="Staging" /> : null}
                    {!production && !staging ? (
                        <span className="text-xs text-muted-foreground">—</span>
                    ) : null}
                </div>
            </TableCell>
            <TableCell className="hidden max-w-[280px] lg:table-cell">
                <span className="block truncate font-mono text-xs text-muted-foreground">
                    {hostSummary}
                </span>
            </TableCell>
            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                {relativeTime(new Date(lastTouched).toISOString())}
            </TableCell>
            <TableCell className="w-10 text-muted-foreground">
                <ChevronRightIcon className="h-4 w-4" />
            </TableCell>
        </TableRow>
    );
}

function hostsLabel(
    production: Deployment | undefined,
    staging: Deployment | undefined,
) {
    const parts: string[] = [];
    if (production?.frontend_host) parts.push(production.frontend_host);
    if (staging?.frontend_host) parts.push(staging.frontend_host);
    if (parts.length === 0) return "No deployment yet";
    return parts.join("  ·  ");
}

function EnvPill({
    tone,
    label,
}: {
    tone: "emerald" | "sky";
    label: string;
}) {
    const dotColor = tone === "emerald" ? "bg-emerald-500" : "bg-sky-500";
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-foreground/80">
            <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
            {label}
        </span>
    );
}
