import { useState } from "react";
import { useNavigate } from "react-router";
import {
    WrenchScrewdriverIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { InlineLoader } from "../../components/ui/loading-screen";
import { useTools, useDeleteTool } from "../../lib/api/hooks/use-tools";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import type { AiTool } from "@/types/ai-tool";

const getTypeBadge = (type: string) => {
    switch (type) {
        case "api":
            return "API Call";
        case "knowledge_base":
            return "Knowledge Base";
        case "platform_event":
            return "Platform Event";
        case "code_runner":
            return "Code Runner";
        default:
            return "Unknown";
    }
};

export default function ToolsPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [toolToDelete, setToolToDelete] = useState<AiTool | null>(null);

    // API hooks
    const { data, isLoading, error } = useTools({
        search: searchTerm || undefined,
    });
    const tools = data?.tools || [];
    const deleteToolMutation = useDeleteTool();

    const handleCreateTool = () => {
        navigate("new");
    };

    const handleEditTool = (tool: AiTool) => {
        navigate(`${tool.id}/edit`, { state: { tool } });
    };

    const handleDeleteTool = (tool: AiTool) => {
        setToolToDelete(tool);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (toolToDelete) {
            try {
                await deleteToolMutation.mutateAsync(toolToDelete.id);
                setConfirmDeleteOpen(false);
                setToolToDelete(null);
            } catch (error) {
                console.error("Failed to delete tool:", error);
            }
        }
    };

    return (
        <div>
            <div className="mb-5 flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-lg font-medium tracking-tight">
                        Tools
                    </h1>
                    <p className="text-[13px] text-muted-foreground">
                        Manage tools that can be used by AI agents
                    </p>
                </div>
                {!isLoading && !error && (
                    <Button onClick={handleCreateTool}>Create Tool</Button>
                )}
            </div>

            {!isLoading && !error && tools.length > 0 && (
                <div className="relative mb-5">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/4 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 pl-9"
                    />
                </div>
            )}

            {isLoading ? (
                <InlineLoader />
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-destructive">
                        Error loading tools: {error.message}
                    </p>
                </div>
            ) : tools.length === 0 ? (
                <div className="text-center py-12">
                    <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-normal">No tools</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Get started by creating your first AI tool.
                    </p>
                    <div className="mt-6">
                        <Button onClick={handleCreateTool}>Create Tool</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {tools.map((tool) => (
                        <div
                            key={tool.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleEditTool(tool)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleEditTool(tool);
                                }
                            }}
                            className="group flex items-start gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/20"
                        >
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2.5">
                                    <span className="truncate text-[14px] font-medium leading-5">
                                        {tool.name}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="h-5 rounded-md px-1.5 text-[11px] font-medium"
                                    >
                                        {getTypeBadge(tool.tool_type)}
                                    </Badge>
                                </div>
                                <p
                                    className="line-clamp-1 text-[13px] leading-5 text-muted-foreground"
                                    title={tool.description || ""}
                                >
                                    {tool.description || "No description"}
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="mt-0.5 h-7 w-7 shrink-0 text-muted-foreground"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <EllipsisHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTool(tool);
                                        }}
                                    >
                                        <TrashIcon className="mr-2 h-4 w-4" />
                                        Delete tool
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmationDialog
                isOpen={confirmDeleteOpen}
                onClose={() => {
                    setConfirmDeleteOpen(false);
                    setToolToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Tool"
                message={
                    toolToDelete
                        ? `Are you sure you want to delete the tool "${toolToDelete.name}"? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                isDestructive={true}
                isLoading={deleteToolMutation.isPending}
            />
        </div>
    );
}
