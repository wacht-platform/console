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
import { PageHead } from "@/components/ui/page-head";
import { Pill } from "@/components/ui/pill";
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
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useProjectStore } from "@/lib/store/project";
import { cn } from "@/lib/utils";
import type { ProjectWithDeployments } from "@/types/project";
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
                <PageHead
                    className="mt-10"
                    eyebrow="Workspace"
                    title="Projects"
                    sub="Manage your projects and jump into a deployment."
                    actions={
                        <Button
                            data-tour-id="projects-create-button"
                            onClick={handleCreateProject}
                            className="gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            New project
                        </Button>
                    }
                />

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile
                        label="Total"
                        value={allProjects.length}
                        foot="all environments"
                    />
                    <StatTile
                        label="Production"
                        value={productionCount}
                        tone="emerald"
                        foot="live, accepting traffic"
                    />
                    <StatTile
                        label="Staging"
                        value={stagingCount}
                        tone="sky"
                        foot="pre-production"
                    />
                    <StatTile
                        label="New this month"
                        value={createdThisMonth}
                        tone="amber"
                        foot="created in this period"
                    />
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
                        variant="default"
                        size="sm"
                        className="gap-0.5! rounded-md border border-border bg-secondary p-0.5 sm:ml-auto"
                    >
                        {(
                            [
                                ["all", "All"],
                                ["production", "Production"],
                                ["staging", "Staging"],
                            ] as const
                        ).map(([value, label]) => (
                            <ToggleGroupItem
                                key={value}
                                value={value}
                                className="h-6! rounded-sm! px-3! text-[13px]! font-medium text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-card! data-[state=on]:text-foreground! data-[state=on]:shadow-[0_0_0_0.5px_var(--input),0_1px_2px_rgba(0,0,0,0.06)]"
                            >
                                {label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
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
                            <p className="text-sm text-muted-foreground">
                                Your billing account has been created but the
                                subscription payment has not been completed yet.
                            </p>
                            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
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
    foot,
}: {
    label: string;
    value: number;
    tone?: "emerald" | "sky" | "amber";
    foot?: string;
}) {
    const dotColor =
        tone === "emerald"
            ? "bg-emerald-500"
            : tone === "sky"
              ? "bg-sky-500"
              : tone === "amber"
                ? "bg-amber-500"
                : "bg-muted-foreground/40";
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-4">
            <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", dotColor)} />
                {label}
            </div>
            <div className="text-[28px] leading-none font-medium tracking-tight tabular-nums text-foreground">
                {value}
            </div>
            {foot ? (
                <div className="font-mono text-[11px] text-muted-foreground/70">
                    {foot}
                </div>
            ) : null}
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
    const hosts = [
        production?.frontend_host,
        staging?.frontend_host,
    ].filter(Boolean) as string[];

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
                    {production ? <Pill tone="ok">production</Pill> : null}
                    {staging ? <Pill tone="info">staging</Pill> : null}
                    {!production && !staging ? (
                        <span className="text-xs text-muted-foreground">—</span>
                    ) : null}
                </div>
            </TableCell>
            <TableCell className="hidden max-w-[320px] lg:table-cell">
                {hosts.length === 0 ? (
                    <span className="font-mono text-xs text-muted-foreground/60">
                        No deployment yet
                    </span>
                ) : (
                    <div className="flex flex-col gap-0.5 font-mono text-xs text-secondary-foreground">
                        {hosts.map((host, index) => (
                            <span key={host} className="truncate">
                                {index > 0 ? (
                                    <span className="text-muted-foreground/50">
                                        ↳{" "}
                                    </span>
                                ) : null}
                                {host}
                            </span>
                        ))}
                    </div>
                )}
            </TableCell>
            <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                {relativeTime(new Date(lastTouched).toISOString())}
            </TableCell>
            <TableCell className="w-10 text-muted-foreground">
                <ChevronRightIcon className="h-4 w-4" />
            </TableCell>
        </TableRow>
    );
}

