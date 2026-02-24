import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
    ArrowLeftIcon,
    ClipboardDocumentIcon,
    LinkIcon,
    WrenchScrewdriverIcon,
    BookOpenIcon,
    CheckIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    EllipsisVerticalIcon,
    CodeBracketIcon,
    UserGroupIcon,
    FireIcon,
    InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { InlineLoader } from "../../components/ui/loading-screen";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { CreateIntegrationDialog } from "../../components/ai-agents/create-integration-dialog";
import { useAgentById, useDeleteAgent, useAgents, type Agent } from "../../lib/api/hooks/use-agents";
import { useDeleteIntegration } from "../../lib/api/hooks/use-integrations";
import { useGenerateAgentTicket } from "../../lib/hooks/use-generate-ticket";
import { useProjects } from "../../lib/api/hooks/use-projects";
import { useTools } from "../../lib/api/hooks/use-tools";
import { useKnowledgeBases } from "../../lib/api/hooks/use-knowledge-bases";
import {
    useAgentMcpServers,
} from "../../lib/api/hooks/use-mcp-servers";
import { BsMicrosoftTeams } from "react-icons/bs";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import type { AgentIntegration } from "@/types/agent-integration";

const getIntegrationIcon = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case "teams":
            return <BsMicrosoftTeams className="h-5 w-5 text-[#6264A7]" />;
        default:
            return <LinkIcon className="h-5 w-5 text-muted-foreground" />;
    }
};

const getIntegrationLabel = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case "teams": return "Microsoft Teams";
        default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

export default function AgentDetailsPage() {
    const navigate = useNavigate();
    const { agentId } = useParams<{ agentId: string }>();
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    // Integration management state
    const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState<AgentIntegration | null>(null);
    const [confirmDeleteIntegrationOpen, setConfirmDeleteIntegrationOpen] = useState(false);
    const [integrationToDelete, setIntegrationToDelete] = useState<AgentIntegration | null>(null);

    const [contextGroup, setContextGroup] = useState("");

    const { data: agent, isLoading, error } = useAgentById(agentId || "");
    const deleteAgentMutation = useDeleteAgent();
    const deleteIntegrationMutation = useDeleteIntegration(agentId || "");
    const generateTicketMutation = useGenerateAgentTicket();
    const { selectedDeployment } = useProjects();

    // Fetch related resources to manually map them (workaround for backend details endpoint)
    const { data: toolsData } = useTools({ limit: 100 });
    const { data: knowledgeBasesData } = useKnowledgeBases({ limit: 100 });
    const { data: agentsData } = useAgents({ limit: 100 });
    const { data: attachedMcpServers = [] } = useAgentMcpServers(agentId || "");

    const allTools = toolsData?.tools || [];
    const allKnowledgeBases = knowledgeBasesData?.data || [];
    const allAgents = agentsData?.agents || [];

    const subAgentIds = (agent?.sub_agents as string[]) || [];
    const subAgents = allAgents.filter(a => subAgentIds.includes(a.id) && a.id !== agent?.id);

    const attachedToolIds = (agent?.configuration?.tool_ids as string[]) || [];
    const attachedKbIds = (agent?.configuration?.knowledge_base_ids as string[]) || [];

    const attachedTools = allTools.filter(t => attachedToolIds.includes(t.id));
    const attachedKnowledgeBases = allKnowledgeBases.filter(kb => attachedKbIds.includes(kb.id));

    const handleCopyUrl = async (url: string) => {
        await navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleDelete = async () => {
        if (agent) {
            try {
                await deleteAgentMutation.mutateAsync(agent.id);
                navigate("../ai-agents");
            } catch (error) {
                console.error("Failed to delete agent:", error);
            }
        }
    };

    const handleAddIntegration = () => {
        return;
    };

    const handleEditIntegration = (integration: AgentIntegration) => {
        setEditingIntegration(integration);
        setIsIntegrationDialogOpen(true);
    };

    const handleDeleteIntegration = (integration: AgentIntegration) => {
        setIntegrationToDelete(integration);
        setConfirmDeleteIntegrationOpen(true);
    };

    const handleConfirmDeleteIntegration = async () => {
        if (integrationToDelete) {
            try {
                await deleteIntegrationMutation.mutateAsync(integrationToDelete.id);
                setConfirmDeleteIntegrationOpen(false);
                setIntegrationToDelete(null);
            } catch (error) {
                console.error("Failed to delete integration:", error);
            }
        }
    };

    if (isLoading) {
        return <InlineLoader />;
    }

    if (error || !agent) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">
                    {error?.message || "Agent not found"}
                </p>
                <Link to="../ai-agents">
                    <Button className="mt-4" variant="outline">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Back to Agents
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-normal tracking-tight">{agent.name || "Unnamed Agent"}</h1>
                        <p className="text-sm text-muted-foreground max-w-2xl line-clamp-4" title={agent.description || ""}>
                            {agent.description || "No description"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit Agent
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setConfirmDeleteOpen(true)}
                        >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tools" className="w-full">
                <TabsList className="w-full justify-start p-1 bg-muted/20 rounded-lg h-auto inline-flex w-auto">
                    <TabsTrigger value="tools">
                        <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                        Tools
                    </TabsTrigger>
                    <TabsTrigger value="knowledge">
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        Knowledge Base
                    </TabsTrigger>
                    <TabsTrigger value="mcp">
                        <CodeBracketIcon className="h-4 w-4 mr-2" />
                        MCP Servers
                    </TabsTrigger>
                    <TabsTrigger value="swarm">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        Swarm
                    </TabsTrigger>
                    <TabsTrigger value="debug">
                        <CodeBracketIcon className="h-4 w-4 mr-2" />
                        Debug
                    </TabsTrigger>
                    <TabsTrigger value="integrations">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Integrations
                    </TabsTrigger>
                </TabsList>

                {/* Tools Content */}
                <TabsContent value="tools" className="pt-6">
                    {attachedTools.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attachedTools.map((tool: any) => (
                                        <TableRow key={tool.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <WrenchScrewdriverIcon className="h-4 w-4 text-muted-foreground" />
                                                    {tool.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-sm truncate" title={tool.description}>{tool.description}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">{tool.tool_type.replace('_', ' ')}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg border-dashed">
                            <p className="text-muted-foreground">No tools attached to this agent.</p>
                            <Button variant="link" onClick={() => setIsEditDialogOpen(true)}>Edit Agent to add Tools</Button>
                        </div>
                    )}
                </TabsContent>

                {/* Knowledge Base Content */}
                <TabsContent value="knowledge" className="pt-6">
                    {attachedKnowledgeBases.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Documents</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attachedKnowledgeBases.map((kb: any) => (
                                        <TableRow key={kb.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <BookOpenIcon className="h-4 w-4 text-emerald-500" />
                                                    {kb.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{kb.documents_count} documents</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg border-dashed">
                            <p className="text-muted-foreground">No knowledge bases attached.</p>
                            <Button variant="link" onClick={() => setIsEditDialogOpen(true)}>Edit Agent to add Knowledge Bases</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="mcp" className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium">MCP Servers</h3>
                            <p className="text-sm text-muted-foreground">
                                MCP servers attached to this agent.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit Attachments
                        </Button>
                    </div>

                    {attachedMcpServers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Endpoint</TableHead>
                                    <TableHead>Auth</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attachedMcpServers.map((server) => (
                                    <TableRow key={server.id}>
                                        <TableCell className="font-medium">{server.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{server.config.endpoint}</TableCell>
                                        <TableCell>
                                            {server.config.auth?.type === "token"
                                                ? "Token"
                                                : server.config.auth?.type === "oauth_client_credentials"
                                                    ? "OAuth Client Credentials"
                                                    : server.config.auth?.type === "oauth_authorization_code_public_pkce"
                                                        ? "OAuth Authorization Code (Public PKCE)"
                                                        : server.config.auth?.type === "oauth_authorization_code_confidential_pkce"
                                                            ? "OAuth Authorization Code (Confidential PKCE)"
                                                    : "None"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground text-sm">Attached</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 border rounded-lg border-dashed">
                            <p className="text-sm text-muted-foreground">No MCP servers attached.</p>
                            <Button variant="link" onClick={() => setIsEditDialogOpen(true)}>
                                Edit Agent to attach MCP servers
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Swarm Content */}
                <TabsContent value="swarm" className="pt-6 space-y-8">
                    {/* Spawn Configuration */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <FireIcon className="h-5 w-5 text-orange-500" />
                            <h3 className="text-lg font-medium">Spawn Configuration</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Settings that control how this agent can spawn child agents during execution.
                        </p>

                        {agent.spawn_config ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="border rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-1">Max Parallel Children</p>
                                    <p className="text-2xl font-semibold">{agent.spawn_config.max_parallel_children ?? 10}</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-1">Default Timeout</p>
                                    <p className="text-2xl font-semibold">{agent.spawn_config.default_timeout_secs ?? 300}s</p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center gap-1 mb-1">
                                        <p className="text-sm text-muted-foreground">Allow Fork</p>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InformationCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Spawn a copy of itself to handle sub-tasks independently</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <p className={`text-2xl font-semibold ${agent.spawn_config.allow_fork !== false ? 'text-green-600' : 'text-red-600'}`}>
                                        {agent.spawn_config.allow_fork !== false ? 'Yes' : 'No'}
                                    </p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center gap-1 mb-1">
                                        <p className="text-sm text-muted-foreground">Allow Exec</p>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <InformationCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Spawn different agents from the approved swarm list</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <p className={`text-2xl font-semibold ${agent.spawn_config.allow_exec !== false ? 'text-green-600' : 'text-red-600'}`}>
                                        {agent.spawn_config.allow_exec !== false ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No spawn configuration set. Edit agent to configure.</p>
                        )}
                    </div>

                    {/* Sub-Agents */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <UserGroupIcon className="h-5 w-5 text-purple-500" />
                            <h3 className="text-lg font-medium">Swarm Agents</h3>
                            {subAgents.length > 0 && (
                                <Badge variant="secondary">{subAgents.length}</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Agents that this agent can spawn during execution for task delegation.
                        </p>

                        {subAgents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subAgents.map((subAgent: Agent) => (
                                    <div
                                        key={subAgent.id}
                                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <UserGroupIcon className="h-4 w-4 text-primary" />
                                            <p className="font-medium">{subAgent.name}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {subAgent.description || "No description"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border rounded-lg border-dashed">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <UserGroupIcon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mt-2 text-sm font-normal">No swarm agents</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    This agent cannot spawn other agents. Edit agent to add swarm members.
                                </p>
                                <div className="mt-6">
                                    <Button variant="link" onClick={() => setIsEditDialogOpen(true)}>
                                        Edit Agent Swarm Configuration
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Debug Content */}
                <TabsContent value="debug" className="pt-6">
                    <div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-1">Test Agent</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Generate a temporary ticket to test this agent in a simulated environment.
                                </p>
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label>Context Group</Label>
                                        <Input
                                            value={contextGroup}
                                            onChange={(e) => setContextGroup(e.target.value)}
                                            placeholder="e.g., test-session-1"
                                        />
                                        <p className="text-xs text-muted-foreground">Identifier for the test session</p>
                                    </div>
                                    <Button
                                        className="mb-[26px]"
                                        onClick={async () => {
                                            if (!contextGroup || !agent || !selectedDeployment) return;
                                            try {
                                                const result = await generateTicketMutation.mutateAsync({
                                                    deployment_id: String(selectedDeployment.id),
                                                    agent_ids: [agent.id],
                                                    context_group: contextGroup,
                                                    expires_in: 60 * 60 * 12,
                                                });
                                                const testUrl = `https://${selectedDeployment.backend_host}/vanity/agents?ticket=${result.ticket}`;
                                                window.open(testUrl, '_blank');
                                            } catch (err) {
                                                console.error("Failed to generate ticket:", err);
                                            }
                                        }}
                                        disabled={!contextGroup || generateTicketMutation.isPending || !selectedDeployment}
                                    >
                                        {generateTicketMutation.isPending ? "Generating..." : "Open Test Chat"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Integrations Content */}
                <TabsContent value="integrations" className="pt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium">Integrations</h3>
                            <p className="text-sm text-muted-foreground">Connect this agent to external platforms</p>
                            <p className="text-sm text-amber-600 mt-1">
                                Integrations are a beta feature. Please email us to get access.
                            </p>
                        </div>
                        <Button onClick={handleAddIntegration} disabled>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Integration
                        </Button>
                    </div>

                    {agent.integrations && agent.integrations.filter((integration: any) => {
                        const type = String(integration.integration_type || "").toLowerCase();
                        return type === "teams";
                    }).length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Webhook URL</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agent.integrations
                                        .filter((integration: any) => {
                                            const type = String(integration.integration_type || "").toLowerCase();
                                            return type === "teams";
                                        })
                                        .map((integration: any) => (
                                        <TableRow key={integration.id}>
                                            <TableCell className="font-medium">{integration.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getIntegrationIcon(integration.integration_type)}
                                                    <span>{getIntegrationLabel(integration.integration_type)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {integration.webhook_url ? (
                                                    <div className="flex items-center gap-2">
                                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] text-sm">
                                                            {integration.webhook_url.length > 40 ? integration.webhook_url.substring(0, 40) + "..." : integration.webhook_url}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleCopyUrl(integration.webhook_url)}
                                                        >
                                                            {copiedUrl === integration.webhook_url ? (
                                                                <CheckIcon className="h-3 w-3 text-green-500" />
                                                            ) : (
                                                                <ClipboardDocumentIcon className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <EllipsisVerticalIcon className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditIntegration(integration)}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteIntegration(integration)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg border-dashed">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <LinkIcon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="mt-2 text-sm font-normal">No integrations</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Get started by connecting your first platform
                            </p>
                            <p className="mt-2 text-sm text-amber-600">
                                Integrations are a beta feature. Please email us to get access.
                            </p>
                            <div className="mt-6">
                                <Button onClick={handleAddIntegration} disabled>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add Integration
                                </Button>
                            </div>
                        </div>
                    )}

                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <CreateAgentDialog
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                agent={agent as Agent}
            />

            {/* Delete Confirmation */}
            <ConfirmationDialog
                isOpen={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Agent"
                message={`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
                isLoading={deleteAgentMutation.isPending}
            />

            {/* Integration Dialog */}
            <CreateIntegrationDialog
                open={isIntegrationDialogOpen}
                onClose={() => {
                    setIsIntegrationDialogOpen(false);
                    setEditingIntegration(null);
                }}
                agentId={agentId || ""}
                integration={editingIntegration || undefined}
            />

            {/* Integration Delete Confirmation */}
            <ConfirmationDialog
                isOpen={confirmDeleteIntegrationOpen}
                onClose={() => {
                    setConfirmDeleteIntegrationOpen(false);
                    setIntegrationToDelete(null);
                }}
                onConfirm={handleConfirmDeleteIntegration}
                title="Delete Integration"
                message={integrationToDelete ? `Are you sure you want to delete "${integrationToDelete.name}"?` : ''}
                confirmText="Delete"
                isDestructive={true}
                isLoading={deleteIntegrationMutation.isPending}
            />
        </div>
    );
}
