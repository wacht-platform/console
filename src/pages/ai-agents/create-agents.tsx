import { useState } from "react";
import {
	PlusIcon,
	CodeBracketSquareIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "../../components/ui/heading";
import { Button } from "../../components/ui/button";
import { Input, InputGroup } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { useAgents, useDeleteAgent, type Agent } from "../../lib/api/hooks/use-agents";

const getStatusColor = (status: string) => {
	switch (status) {
		case "active":
			return "bg-green-100 text-green-800";
		case "inactive":
			return "bg-red-100 text-red-800";
		case "draft":
			return "bg-yellow-100 text-yellow-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

export default function CreateAgentsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	// API hooks
	const { data, isLoading, error } = useAgents({
		search: searchTerm || undefined,
	});
	const agents = data?.agents || [];
	const deleteAgentMutation = useDeleteAgent();

	const handleCreateAgent = () => {
		setEditingAgent(null);
		setIsCreateDialogOpen(true);
	};

	const handleEditAgent = (agent: Agent) => {
		setEditingAgent(agent);
		setIsCreateDialogOpen(true);
	};

	const handleDeleteAgent = async (agentId: string) => {
		if (confirm("Are you sure you want to delete this agent?")) {
			try {
				await deleteAgentMutation.mutateAsync(agentId);
			} catch (error) {
				console.error("Failed to delete agent:", error);
			}
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>AI Agents</Heading>
				<p className="text-sm text-gray-600">
					Manage AI agents that combine tools, workflows, and knowledge bases
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="sm:flex-1">
					<div className="mt-4 flex max-w-md gap-2">
						<InputGroup className="w-64">
							<MagnifyingGlassIcon className="size-4" />
							<Input
								name="search"
								placeholder="Search agents..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</InputGroup>
					</div>
				</div>
				<Button onClick={handleCreateAgent}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Create Agent
				</Button>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-2 text-sm text-gray-500">Loading agents...</p>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<p className="text-red-600">Error loading agents: {error.message}</p>
					</div>
				) : agents.length === 0 ? (
					<div className="text-center py-12">
						<CodeBracketSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-semibold text-gray-900">
							No AI agents
						</h3>
						<p className="mt-1 text-sm text-gray-500">
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
					<Table>
						<TableHead>
							<TableRow>
								<TableHeader>Name</TableHeader>
								<TableHeader>Description</TableHeader>
								<TableHeader>Tools</TableHeader>
								<TableHeader>Workflows</TableHeader>
								<TableHeader>Knowledge</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader className="w-[150px]">Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{agents.map((agent) => (
								<TableRow key={agent.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
												<CodeBracketSquareIcon className="h-4 w-4" />
											</div>
											<span className="font-medium">{agent.name}</span>
										</div>
									</TableCell>
									<TableCell>{agent.description}</TableCell>
									<TableCell>{agent.tools_count} tools</TableCell>
									<TableCell>{agent.workflows_count} workflows</TableCell>
									<TableCell>{agent.knowledge_bases_count} docs</TableCell>
									<TableCell>
										<Badge className={getStatusColor("active")}>Active</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditAgent(agent)}>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleDeleteAgent(agent.id)}
												disabled={deleteAgentMutation.isPending}
											>
												<TrashIcon className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>

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
