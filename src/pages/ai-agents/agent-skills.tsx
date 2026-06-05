import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
    DocumentTextIcon,
    FolderIcon,
    TrashIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    BoltIcon,
    EyeIcon,
    LockClosedIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CodeFileViewer } from "@/components/code-file-viewer";
import { MarkdownViewer } from "@/components/markdown-viewer";
import {
    type SkillScope,
    type SkillSummaryEntry,
    type SkillTreeEntry,
    useAgentSkillsSummary,
    useAgentSkillFile,
    useAgentSkillTree,
    useDeleteAgentSkill,
    useImportAgentSkillBundle,
} from "@/lib/api/hooks/use-agent-skills";

export default function AgentSkillsPage() {
    const { agentId } = useParams<{ agentId: string }>();
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const [filter, setFilter] = useState("");
    const [previewSkill, setPreviewSkill] = useState<SkillSummaryEntry | null>(
        null,
    );
    const [deleteSkillSlug, setDeleteSkillSlug] = useState<string | null>(null);
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(
        null,
    );
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

    const { data: summary, isLoading, error } = useAgentSkillsSummary(
        agentId || "",
    );
    const importMutation = useImportAgentSkillBundle(agentId || "");
    const deleteMutation = useDeleteAgentSkill(agentId || "");

    const skills = useMemo<SkillSummaryEntry[]>(() => {
        const agentSkills = summary?.agent ?? [];
        const systemSkills = summary?.system ?? [];
        return [...agentSkills, ...systemSkills];
    }, [summary]);

    const q = filter.trim().toLowerCase();
    const filtered = skills.filter(
        (s) =>
            !q ||
            s.name.toLowerCase().includes(q) ||
            (s.description ?? "").toLowerCase().includes(q),
    );

    const handleZipSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setPendingImportFile(file);
        setIsImportDialogOpen(true);
        event.target.value = "";
    };

    const confirmImport = async () => {
        if (!pendingImportFile) return;
        const formData = new FormData();
        formData.append("file", pendingImportFile);
        formData.append("replace_existing", "true");
        await importMutation.mutateAsync(formData);
        setIsImportDialogOpen(false);
        setPendingImportFile(null);
    };

    if (isLoading) return <InlineLoader />;
    if (error) {
        return (
            <div className="py-12 text-center text-destructive">
                {error.message}
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-base font-medium tracking-tight text-foreground">
                        Skills
                    </h3>
                    <p className="mt-1 max-w-[640px] text-[13px] leading-6 text-muted-foreground">
                        Skill bundles add system instructions and may bring their
                        own tools. They're resolved into context at the start of
                        every run.
                    </p>
                </div>
                <input
                    ref={uploadInputRef}
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={handleZipSelected}
                />
                <Button
                    className="shrink-0"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={importMutation.isPending}
                >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Import skill
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
                {/* toolbar */}
                <div className="flex h-[52px] items-center gap-3.5 border-b border-border px-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <BoltIcon className="h-[15px] w-[15px] text-muted-foreground" />
                        <span className="text-[13px] font-medium text-foreground">
                            All skills
                        </span>
                        <span className="size-1 rounded-full bg-muted-foreground/50" />
                        <span className="font-mono text-[12px] text-muted-foreground">
                            {skills.length} bundle{skills.length === 1 ? "" : "s"}
                        </span>
                    </div>
                    <div className="relative w-60">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            className="h-8 pl-8 text-[13px]"
                            placeholder="Filter skills…"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* table */}
                {skills.length === 0 ? (
                    <EmptyState
                        icon={<BoltIcon />}
                        title="No skills yet"
                        description="Import a skill bundle (.zip) to add reusable instructions and tools to this agent."
                        actionLabel={
                            importMutation.isPending ? undefined : "Import skill"
                        }
                        onAction={() => uploadInputRef.current?.click()}
                    />
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-secondary">
                            <tr className="border-b border-border text-left">
                                <th className="h-9 pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Skill
                                </th>
                                <th className="h-9 w-[120px] text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Source
                                </th>
                                <th className="h-9 w-[110px] text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Status
                                </th>
                                <th className="h-9 w-[110px] pr-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-[13px] text-muted-foreground"
                                    >
                                        No skills match your filter.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((skill) => {
                                    const isSystem = skill.source === "system";
                                    return (
                                        <tr
                                            key={`${skill.source}-${skill.slug}`}
                                            className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                                            onClick={() => setPreviewSkill(skill)}
                                        >
                                            <td className="max-w-0 py-2.5 pl-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                        <BoltIcon className="h-4 w-4" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div
                                                            className="truncate text-[13px] font-medium text-foreground"
                                                            title={skill.name}
                                                        >
                                                            {skill.name}
                                                        </div>
                                                        <div
                                                            className="truncate font-mono text-[11px] text-muted-foreground"
                                                            title={
                                                                skill.description ||
                                                                skill.mount_path
                                                            }
                                                        >
                                                            {skill.description ||
                                                                skill.mount_path}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Tag>{skill.source}</Tag>
                                            </td>
                                            <td>
                                                {isSystem ? (
                                                    <Pill tone="mute">built-in</Pill>
                                                ) : (
                                                    <Pill tone="ok">active</Pill>
                                                )}
                                            </td>
                                            <td className="pr-4">
                                                <div
                                                    className="flex items-center justify-end gap-1"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-[12px] text-muted-foreground hover:text-foreground"
                                                        onClick={() =>
                                                            setPreviewSkill(skill)
                                                        }
                                                    >
                                                        <EyeIcon className="mr-1 h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                    {isSystem ? (
                                                        <span
                                                            title="System skills are read-only"
                                                            className="flex h-7 w-7 items-center justify-center text-muted-foreground/50"
                                                        >
                                                            <LockClosedIcon className="h-3.5 w-3.5" />
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                setDeleteSkillSlug(
                                                                    skill.slug,
                                                                )
                                                            }
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}

                {/* footer */}
                {skills.length > 0 ? (
                    <div className="flex h-11 items-center justify-between border-t border-border bg-secondary px-4 font-mono text-[11px] text-muted-foreground">
                        <span>
                            {skills.length} skill{skills.length === 1 ? "" : "s"} ·{" "}
                            {summary?.agent.length ?? 0} agent ·{" "}
                            {summary?.system.length ?? 0} system
                        </span>
                        <span>resolved at run start</span>
                    </div>
                ) : null}
            </div>

            <SkillPreviewDialog
                agentId={agentId || ""}
                skill={previewSkill}
                onClose={() => setPreviewSkill(null)}
            />

            <ConfirmationDialog
                isOpen={!!deleteSkillSlug}
                onClose={() => setDeleteSkillSlug(null)}
                onConfirm={async () => {
                    if (!deleteSkillSlug) return;
                    await deleteMutation.mutateAsync(deleteSkillSlug);
                    setDeleteSkillSlug(null);
                }}
                title="Delete Skill"
                message={`Delete the "${deleteSkillSlug}" skill bundle? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive
                isLoading={deleteMutation.isPending}
            />

            <Dialog
                open={isImportDialogOpen}
                onOpenChange={(open) => {
                    setIsImportDialogOpen(open);
                    if (!open) setPendingImportFile(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Skill Bundle</DialogTitle>
                        <DialogDescription>
                            The zip is imported into this agent's skill storage.
                            Existing files with the same path are replaced.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg border bg-secondary p-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Bundle
                        </div>
                        <div className="mt-1 truncate text-sm font-medium">
                            {pendingImportFile?.name || "No file selected"}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setIsImportDialogOpen(false);
                                setPendingImportFile(null);
                            }}
                            disabled={importMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmImport}
                            disabled={
                                !pendingImportFile || importMutation.isPending
                            }
                        >
                            {importMutation.isPending
                                ? "Importing..."
                                : "Import Zip"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SkillPreviewDialog({
    agentId,
    skill,
    onClose,
}: {
    agentId: string;
    skill: SkillSummaryEntry | null;
    onClose: () => void;
}) {
    const [selectedEntry, setSelectedEntry] = useState<SkillTreeEntry | null>(
        null,
    );
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

    const scope: SkillScope = skill?.source ?? "agent";
    const rootPath = skill ? `/${skill.slug}` : "/";

    const rootTree = useAgentSkillTree(agentId, scope, rootPath, !!skill);

    // Reset the selection whenever a different skill is opened.
    useEffect(() => {
        setSelectedEntry(null);
        setExpandedPaths(new Set());
    }, [skill?.slug, skill?.source]);

    // Auto-open the skill's primary file so the viewer isn't empty on open.
    useEffect(() => {
        if (!skill || selectedEntry || !rootTree.data) return;
        const files = (rootTree.data.entries ?? []).filter(
            (e) => e.kind === "file",
        );
        const main =
            files.find((e) => e.name.toLowerCase() === "skill.md") ??
            files.find((e) => e.name.toLowerCase().endsWith(".md")) ??
            files[0];
        if (main) setSelectedEntry(main);
    }, [skill, rootTree.data, selectedEntry]);

    const fileQuery = useAgentSkillFile(
        agentId,
        scope,
        selectedEntry?.kind === "file" ? selectedEntry.path : "",
        selectedEntry?.kind === "file",
    );

    const toggleExpandedPath = (path: string) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const isMarkdown =
        selectedEntry?.path.toLowerCase().endsWith(".md") ||
        selectedEntry?.path.toLowerCase().endsWith(".markdown");

    return (
        <Dialog
            open={!!skill}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                    setSelectedEntry(null);
                    setExpandedPaths(new Set());
                }
            }}
        >
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-5xl">
                <DialogHeader className="m-0 border-b border-border py-4 pl-5 pr-12">
                    <DialogTitle className="flex items-center gap-2">
                        <BoltIcon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{skill?.name}</span>
                    </DialogTitle>
                    <DialogDescription className="truncate font-mono text-[11px]">
                        {skill?.mount_path}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid h-[68vh] max-h-[620px] grid-cols-[240px_1fr] overflow-hidden">
                    {/* File tree */}
                    <aside className="flex min-h-0 flex-col border-r border-border">
                        <div className="flex h-[44px] shrink-0 items-center gap-2 border-b border-border px-3.5">
                            <FolderIcon className="h-[15px] w-[15px] text-muted-foreground" />
                            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                Files
                            </span>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {skill ? (
                                <SkillTreeNode
                                    agentId={agentId}
                                    scope={scope}
                                    path={rootPath}
                                    depth={0}
                                    expandedPaths={expandedPaths}
                                    selectedPath={selectedEntry?.path || null}
                                    onToggle={toggleExpandedPath}
                                    onSelect={setSelectedEntry}
                                />
                            ) : null}
                        </div>
                    </aside>

                    {/* Viewer */}
                    <div className="flex min-h-0 flex-col">
                        <div className="flex h-[44px] shrink-0 items-center gap-2 border-b border-border px-4">
                            <DocumentTextIcon className="h-[15px] w-[15px] shrink-0 text-muted-foreground" />
                            <span
                                className="truncate font-mono text-[12px] text-muted-foreground"
                                title={selectedEntry?.path}
                            >
                                {selectedEntry?.path ?? "No file selected"}
                            </span>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto p-4">
                            {!selectedEntry ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground/50">
                                    <DocumentTextIcon className="mb-3 h-10 w-10 opacity-20" />
                                    <p className="text-sm font-medium text-foreground/50">
                                        Select a file
                                    </p>
                                    <p className="mt-1 text-xs">
                                        Pick a file from this skill to preview it.
                                    </p>
                                </div>
                            ) : fileQuery.isLoading ? (
                                <InlineLoader />
                            ) : fileQuery.error ? (
                                <div className="text-sm text-destructive">
                                    {fileQuery.error.message}
                                </div>
                            ) : fileQuery.data?.is_text ? (
                                isMarkdown ? (
                                    <MarkdownViewer
                                        content={fileQuery.data.content || ""}
                                    />
                                ) : (
                                    <CodeFileViewer
                                        path={selectedEntry.path}
                                        value={fileQuery.data.content || ""}
                                    />
                                )
                            ) : (
                                <div className="rounded-lg border bg-secondary p-3 text-sm text-muted-foreground">
                                    This file can't be rendered as inline text.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface SkillTreeNodeProps {
    agentId: string;
    scope: SkillScope;
    path: string;
    depth: number;
    expandedPaths: Set<string>;
    selectedPath: string | null;
    onToggle: (path: string) => void;
    onSelect: (entry: SkillTreeEntry) => void;
}

function SkillTreeNode({
    agentId,
    scope,
    path,
    depth,
    expandedPaths,
    selectedPath,
    onToggle,
    onSelect,
}: SkillTreeNodeProps) {
    const treeQuery = useAgentSkillTree(agentId, scope, path);

    const sortedEntries = useMemo(
        () =>
            [...(treeQuery.data?.entries || [])].sort((a, b) => {
                if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
            }),
        [treeQuery.data],
    );

    if (treeQuery.isLoading && depth === 0) {
        return (
            <div className="px-3 py-6">
                <InlineLoader />
            </div>
        );
    }

    if (treeQuery.error && depth === 0) {
        return (
            <div className="px-3 py-6 text-sm text-destructive">
                {treeQuery.error.message}
            </div>
        );
    }

    if (sortedEntries.length === 0 && depth === 0) {
        return (
            <div className="px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                    This skill has no files.
                </p>
            </div>
        );
    }

    return (
        <div className={depth === 0 ? "space-y-0.5" : ""}>
            {sortedEntries.map((entry) => {
                const isDirectory = entry.kind === "directory";
                const isExpanded = isDirectory && expandedPaths.has(entry.path);
                const isSelected = selectedPath === entry.path;

                return (
                    <div key={entry.path}>
                        <div
                            className={cn(
                                "group relative flex h-7 items-center gap-1.5 rounded-md text-sm transition-colors",
                                isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            )}
                            style={{
                                paddingLeft: `${8 + depth * 12}px`,
                                paddingRight: "8px",
                            }}
                        >
                            {isDirectory ? (
                                <button
                                    type="button"
                                    className="flex h-7 flex-1 items-center gap-1.5 text-left"
                                    onClick={() => onToggle(entry.path)}
                                >
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                    ) : (
                                        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                    )}
                                    <FolderIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{entry.name}</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="flex h-7 flex-1 items-center gap-1.5 text-left"
                                    onClick={() => onSelect(entry)}
                                >
                                    <span className="block w-3.5 shrink-0" />
                                    <DocumentTextIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{entry.name}</span>
                                </button>
                            )}
                        </div>

                        {isDirectory && isExpanded ? (
                            <SkillTreeNode
                                agentId={agentId}
                                scope={scope}
                                path={entry.path}
                                depth={depth + 1}
                                expandedPaths={expandedPaths}
                                selectedPath={selectedPath}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
