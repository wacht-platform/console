import { useMemo, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <Heading>MCP Servers</Heading>
                    <p className="text-sm text-muted-foreground">
                        Define reusable MCP servers at deployment level. These
                        servers are available across sessions in this
                        deployment.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New MCP Server
                </Button>
            </div>

            <InputGroup className="w-full max-w-sm">
                <Input
                    placeholder="Search MCP servers..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </InputGroup>

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
                                            <PencilIcon className="h-4 w-4" />
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
                <div className="rounded-md border p-8 text-center">
                    <h3 className="text-sm font-medium">No MCP servers</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your first MCP server to make it available in
                        this deployment.
                    </p>
                    <Button className="mt-4" onClick={handleCreate}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New MCP Server
                    </Button>
                </div>
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
