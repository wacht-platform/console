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
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { InlineLoader } from "../../components/ui/loading-screen";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { CreateIntegrationDialog } from "../../components/ai-agents/create-integration-dialog";
import { useAgentById, useDeleteAgent, type Agent } from "../../lib/api/hooks/use-agents";
import { useDeleteIntegration } from "../../lib/api/hooks/use-integrations";
import { useGenerateAgentTicket } from "../../lib/hooks/use-generate-ticket";
import { useProjects } from "../../lib/api/hooks/use-projects";
import { useTools } from "../../lib/api/hooks/use-tools";
import { useKnowledgeBases } from "../../lib/api/hooks/use-knowledge-bases";
import { BsMicrosoftTeams } from "react-icons/bs";
import { SiWhatsapp, SiClickup } from "react-icons/si";
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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import type { AgentIntegration } from "@/types/agent-integration";

const getIntegrationIcon = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case "teams":
            return <BsMicrosoftTeams className="h-5 w-5 text-[#6264A7]" />;
        case "whatsapp":
            return <SiWhatsapp className="h-5 w-5 text-[#25D366]" />;
        case "clickup":
            return <SiClickup className="h-5 w-5 text-[#7B44AC]" />;
        default:
            return <LinkIcon className="h-5 w-5 text-muted-foreground" />;
    }
};

const getIntegrationLabel = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case "teams": return "Microsoft Teams";
        case "whatsapp": return "WhatsApp";
        case "clickup": return "ClickUp";
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

    const allTools = toolsData?.tools || [];
    const allKnowledgeBases = knowledgeBasesData?.data || [];

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
        setEditingIntegration(null);
        setIsIntegrationDialogOpen(true);
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
            <Tabs defaultValue="integrations" className="w-full">
                <TabsList className="w-full justify-start p-1 bg-muted/20 rounded-lg h-auto inline-flex w-auto">
                    <TabsTrigger value="integrations">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="tools">
                        <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                        Tools
                    </TabsTrigger>
                    <TabsTrigger value="knowledge">
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        Knowledge Base
                    </TabsTrigger>
                    <TabsTrigger value="debug">
                        <CodeBracketIcon className="h-4 w-4 mr-2" />
                        Debug
                    </TabsTrigger>
                </TabsList>

                {/* Integrations Content */}
                <TabsContent value="integrations" className="pt-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium">Integrations</h3>
                            <p className="text-sm text-muted-foreground">Connect this agent to external platforms</p>
                        </div>
                        <Button onClick={handleAddIntegration}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Integration
                        </Button>
                    </div>

                    {agent.integrations && agent.integrations.length > 0 ? (
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
                                    {agent.integrations.map((integration: any) => (
                                        <TableRow key={integration.id}>
                                            <TableCell className="font-medium">{integration.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getIntegrationIcon(integration.integration_type)}
                                                    <span>{getIntegrationLabel(integration.integration_type)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {integration.webhook_url && integration.integration_type !== "clickup" ? (
                                                    <div className="flex items-center gap-2">
                                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
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
                            <div className="mt-6">
                                <Button onClick={handleAddIntegration}>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add Integration
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

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
                                        <p className="text-[10px] text-muted-foreground">Identifier for the test session</p>
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
