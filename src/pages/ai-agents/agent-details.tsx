import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
    ArrowLeftIcon,
    ClipboardDocumentIcon,
    LinkIcon,
    WrenchIcon,
    ArrowPathIcon,
    BookOpenIcon,
    CheckIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "../../components/ui/heading";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { CreateIntegrationDialog } from "../../components/ai-agents/create-integration-dialog";
import { useAgentById, useDeleteAgent, type Agent } from "../../lib/api/hooks/use-agents";
import { useDeleteIntegration } from "../../lib/api/hooks/use-integrations";
import { BsMicrosoftTeams } from "react-icons/bs";
import { SiWhatsapp, SiClickup } from "react-icons/si";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import type { AgentIntegration } from "@/types/agent-integration";

type TabType = "integrations" | "tools" | "workflows" | "knowledge";

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
            return <LinkIcon className="h-5 w-5 text-gray-400" />;
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
    const [activeTab, setActiveTab] = useState<TabType>("integrations");
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    // Integration management state
    const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState<AgentIntegration | null>(null);
    const [confirmDeleteIntegrationOpen, setConfirmDeleteIntegrationOpen] = useState(false);
    const [integrationToDelete, setIntegrationToDelete] = useState<AgentIntegration | null>(null);

    const { data: agent, isLoading, error } = useAgentById(agentId || "");
    const deleteAgentMutation = useDeleteAgent();
    const deleteIntegrationMutation = useDeleteIntegration(agentId || "");

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

    const tabs = [
        { id: "integrations" as const, label: "Integrations", icon: LinkIcon },
        { id: "tools" as const, label: "Tools", icon: WrenchIcon },
        { id: "workflows" as const, label: "Workflows", icon: ArrowPathIcon },
        { id: "knowledge" as const, label: "Knowledge Base", icon: BookOpenIcon },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading agent...</p>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">
                    {error?.message || "Agent not found"}
                </p>
                <Link to="../ai-agents">
                    <Button className="mt-4">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Back to Agents
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <Heading>{agent.name || "Unnamed Agent"}</Heading>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-2xl">
                        {agent.description || "No description"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button outline onClick={() => setIsEditDialogOpen(true)}>
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        outline
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => setConfirmDeleteOpen(true)}
                    >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-zinc-700 mb-6">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                                    }
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "integrations" && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect this agent to external platforms
                        </p>
                        <Button onClick={handleAddIntegration}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Integration
                        </Button>
                    </div>
                    {agent.integrations && agent.integrations.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {agent.integrations.map((integration: any) => {
                                return (
                                    <li key={integration.id} className="py-6 first:pt-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getIntegrationIcon(integration.integration_type)}
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {integration.name}
                                                    </p>
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                                        {getIntegrationLabel(integration.integration_type)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Menu as="div" className="relative">
                                                <MenuButton className="flex items-center rounded-full p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                                    <EllipsisVerticalIcon className="h-5 w-5" />
                                                </MenuButton>
                                                <MenuItems className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white dark:bg-zinc-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none">
                                                    <MenuItem>
                                                        {({ focus }) => (
                                                            <button
                                                                onClick={() => handleEditIntegration(integration)}
                                                                className={`${focus ? 'bg-gray-50 dark:bg-zinc-700' : ''} block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200`}
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                    <MenuItem>
                                                        {({ focus }) => (
                                                            <button
                                                                onClick={() => handleDeleteIntegration(integration)}
                                                                className={`${focus ? 'bg-gray-50 dark:bg-zinc-700' : ''} block w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400`}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                </MenuItems>
                                            </Menu>
                                        </div>
                                        {integration.webhook_url && integration.integration_type !== "clickup" && (
                                            <div className="mt-3">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                    Webhook URL
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-xs px-3 py-2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-mono overflow-x-auto">
                                                        {integration.webhook_url}
                                                    </code>
                                                    <Button
                                                        outline
                                                        className="shrink-0 h-8 w-8 !p-0 flex items-center justify-center"
                                                        onClick={() => handleCopyUrl(integration.webhook_url)}
                                                    >
                                                        {copiedUrl === integration.webhook_url ? (
                                                            <CheckIcon className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <ClipboardDocumentIcon className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                                <PlusIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                                No integrations yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                </div>
            )}

            {activeTab === "tools" && (
                <div>
                    {agent.tools && agent.tools.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {agent.tools.map((tool: any) => (
                                <li key={tool.id} className="flex items-center gap-3 py-3">
                                    <WrenchIcon className="h-5 w-5 text-indigo-500" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{tool.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tool.tool_type}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                            No tools attached. Click Edit to add some.
                        </p>
                    )}
                </div>
            )}

            {activeTab === "workflows" && (
                <div>
                    {agent.workflows && agent.workflows.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {agent.workflows.map((workflow: any) => (
                                <li key={workflow.id} className="flex items-center gap-3 py-3">
                                    <ArrowPathIcon className="h-5 w-5 text-orange-500" />
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{workflow.name}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                            No workflows attached. Click Edit to add some.
                        </p>
                    )}
                </div>
            )}

            {activeTab === "knowledge" && (
                <div>
                    {agent.knowledge_bases && agent.knowledge_bases.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {agent.knowledge_bases.map((kb: any) => (
                                <li key={kb.id} className="flex items-center gap-3 py-3">
                                    <BookOpenIcon className="h-5 w-5 text-emerald-500" />
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{kb.name}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                            No knowledge bases attached. Click Edit to add some.
                        </p>
                    )}
                </div>
            )}

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
