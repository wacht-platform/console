import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
    CpuChipIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon,
    FunnelIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PageHead } from "@/components/ui/page-head";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Pill } from "@/components/ui/pill";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { InlineLoader } from "../../components/ui/loading-screen";
import { useAgents, type Agent } from "../../lib/api/hooks/use-agents";
import { useTour } from "../../lib/tour";
import { apiClient } from "../../lib/api/client";
import {
    hasProviderApiKey,
    isS3StorageConfigured,
    type AISettingsSummary,
} from "../../lib/ai-settings";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/app-table";
import { TableEmptyRow } from "@/components/ui/table-empty-row";

export default function CreateAgentsPage() {
    const navigate = useNavigate();
    const { projectId, deploymentId } = useParams();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // API hooks
    const { data, isLoading, error } = useAgents({
        search: searchTerm || undefined,
    });
    const { data: aiSettings } = useQuery({
        queryKey: ["ai-settings-summary", deploymentId],
        queryFn: async () => {
            const { data } = await apiClient.get<AISettingsSummary>(
                `/deployments/${deploymentId}/ai/settings`,
            );
            return data;
        },
        enabled: !!deploymentId,
    });
    const agents = data?.agents || [];

    useTour("first-agents", !isLoading);
    const providerApiKeyConfigured = hasProviderApiKey(aiSettings);
    const s3StorageConfigured = isS3StorageConfigured(aiSettings);
    const aiSettingsPath =
        projectId && deploymentId
            ? `/project/${projectId}/deployment/${deploymentId}/llms/ai-settings`
            : "../ai-settings";

    const handleCreateAgent = () => {
        setEditingAgent(null);
        setIsCreateDialogOpen(true);
    };

    const handleRowClick = (agent: Agent) => {
        navigate(agent.id);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Agents platform"
                title="AI agents"
                sub="Manage agents that combine tools, skills and knowledge bases"
                actions={
                    !isLoading && !error ? (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        data-tour-id="agents-search"
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
                                            placeholder="Search agents…"
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="h-8 bg-secondary pl-8 text-[13px]"
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button
                                data-tour-id="agents-create-button"
                                onClick={handleCreateAgent}
                            >
                                <PlusIcon className="h-4 w-4" />
                                Create agent
                            </Button>
                        </>
                    ) : undefined
                }
            />
            {aiSettings &&
                (!providerApiKeyConfigured || !s3StorageConfigured) && (
                    <div className="flex flex-col gap-2">
                        {!providerApiKeyConfigured && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                                Configure a Gemini, OpenAI, or OpenRouter API
                                key before running agents.{" "}
                                <Link
                                    to={aiSettingsPath}
                                    className="underline font-medium"
                                >
                                    Manage AI settings
                                </Link>
                            </div>
                        )}
                        {!s3StorageConfigured && providerApiKeyConfigured && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                                Configure customer S3 storage before running
                                agents that use workspaces, uploads, or vector
                                tables.{" "}
                                <Link
                                    to={aiSettingsPath}
                                    className="underline font-medium"
                                >
                                    Manage AI settings
                                </Link>
                            </div>
                        )}
                    </div>
                )}

            {/* Content */}
            {isLoading ? (
                <InlineLoader />
            ) : error ? (
                <div className="text-center py-12">
                    <p className="text-destructive">
                        Error loading agents: {error.message}
                    </p>
                </div>
            ) : agents.length === 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Capabilities</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableEmptyRow
                            colSpan={4}
                            icon={
                                <CpuChipIcon className="h-8 w-8 text-muted-foreground/50" />
                            }
                            title="No AI agents"
                            description="Get started by creating your first AI agent."
                            action={
                                <Button onClick={handleCreateAgent}>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Create Agent
                                </Button>
                            }
                        />
                    </TableBody>
                </Table>
            ) : (
                <Table data-tour-id="agents-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Capabilities</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.map((agent) => (
                            <TableRow
                                key={agent.id}
                                onClick={() => handleRowClick(agent)}
                                className="cursor-pointer group"
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <CpuChipIcon className="h-4 w-4" />
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {agent.name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-0">
                                    <span
                                        className="block truncate text-muted-foreground"
                                        title={agent.description || ""}
                                    >
                                        {agent.description || "No description"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {agent.tools_count > 0 ||
                                    agent.knowledge_bases_count > 0 ? (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {agent.tools_count > 0 && (
                                                <Pill tone="info">
                                                    {agent.tools_count} tool
                                                    {agent.tools_count === 1
                                                        ? ""
                                                        : "s"}
                                                </Pill>
                                            )}
                                            {agent.knowledge_bases_count >
                                                0 && (
                                                <Pill tone="mute">
                                                    {
                                                        agent.knowledge_bases_count
                                                    }{" "}
                                                    KB
                                                    {agent.knowledge_bases_count ===
                                                    1
                                                        ? ""
                                                        : "s"}
                                                </Pill>
                                            )}
                                        </div>
                                    ) : (
                                        <Pill tone="mute">no capabilities</Pill>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <CreateAgentDialog
                open={isCreateDialogOpen}
                onClose={() => {
                    setIsCreateDialogOpen(false);
                    setEditingAgent(null);
                }}
                agent={editingAgent}
            />
        </div>
    );
}
