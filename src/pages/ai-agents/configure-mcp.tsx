import { useMemo, useState } from "react";
import {
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    ServerStackIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { Input } from "@/components/ui/input";
import { PageHead } from "@/components/ui/page-head";
import { InlineLoader } from "@/components/ui/loading-screen";
import { CreateMcpServerDialog } from "@/components/ai-agents/create-mcp-server-dialog";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import {
    useDeleteMcpServer,
    useMcpServers,
} from "@/lib/api/hooks/use-mcp-servers";
import type { McpServer } from "@/types/mcp-server";

export default function ConfigureMCPPage() {
    const [query, setQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMcpServer, setEditingMcpServer] = useState<
        McpServer | undefined
    >(undefined);
    const [deletingMcpServer, setDeletingMcpServer] = useState<
        McpServer | undefined
    >(undefined);

    const { data, isLoading } = useMcpServers({ limit: 200, offset: 0 });
    const deleteMutation = useDeleteMcpServer();

    const filteredServers = useMemo(() => {
        const servers = data?.mcpServers ?? [];
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return servers;
        }
        return servers.filter((server) => {
            const endpoint = server.config.endpoint.toLowerCase();
            return (
                server.name.toLowerCase().includes(normalizedQuery) ||
                endpoint.includes(normalizedQuery)
            );
        });
    }, [data?.mcpServers, query]);

    const handleCreate = () => {
        setEditingMcpServer(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (server: McpServer) => {
        setEditingMcpServer(server);
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingMcpServer) return;
        try {
            await deleteMutation.mutateAsync(deletingMcpServer.id);
            setDeletingMcpServer(undefined);
        } catch (error) {
            console.error("Failed to delete MCP server", error);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Agents platform"
                title="MCP servers"
                sub="Reusable MCP servers available to every agent session in this deployment."
                actions={
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
                            <PopoverContent align="end" className="w-64 p-3">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search MCP servers…"
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        className="h-8 bg-secondary pl-8 text-[13px]"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleCreate}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            New MCP server
                        </Button>
                    </>
                }
            />

            {isLoading ? (
                <InlineLoader />
            ) : filteredServers.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Auth</TableHead>
                            <TableHead className="w-[140px] text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredServers.map((server) => (
                            <TableRow key={server.id}>
                                <TableCell className="font-medium">
                                    {server.name}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {server.config.endpoint}
                                </TableCell>
                                <TableCell>
                                    {server.config.auth?.type === "token"
                                        ? "Token"
                                        : server.config.auth?.type ===
                                            "oauth_client_credentials"
                                          ? "OAuth Client Credentials"
                                          : server.config.auth?.type ===
                                              "oauth_authorization_code_public_pkce"
                                            ? "OAuth Authorization Code (Public PKCE)"
                                            : server.config.auth?.type ===
                                                "oauth_authorization_code_confidential_pkce"
                                              ? "OAuth Authorization Code (Confidential PKCE)"
                                              : "None"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(server)}
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeletingMcpServer(server)
                                            }
                                        >
                                            <TrashIcon className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Auth</TableHead>
                            <TableHead className="w-[140px] text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableEmptyRow
                            colSpan={4}
                            icon={
                                <ServerStackIcon className="h-8 w-8 text-muted-foreground/50" />
                            }
                            title="No MCP servers"
                            description="Create your first MCP server to make it available in this deployment."
                        />
                    </TableBody>
                </Table>
            )}

            <CreateMcpServerDialog
                open={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setEditingMcpServer(undefined);
                }}
                mcpServer={editingMcpServer}
            />

            <ConfirmationDialog
                isOpen={!!deletingMcpServer}
                onClose={() => setDeletingMcpServer(undefined)}
                onConfirm={handleDelete}
                title="Delete MCP Server"
                message={
                    deletingMcpServer
                        ? `Delete "${deletingMcpServer.name}"? This removes it from this deployment.`
                        : ""
                }
                confirmText="Delete"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
