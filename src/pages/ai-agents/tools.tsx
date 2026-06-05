import { useState } from "react";
import { useNavigate } from "react-router";
import {
    WrenchScrewdriverIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    TrashIcon,
    PlusIcon,
    EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PageHead } from "@/components/ui/page-head";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Pill, type PillTone } from "@/components/ui/pill";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/app-table";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
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
            return "API call";
        case "knowledge_base":
            return "Knowledge base";
        case "platform_event":
            return "Platform event";
        case "code_runner":
            return "Code runner";
        default:
            return "Unknown";
    }
};

const getTypeTone = (type: string): PillTone => {
    switch (type) {
        case "api":
            return "info";
        case "platform_event":
            return "warn";
        case "knowledge_base":
            return "ok";
        default:
            return "mute";
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
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Agents platform"
                title="Tools"
                sub="Tools your agents can call — APIs, code runners and platform events."
                actions={
                    !isLoading && !error ? (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        <FunnelIcon className="size-4" />
                                        Filter
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="end"
                                    className="w-64 p-3"
                                >
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search tools…"
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="h-8 bg-secondary pl-8 text-[13px]"
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button onClick={handleCreateTool}>
                                <PlusIcon className="h-4 w-4" />
                                Create tool
                            </Button>
                        </>
                    ) : undefined
                }
            />

            {isLoading ? (
                <InlineLoader />
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-destructive">
                        Error loading tools: {error.message}
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[280px]">Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[140px]">Type</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tools.length === 0 ? (
                            <TableEmptyRow
                                colSpan={4}
                                icon={
                                    <WrenchScrewdriverIcon className="h-8 w-8 text-muted-foreground/50" />
                                }
                                title={
                                    searchTerm
                                        ? "No tools match your search"
                                        : "No tools yet"
                                }
                                description={
                                    searchTerm
                                        ? "Try a different search term."
                                        : "Create your first tool to give agents API calls, code runners and platform events."
                                }
                                action={
                                    searchTerm ? undefined : (
                                        <Button onClick={handleCreateTool}>
                                            <PlusIcon className="mr-2 h-4 w-4" />
                                            Create tool
                                        </Button>
                                    )
                                }
                            />
                        ) : (
                            tools.map((tool) => (
                                <TableRow
                                    key={tool.id}
                                    onClick={() => handleEditTool(tool)}
                                    className="group cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                <WrenchScrewdriverIcon className="h-4 w-4" />
                                            </span>
                                            <span className="truncate font-medium text-foreground">
                                                {tool.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-0">
                                        <span
                                            className="block truncate text-muted-foreground"
                                            title={tool.description || ""}
                                        >
                                            {tool.description ||
                                                "No description"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Pill tone={getTypeTone(tool.tool_type)}>
                                            {getTypeBadge(tool.tool_type)}
                                        </Pill>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 text-muted-foreground"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <EllipsisHorizontalIcon className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                align="end"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
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
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
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
