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
import { CreateAgentDialog } from "../../components/ai-agents/create-agent-dialog";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { Spinner } from "../../components/ui/spinner";
import { useAgents, useDeleteAgent, type Agent } from "../../lib/api/hooks/use-agents";



export default function CreateAgentsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

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

	const handleDeleteAgent = (agent: Agent) => {
		setAgentToDelete(agent);
		setConfirmDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (agentToDelete) {
			try {
				await deleteAgentMutation.mutateAsync(agentToDelete.id);
				setConfirmDeleteOpen(false);
				setAgentToDelete(null);
			} catch (error) {
				console.error("Failed to delete agent:", error);
			}
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>AI Agents</Heading>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Manage AI agents that combine tools, workflows, and knowledge bases
				</p>
			</div>

			{!isLoading && !error && agents.length > 0 && (
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
			)}

			<div className="mt-6">
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
					<Table>
						<TableHead>
							<TableRow>
								<TableHeader>Name</TableHeader>
								<TableHeader>Description</TableHeader>
								<TableHeader>Tools</TableHeader>
								<TableHeader>Workflows</TableHeader>
								<TableHeader>Knowledge</TableHeader>
								<TableHeader className="w-[150px]">Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{agents.map((agent) => (
								<TableRow key={agent.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
												<CodeBracketSquareIcon className="h-4 w-4" />
											</div>
											<span className="font-medium text-gray-900 dark:text-gray-100">{agent.name}</span>
										</div>
									</TableCell>
									<TableCell className="text-gray-700 dark:text-gray-300">{agent.description}</TableCell>
									<TableCell className="text-gray-700 dark:text-gray-300">{agent.tools_count} tools</TableCell>
									<TableCell className="text-gray-700 dark:text-gray-300">{agent.workflows_count} workflows</TableCell>
									<TableCell className="text-gray-700 dark:text-gray-300">{agent.knowledge_bases_count} docs</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditAgent(agent)}>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
												onClick={() => handleDeleteAgent(agent)}
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
			
			<ConfirmationDialog
				isOpen={confirmDeleteOpen}
				onClose={() => {
					setConfirmDeleteOpen(false);
					setAgentToDelete(null);
				}}
				onConfirm={handleConfirmDelete}
				title="Delete Agent"
				message={agentToDelete ? `Are you sure you want to delete the agent "${agentToDelete.name}"? This action cannot be undone.` : ''}
				confirmText="Delete"
				isDestructive={true}
				isLoading={deleteAgentMutation.isPending}
			/>
		</div>
	);
}
