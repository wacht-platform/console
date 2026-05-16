import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "@posthog/react";
import { OrganizationSwitcher, UserButton } from "@wacht/react-router";
import {
    MagnifyingGlassIcon,
    PlusIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Navbar, NavbarSpacer } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
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
import { Text } from "@/components/ui/text";
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

/**
 * Time-since helper that prefers short, scannable strings ("3h ago",
 * "2d ago") over the verbose `MMM d, yyyy` we used before.
 */
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
                {/* Title row + stat ticker. Single editorial-feeling block,
                    no boxes. */}
                <section className="mt-10 mb-8 border-b border-border/60 pb-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-baseline gap-3">
                                <h1 className="text-[34px] leading-none tracking-[-0.025em] text-foreground">
                                    Projects
                                </h1>
                                <span className="font-mono text-sm text-muted-foreground">
                                    {allProjects.length.toString().padStart(2, "0")}
                                </span>
                            </div>
                            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12.5px] text-muted-foreground">
                                <StatItem
                                    label="production"
                                    value={productionCount}
                                />
                                <Separator />
                                <StatItem
                                    label="staging"
                                    value={stagingCount}
                                />
                                <Separator />
                                <StatItem
                                    label="new this month"
                                    value={createdThisMonth}
                                />
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative sm:w-72">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search projects or hosts"
                                    className="h-9 pl-9 text-[13px]"
                                />
                            </div>
                            <Button
                                data-tour-id="projects-create-button"
                                onClick={handleCreateProject}
                                className="h-9 gap-2"
                            >
                                <PlusIcon className="h-4 w-4" />
                                New project
                            </Button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-1.5">
                        <FilterChip
                            active={mode === "all"}
                            onClick={() => setMode("all")}
                        >
                            All
                        </FilterChip>
                        <FilterChip
                            active={mode === "production"}
                            onClick={() => setMode("production")}
                        >
                            Production
                        </FilterChip>
                        <FilterChip
                            active={mode === "staging"}
                            onClick={() => setMode("staging")}
                        >
                            Staging
                        </FilterChip>
                    </div>
                </section>

                <ProjectsBento
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

function Separator() {
    return <span className="text-muted-foreground/40">/</span>;
}

function StatItem({ label, value }: { label: string; value: number }) {
    return (
        <span className="inline-flex items-baseline gap-1.5">
            <span className="text-foreground">
                {value.toString().padStart(2, "0")}
            </span>
            <span className="text-[11.5px] uppercase tracking-[0.08em]">
                {label}
            </span>
        </span>
    );
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex h-7 items-center rounded-full border px-3 text-[12px] transition-colors",
                active
                    ? "border-foreground/80 bg-foreground text-background"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

function ProjectsBento({
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
    if (isLoading) {
        return <ProjectLoadingGrid items={6} />;
    }

    if (projects.length === 0) {
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
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                actionLabel="Create Project"
                onAction={onCreateProject}
            />
        );
    }

    const [featured, ...rest] = projects;
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured ? (
                <ProjectCard
                    key={featured.id}
                    project={featured}
                    featured
                    isFirst
                />
            ) : null}
            <AnimatePresence initial={false}>
                {rest.map((project, index) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        isFirst={false}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ProjectCard({
    project,
    index = 0,
    featured = false,
    isFirst,
}: {
    project: ProjectWithDeployments;
    index?: number;
    featured?: boolean;
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

    return (
        <motion.button
            type="button"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, delay: index * 0.02 }}
            onClick={openProject}
            data-tour-id={isFirst ? "project-card" : undefined}
            whileHover={{ y: -2 }}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-colors",
                "hover:border-foreground/30",
                featured ? "md:col-span-2" : "",
            )}
        >
            <div
                className={cn(
                    "relative flex h-full flex-col gap-4 p-5",
                    featured ? "md:p-7" : "p-5",
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3
                            className={cn(
                                "truncate tracking-[-0.01em] text-foreground",
                                featured ? "text-[22px]" : "text-[17px]",
                            )}
                        >
                            {project.name}
                        </h3>
                        <p className="mt-1 font-mono text-[11.5px] text-muted-foreground">
                            {relativeTime(new Date(lastTouched).toISOString())}
                        </p>
                    </div>
                    <EnvironmentDots
                        production={!!production}
                        staging={!!staging}
                    />
                </div>

                <div className="mt-auto space-y-1">
                    {production ? (
                        <HostLine label="prod" host={production.frontend_host} />
                    ) : null}
                    {staging ? (
                        <HostLine label="stg" host={staging.frontend_host} />
                    ) : null}
                    {!production && !staging ? (
                        <HostLine label="—" host="No deployment yet" muted />
                    ) : null}
                </div>
            </div>
        </motion.button>
    );
}

function EnvironmentDots({
    production,
    staging,
}: {
    production: boolean;
    staging: boolean;
}) {
    if (!production && !staging) {
        return (
            <span className="inline-flex h-5 items-center rounded-full border border-border bg-background/60 px-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                idle
            </span>
        );
    }
    return (
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-background/60 px-2 py-0.5 backdrop-blur-[2px]">
            {production ? (
                <Dot label="prod" tone="emerald" pulse />
            ) : null}
            {staging ? <Dot label="stg" tone="sky" /> : null}
        </div>
    );
}

function Dot({
    label,
    tone,
    pulse = false,
}: {
    label: string;
    tone: "emerald" | "sky";
    pulse?: boolean;
}) {
    const ringColor =
        tone === "emerald" ? "bg-emerald-500" : "bg-sky-500";
    return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/75">
            <span className="relative inline-flex h-1.5 w-1.5">
                {pulse ? (
                    <span
                        className={cn(
                            "absolute inset-0 rounded-full opacity-60",
                            ringColor,
                        )}
                        style={{ animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite" }}
                    />
                ) : null}
                <span
                    className={cn(
                        "relative inline-flex h-1.5 w-1.5 rounded-full",
                        ringColor,
                    )}
                />
            </span>
            {label}
        </span>
    );
}

function HostLine({
    label,
    host,
    muted = false,
}: {
    label: string;
    host: string;
    muted?: boolean;
}) {
    return (
        <div className="flex items-center gap-2 font-mono text-[12px]">
            <span className="w-9 shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {label}
            </span>
            <span
                className={cn(
                    "min-w-0 truncate",
                    muted ? "text-muted-foreground" : "text-foreground/85",
                )}
            >
                {host}
            </span>
        </div>
    );
}
