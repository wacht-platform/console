import { useState } from "react";
import { useNavigate } from "react-router";
import {
	FireIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { InlineLoader } from "../../components/ui/loading-screen";
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
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-normal tracking-tight">Workflows</h1>
					<p className="text-sm text-muted-foreground">
						Create and manage automated workflows that combine AI agents, tools, and logic
					</p>
				</div>
				{!isLoading && !error && (
					<Button onClick={handleCreateWorkflow}>
						Create Workflow
					</Button>
				)}
			</div>

			{!isLoading && !error && workflows.length > 0 && (
				<div className="relative mb-6">
					<MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search workflows..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
			)}

			{isLoading ? (
				<InlineLoader />
			) : error ? (
				<div className="text-center py-12">
					<p className="text-destructive">Failed to load workflows</p>
				</div>
			) : workflows.length === 0 ? (
				<div className="text-center py-12">
					<FireIcon className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-2 text-sm font-normal">
						No workflows
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Get started by creating your first AI workflow.
					</p>
					<div className="mt-6">
						<Button onClick={handleCreateWorkflow}>
							Create Workflow
						</Button>
					</div>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="w-[200px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{workflows.map((workflow) => (
							<TableRow key={workflow.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<FireIcon className="h-4 w-4" />
										</div>
										<span className="font-medium">{workflow.name}</span>
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground">{workflow.description || "No description"}</TableCell>
								<TableCell>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleEditWorkflow(workflow.id)}
											title="Edit workflow"
										>
											<PencilIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
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
