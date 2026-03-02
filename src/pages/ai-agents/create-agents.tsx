import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
	CodeBracketSquareIcon,
	MagnifyingGlassIcon,
	ChevronRightIcon,
	PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { InlineLoader } from "../../components/ui/loading-screen";
import { useAgents, type Agent } from "../../lib/api/hooks/use-agents";
import { useBillingAccount } from "../../lib/api/hooks/use-billing";
import { apiClient } from "../../lib/api/client";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";

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
	const { data: billingAccount } = useBillingAccount();
	const { data: aiSettings } = useQuery({
		queryKey: ["ai-settings-summary", deploymentId],
		queryFn: async () => {
			const { data } = await apiClient.get<{ gemini_api_key_set: boolean }>(
				`/deployments/${deploymentId}/ai/settings`,
			);
			return data;
		},
		enabled: !!deploymentId,
	});
	const agents = data?.agents || [];
	const currentPlan = billingAccount?.subscription?.plan_name?.toLowerCase();
	const isGrowthPlan = currentPlan === "growth";
	const isPulseUsagePaused = !!billingAccount?.pulse_usage_disabled;
	const hasCustomGeminiKey = !!aiSettings?.gemini_api_key_set;
	const subscriptionPath =
		projectId && deploymentId
			? `/project/${projectId}/deployment/${deploymentId}/billing/subscription`
			: "../billing/subscription";

	const handleCreateAgent = () => {
		setEditingAgent(null);
		setIsCreateDialogOpen(true);
	};

	const handleRowClick = (agent: Agent) => {
		navigate(agent.id);
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-normal tracking-tight">AI Agents</h1>
					<p className="text-sm text-muted-foreground">
						Manage AI agents that combine tools and knowledge bases
					</p>
				</div>
				{!isLoading && !error && (
					<Button onClick={handleCreateAgent}>
						<PlusIcon className="h-4 w-4 mr-2" />
						Create Agent
					</Button>
				)}
			</div>
			{(!isGrowthPlan || isPulseUsagePaused) && (
				<div className="mb-6 flex flex-col gap-2">
					{!isGrowthPlan && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
							AI agent usage is available on Growth plan. You can still create and configure agents.{" "}
							<Link to={subscriptionPath} className="underline font-medium">
								Manage subscription
							</Link>
						</div>
					)}
					{isPulseUsagePaused && !hasCustomGeminiKey && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
							AI usage is paused until prepaid balance is recharged.{" "}
							<Link to={subscriptionPath} className="underline font-medium">
								Manage subscription
							</Link>
						</div>
					)}
				</div>
			)}

			{/* Search */}
			{!isLoading && !error && agents.length > 0 && (
				<div className="relative mb-6">
					<MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search agents..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
			)}

			{/* Content */}
			{isLoading ? (
				<InlineLoader />
			) : error ? (
				<div className="text-center py-12">
					<p className="text-destructive">Error loading agents: {error.message}</p>
				</div>
			) : agents.length === 0 ? (
				<div className="text-center py-12">
					<CodeBracketSquareIcon className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-2 text-sm font-normal">
						No AI agents
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Get started by creating your first AI agent.
					</p>
					<div className="mt-6">
						<Button onClick={handleCreateAgent}>
							<PlusIcon className="h-4 w-4 mr-2" />
							Create Agent
						</Button>
					</div>
				</div>
			) : (
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
						{agents.map((agent) => (
							<TableRow
								key={agent.id}
								onClick={() => handleRowClick(agent)}
								className="cursor-pointer group"
							>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<CodeBracketSquareIcon className="h-4 w-4" />
										</div>
										<span className="font-medium group-hover:text-primary transition-colors">
											{agent.name}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<span className="text-muted-foreground truncate max-w-sm block" title={agent.description || ""}>
										{agent.description || "No description"}
									</span>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										{agent.tools_count > 0 && (
											<Badge variant="secondary" className="font-normal">
												{agent.tools_count} tools
											</Badge>
										)}
										{agent.knowledge_bases_count > 0 && (
											<Badge variant="secondary" className="font-normal">
												{agent.knowledge_bases_count} docs
											</Badge>
										)}
										{agent.tools_count === 0 && agent.knowledge_bases_count === 0 && (
											<span className="text-xs text-muted-foreground italic">No capabilities</span>
										)}
									</div>
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
