import { useState } from "react";
import {
	PlusIcon,
	CodeBracketSquareIcon,
	MagnifyingGlassIcon,
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

interface Agent {
	id: string;
	name: string;
	description: string;
	status: "active" | "inactive" | "draft";
	lastModified: string;
	toolsCount: number;
	workflowsCount: number;
	knowledgeBasesCount: number;
}

const agents: Agent[] = [];

export default function CreateAgentsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

	const handleCreateAgent = () => {
		setIsCreateDialogOpen(true);
	};

	const handleEditAgent = (agent: Agent) => {
		setEditingAgent(agent);
		setIsCreateDialogOpen(true);
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
							<Input name="search" placeholder="Search agents..." />
						</InputGroup>
					</div>
				</div>
				<Button onClick={handleCreateAgent}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Create Agent
				</Button>
			</div>

			<div className="mt-6">
				{agents.length === 0 ? (
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
									<TableCell>{agent.toolsCount} tools</TableCell>
									<TableCell>{agent.workflowsCount} workflows</TableCell>
									<TableCell>{agent.knowledgeBasesCount} docs</TableCell>
									<TableCell>
										<Badge>{agent.status}</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditAgent(agent)}>
												Edit
											</Button>
											<Button outline className="text-red-600 hover:bg-red-50">
												Delete
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
