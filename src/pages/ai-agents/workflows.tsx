import { useState } from "react";
import { useNavigate } from "react-router";
import {
	FireIcon,
	PlusIcon,
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
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { useWorkflows, useDeleteWorkflow } from "../../lib/api/hooks/use-workflows";


export default function WorkflowsPage() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [workflowToDelete, setWorkflowToDelete] = useState<any>(null);

	// API hooks
	const { data, isLoading, error } = useWorkflows({
		search: searchTerm || undefined,
	});
	const workflows = data?.workflows || [];
	const deleteWorkflowMutation = useDeleteWorkflow();

	const handleCreateWorkflow = () => {
		navigate("./create-workflow");
	};

	const handleEditWorkflow = (workflowId: string) => {
		navigate(`./edit/${workflowId}`);
	};

	const handleDeleteWorkflow = (workflow: any) => {
		setWorkflowToDelete(workflow);
		setConfirmDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (workflowToDelete) {
			try {
				await deleteWorkflowMutation.mutateAsync(workflowToDelete.id);
				setConfirmDeleteOpen(false);
				setWorkflowToDelete(null);
			} catch (error) {
				console.error("Failed to delete workflow:", error);
			}
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>AI Workflows</Heading>
				<p className="text-sm text-gray-600">
					Create and manage automated workflows that combine AI agents, tools, and logic
				</p>
			</div>

			{!isLoading && !error && workflows.length > 0 && (
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
			)}

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
										<div className="flex gap-2">
											<Button
												outline
												onClick={() => handleEditWorkflow(workflow.id)}
												title="Edit workflow"
											>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleDeleteWorkflow(workflow)}
												disabled={deleteWorkflowMutation.isPending}
												title="Delete workflow"
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
			
			<ConfirmationDialog
				isOpen={confirmDeleteOpen}
				onClose={() => {
					setConfirmDeleteOpen(false);
					setWorkflowToDelete(null);
				}}
				onConfirm={handleConfirmDelete}
				title="Delete Workflow"
				message={workflowToDelete ? `Are you sure you want to delete the workflow "${workflowToDelete.name}"? This action cannot be undone.` : ''}
				confirmText="Delete"
				isDestructive={true}
				isLoading={deleteWorkflowMutation.isPending}
			/>
		</div>
	);
}
