import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
    DocumentTextIcon,
    FolderIcon,
    TrashIcon,
    ArrowUpTrayIcon,
    ChevronRightIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineLoader } from "@/components/ui/loading-screen";
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
    useAgentSkillFile,
    useAgentSkillTree,
    useAgentSkillsSummary,
    useDeleteAgentSkill,
    useImportAgentSkillBundle,
} from "@/lib/api/hooks/use-agent-skills";

function formatFileSize(bytes?: number | null): string {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
        value /= 1024;
        idx += 1;
    }
    return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function previewTitle(path: string) {
    if (!path || path === "/") return "Root";
    return path.split("/").filter(Boolean).pop() || path;
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
    onDelete: (skillSlug: string) => void;
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
    onDelete,
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
                    {scope === "agent"
                        ? "No skill files here yet"
                        : "No system skill files here"}
                </p>
            </div>
        );
    }

    return (
        <div className={depth === 0 ? "space-y-1" : ""}>
            {sortedEntries.map((entry) => {
                const isDirectory = entry.kind === "directory";
                const isExpanded = isDirectory && expandedPaths.has(entry.path);
                const isSelected = selectedPath === entry.path;
                const isTopLevelAgentSkill =
                    scope === "agent" && depth === 0 && isDirectory;
                const skillSlug = entry.path.replace(/^\/+/, "");

                return (
                    <div key={entry.path}>
                        <div
                            className={cn(
                                "group relative flex h-7 items-center gap-1.5 text-sm transition-colors",
                                isSelected
                                    ? "bg-accent/65 text-foreground"
                                    : "text-muted-foreground hover:bg-accent/35 hover:text-foreground",
                            )}
                            style={{
                                paddingLeft: `${10 + depth * 12}px`,
                                paddingRight: "8px",
                            }}
                        >
                            {isSelected ? (
                                <span className="absolute bottom-0 left-0 top-0 w-px bg-primary/80" />
                            ) : null}
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
                                    <span className="truncate">
                                        {entry.name}
                                    </span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="flex h-7 flex-1 items-center gap-1.5 text-left"
                                    onClick={() => onSelect(entry)}
                                >
                                    <span className="block w-3.5 shrink-0" />
                                    <DocumentTextIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                        {entry.name}
                                    </span>
                                </button>
                            )}

                            {isTopLevelAgentSkill ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 h-7 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete(skillSlug);
                                    }}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            ) : null}
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
                                onDelete={onDelete}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

export default function AgentSkillsPage() {
    const { agentId } = useParams<{ agentId: string }>();
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const [scope, setScope] = useState<SkillScope>("agent");
    const [selectedEntry, setSelectedEntry] = useState<SkillTreeEntry | null>(
        null,
    );
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [deleteSkillSlug, setDeleteSkillSlug] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(
        null,
    );
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importScope, setImportScope] = useState<SkillScope>("agent");

    const importMutation = useImportAgentSkillBundle(agentId || "");
    const deleteMutation = useDeleteAgentSkill(agentId || "");

    const fileQuery = useAgentSkillFile(
        agentId || "",
        scope,
        selectedEntry?.kind === "file" ? selectedEntry.path : "",
        selectedEntry?.kind === "file",
    );

    useEffect(() => {
        setSelectedEntry(null);
        setExpandedPaths(new Set());
    }, [scope]);

    const handleZipSelected = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setPendingImportFile(file);
        setImportScope("agent");
        setIsImportDialogOpen(true);
        event.target.value = "";
    };

    const handleDropImport = (file: File) => {
        setPendingImportFile(file);
        setImportScope("agent");
        setIsImportDialogOpen(true);
    };

    const confirmImport = async () => {
        if (!pendingImportFile) return;
        const formData = new FormData();
        formData.append("file", pendingImportFile);
        formData.append("replace_existing", "true");
        await importMutation.mutateAsync(formData);
        setSelectedEntry(null);
        setExpandedPaths(new Set());
        setIsImportDialogOpen(false);
        setPendingImportFile(null);
        setImportScope("agent");
    };

    const toggleExpandedPath = (path: string) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    return (
        <div className="flex h-[calc(100vh-10rem)] flex-col gap-3">
            <div
                className={cn(
                    "relative flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-background",
                    isDragging &&
                        "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                )}
                onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(event) => {
                    event.preventDefault();
                    const target = event.relatedTarget as Node | null;
                    if (!target || !event.currentTarget.contains(target)) {
                        setIsDragging(false);
                    }
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    const file = event.dataTransfer.files?.[0];
                    if (!file) return;
                    handleDropImport(file);
                }}
            >
                {isDragging ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-sm">
                        <div className="rounded-xl border border-dashed border-primary/40 bg-background px-8 py-6 text-center shadow-sm">
                            <ArrowUpTrayIcon className="mx-auto mb-3 h-8 w-8 text-primary" />
                            <p className="text-sm font-medium">
                                Drop skill zip to import
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                The bundle will be imported into agent skill
                                storage and replace matching files.
                            </p>
                        </div>
                    </div>
                ) : null}
                <div className="w-72 border-r flex flex-col bg-muted/10">
                    <div className="p-3 border-b">
                        <div className="flex items-center gap-2">
                            <Tabs
                                value={scope}
                                onValueChange={(value) =>
                                    setScope(value as SkillScope)
                                }
                                className="min-w-0 flex-1 gap-0"
                            >
                                <TabsList className="w-full">
                                    <TabsTrigger
                                        value="agent"
                                        className="flex-1"
                                    >
                                        Agent
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="system"
                                        className="flex-1"
                                    >
                                        System
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <div className="flex items-center gap-1 shrink-0">
                                {scope === "agent" ? (
                                    <>
                                        <input
                                            ref={uploadInputRef}
                                            type="file"
                                            accept=".zip,application/zip"
                                            className="hidden"
                                            onChange={handleZipSelected}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                uploadInputRef.current?.click()
                                            }
                                            disabled={importMutation.isPending}
                                        >
                                            <ArrowUpTrayIcon className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <SkillTreeNode
                            agentId={agentId || ""}
                            scope={scope}
                            path="/"
                            depth={0}
                            expandedPaths={expandedPaths}
                            selectedPath={selectedEntry?.path || null}
                            onToggle={toggleExpandedPath}
                            onSelect={setSelectedEntry}
                            onDelete={setDeleteSkillSlug}
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    <div className="flex items-center gap-3 py-5 px-3 border-b shrink-0">
                        <div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
                            <DocumentTextIcon className="h-4 w-4 mr-2 text-muted-foreground/70" />
                            <span className="font-medium text-foreground">
                                {selectedEntry
                                    ? previewTitle(selectedEntry.path)
                                    : "Preview"}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-3">
                        {!selectedEntry ? (
                            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 px-6 text-center">
                                <DocumentTextIcon className="mb-3 h-8 w-8 text-muted-foreground/60" />
                                <p className="text-sm font-medium">
                                    Select a file to preview it
                                </p>
                                <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                                    Open folders from the left panel to navigate
                                    the skill tree. Text files such as
                                    `SKILL.md` will render here.
                                </p>
                            </div>
                        ) : fileQuery.isLoading ? (
                            <InlineLoader />
                        ) : fileQuery.error ? (
                            <div className="text-sm text-destructive">
                                {fileQuery.error.message}
                            </div>
                        ) : fileQuery.data?.is_text ? (
                            selectedEntry?.path.toLowerCase().endsWith(".md") ||
                            selectedEntry?.path
                                .toLowerCase()
                                .endsWith(".markdown") ? (
                                <MarkdownViewer
                                    content={fileQuery.data.content || ""}
                                />
                            ) : (
                                <CodeFileViewer
                                    path={selectedEntry?.path || ""}
                                    value={fileQuery.data.content || ""}
                                />
                            )
                        ) : (
                            <div className="rounded-lg border bg-muted/10 p-3 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    Binary file
                                </p>
                                <p className="mt-1">
                                    This file cannot be rendered as inline text.
                                </p>
                                <p className="mt-2 text-xs">
                                    Size:{" "}
                                    {formatFileSize(fileQuery.data?.size_bytes)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={!!deleteSkillSlug}
                onClose={() => setDeleteSkillSlug(null)}
                onConfirm={async () => {
                    if (!deleteSkillSlug) return;
                    await deleteMutation.mutateAsync(deleteSkillSlug);
                    setDeleteSkillSlug(null);
                    if (
                        selectedEntry?.path === `/${deleteSkillSlug}` ||
                        selectedEntry?.path.startsWith(`/${deleteSkillSlug}/`)
                    ) {
                        setSelectedEntry(null);
                    }
                    setExpandedPaths((prev) => {
                        const next = new Set<string>();
                        for (const value of prev) {
                            if (
                                value !== `/${deleteSkillSlug}` &&
                                !value.startsWith(`/${deleteSkillSlug}/`)
                            ) {
                                next.add(value);
                            }
                        }
                        return next;
                    });
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
                    if (!open) {
                        setPendingImportFile(null);
                        setImportScope("agent");
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Skill Bundle</DialogTitle>
                        <DialogDescription>
                            Zip bundles always import into agent skill storage.
                            Existing files are replaced automatically.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Bundle
                            </div>
                            <div className="mt-1 text-sm font-medium">
                                {pendingImportFile?.name || "No file selected"}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                Destination
                            </div>
                            <div className="inline-flex w-full rounded-md border border-border/70 bg-background p-1">
                                <button
                                    type="button"
                                    onClick={() => setImportScope("agent")}
                                    className={cn(
                                        "flex-1 rounded px-3 py-2 text-sm transition-colors",
                                        importScope === "agent"
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    Agent Skills
                                </button>
                                <button
                                    type="button"
                                    disabled
                                    className="flex-1 rounded px-3 py-2 text-sm text-muted-foreground/50"
                                >
                                    System Skills
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                System skills are read-only. Imports only go to
                                agent skill storage.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setIsImportDialogOpen(false);
                                setPendingImportFile(null);
                                setImportScope("agent");
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
