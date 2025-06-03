import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Field, FieldGroup, Fieldset, Label } from "../ui/fieldset";
import {
	Dialog,
	DialogActions,
	DialogBody,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";

interface Workflow {
	id: string;
	name: string;
	description: string;
	status: "active" | "inactive" | "draft";
	agentsCount: number;
	lastRun: string;
}

interface CreateWorkflowDialogProps {
	open: boolean;
	onClose: () => void;
	workflow?: Workflow | null;
}

interface WorkflowFormData {
	name: string;
	description: string;
	status: "active" | "inactive" | "draft";
	configuration: Record<string, unknown>; // Workflow definition (nodes, edges, etc.)
}

export function CreateWorkflowDialog({
	open,
	onClose,
	workflow,
}: CreateWorkflowDialogProps) {
	const navigate = useNavigate();
	const [formData, setFormData] = useState<WorkflowFormData>({
		name: "",
		description: "",
		status: "draft",
		configuration: {},
	});

	const isEditing = !!workflow;

	useEffect(() => {
		if (workflow) {
			setFormData({
				name: workflow.name,
				description: workflow.description,
				status: workflow.status,
				configuration: {}, // TODO: Load actual workflow configuration
			});
		} else {
			setFormData({
				name: "",
				description: "",
				status: "draft",
				configuration: {},
			});
		}
	}, [workflow]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement workflow creation/update logic
		console.log(
			isEditing ? "Updating workflow:" : "Creating workflow:",
			formData,
		);
		onClose();
	};

	const handleOpenWorkflowBuilder = () => {
		// Navigate to the workflow creation page with drag-and-drop builder
		navigate("./create-workflow");
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} size="2xl">
			<DialogTitle>
				{isEditing ? "Edit Workflow" : "Create New Workflow"}
			</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the workflow configuration and settings."
					: "Create a new AI workflow by configuring its properties. You can design the workflow logic after creation."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody>
					<Fieldset>
						<FieldGroup className="space-y-4">
							<Field>
								<Label>Workflow Name</Label>
								<Input
									required
									placeholder="Enter workflow name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe what this workflow does"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Status</Label>
								<Select
									value={formData.status}
									onChange={(e) =>
										setFormData({
											...formData,
											status: e.target.value as WorkflowFormData["status"],
										})
									}
								>
									<option value="draft">Draft</option>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</Select>
							</Field>

							{isEditing && (
								<Field>
									<Label>Workflow Design</Label>
									<div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
										<p className="text-sm text-gray-600 mb-3">
											Use the workflow builder to design the workflow logic with
											nodes and connections.
										</p>
										<Button
											type="button"
											outline
											onClick={handleOpenWorkflowBuilder}
										>
											Open Workflow Builder
										</Button>
									</div>
								</Field>
							)}
						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">
						{isEditing ? "Update Workflow" : "Create Workflow"}
					</Button>
					{!isEditing && (
						<Button
							type="button"
							onClick={handleOpenWorkflowBuilder}
							className="ml-2"
						>
							Create & Design
						</Button>
					)}
				</DialogActions>
			</form>
		</Dialog>
	);
}
