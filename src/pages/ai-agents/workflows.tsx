import { useState } from "react";
import { useNavigate } from "react-router";
import {
	FireIcon,
	PlusIcon,
	MagnifyingGlassIcon,
	PlayIcon,
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
import { useWorkflows, useDeleteWorkflow, useExecuteWorkflow } from "../../lib/api/hooks/use-workflows";




export default function WorkflowsPage() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");

	// API hooks
	const { data, isLoading, error } = useWorkflows({
		search: searchTerm || undefined,
	});
	const workflows = data?.workflows || [];
	const deleteWorkflowMutation = useDeleteWorkflow();
	const executeWorkflowMutation = useExecuteWorkflow();

	const handleCreateWorkflow = () => {
		navigate("./create-workflow");
	};

	const handleEditWorkflow = (workflowId: string) => {
		navigate(`./edit/${workflowId}`);
	};

	const handleDeleteWorkflow = async (workflowId: string) => {
		if (confirm("Are you sure you want to delete this workflow?")) {
			try {
				await deleteWorkflowMutation.mutateAsync(workflowId);
			} catch (error) {
				console.error("Failed to delete workflow:", error);
			}
		}
	};

	const handleExecuteWorkflow = async (workflowId: string) => {
		try {
			await executeWorkflowMutation.mutateAsync({
				workflowId,
				request: { trigger_data: {} },
			});
		} catch (error) {
			console.error("Failed to execute workflow:", error);
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>AI Workflows</Heading>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="sm:flex-1">
					<div className="mt-4 flex max-w-md gap-2">
						<InputGroup className="w-64">
							<MagnifyingGlassIcon className="size-4" />
							<Input
								name="search"
								placeholder="Search workflows..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</InputGroup>
					</div>
				</div>
				<Button onClick={handleCreateWorkflow}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Create Workflow
				</Button>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<div className="text-center py-12">
						<div className="text-sm text-gray-500">Loading workflows...</div>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<div className="text-sm text-red-500">Failed to load workflows</div>
					</div>
				) : workflows.length === 0 ? (
					<div className="text-center py-12">
						<FireIcon className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-semibold text-gray-900">
							No workflows
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							Get started by creating your first AI workflow.
						</p>
						<div className="mt-6">
							<Button onClick={handleCreateWorkflow}>
								<PlusIcon className="mr-2 h-4 w-4" />
								Create Workflow
							</Button>
						</div>
					</div>
				) : (
					<Table>
						<TableHead>
							<TableRow>
								<TableHeader>Name</TableHeader>
								<TableHeader>Description</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader>Executions</TableHeader>
								<TableHeader className="w-[200px]">Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{workflows.map((workflow) => (
								<TableRow key={workflow.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
												<FireIcon className="h-4 w-4" />
											</div>
											<span className="font-medium">{workflow.name}</span>
										</div>
									</TableCell>
									<TableCell>{workflow.description || "No description"}</TableCell>
									<TableCell>
										<Badge className="bg-blue-100 text-blue-800">
											Active
										</Badge>
									</TableCell>
									<TableCell>{workflow.executions_count} executions</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button
												outline

												onClick={() => handleExecuteWorkflow(workflow.id)}
												disabled={executeWorkflowMutation.isPending}
											>
												<PlayIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												onClick={() => handleEditWorkflow(workflow.id)}
											>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleDeleteWorkflow(workflow.id)}
												disabled={deleteWorkflowMutation.isPending}
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

		</div>
	);
}
