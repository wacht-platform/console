import { useState } from "react";
import { useNavigate } from "react-router";
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
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	// API hooks
	const { data, isLoading, error } = useAgents({
		search: searchTerm || undefined,
	});
	const agents = data?.agents || [];

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
