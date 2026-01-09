import { useState } from "react";
import { useNavigate } from "react-router";
import {
	PlusIcon,
	CodeBracketSquareIcon,
	MagnifyingGlassIcon,
	ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "../../components/ui/heading";
import { Button } from "../../components/ui/button";
import { Input, InputGroup } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { Spinner } from "../../components/ui/spinner";
import { useAgents, type Agent } from "../../lib/api/hooks/use-agents";

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
					<Heading>AI Agents</Heading>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Manage AI agents that combine tools, workflows, and knowledge bases
					</p>
				</div>
				{!isLoading && !error && (
					<Button onClick={handleCreateAgent}>
						<PlusIcon className="mr-2 h-4 w-4" />
						Create Agent
					</Button>
				)}
			</div>

			{/* Search */}
			{!isLoading && !error && agents.length > 0 && (
				<div className="mb-4">
					<InputGroup className="max-w-sm">
						<MagnifyingGlassIcon className="size-4" />
						<Input
							name="search"
							placeholder="Search agents..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</InputGroup>
				</div>
			)}

			{/* Content */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center min-h-[400px] py-12">
					<Spinner size="lg" />
					<p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading agents...</p>
				</div>
			) : error ? (
				<div className="text-center py-12">
					<p className="text-red-600 dark:text-red-400">Error loading agents: {error.message}</p>
				</div>
			) : agents.length === 0 ? (
				<div className="text-center py-12">
					<CodeBracketSquareIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
					<h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
						No AI agents
					</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Get started by creating your first AI agent.
					</p>
					<div className="mt-6">
						<Button onClick={handleCreateAgent}>
							<PlusIcon className="mr-2 h-4 w-4" />
							Create Agent
						</Button>
					</div>
				</div>
			) : (
				<ul className="divide-y divide-gray-100 dark:divide-zinc-800">
					{agents.map((agent) => (
						<li
							key={agent.id}
							onClick={() => handleRowClick(agent)}
							className="flex items-center justify-between gap-x-6 py-4 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
						>
							<div className="flex items-center gap-x-4 min-w-0">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
									<CodeBracketSquareIcon className="h-5 w-5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
										{agent.name}
									</p>
									<p className="text-sm text-gray-500 dark:text-gray-400 truncate">
										{agent.description || "No description"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="hidden sm:flex items-center gap-2">
									{agent.tools_count > 0 && (
										<Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
											{agent.tools_count} tools
										</Badge>
									)}
									{agent.workflows_count > 0 && (
										<Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
											{agent.workflows_count} workflows
										</Badge>
									)}
									{agent.knowledge_bases_count > 0 && (
										<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
											{agent.knowledge_bases_count} docs
										</Badge>
									)}
								</div>
								<ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
							</div>
						</li>
					))}
				</ul>
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
