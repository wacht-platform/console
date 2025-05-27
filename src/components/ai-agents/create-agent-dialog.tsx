import { useState, useEffect } from "react";
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

interface CreateAgentDialogProps {
	open: boolean;
	onClose: () => void;
	agent?: Agent | null;
}

interface AgentFormData {
	name: string;
	description: string;
	status: "active" | "inactive" | "draft";
	toolIds: string[];
	workflowIds: string[];
	knowledgeBaseIds: string[];
}

export function CreateAgentDialog({
	open,
	onClose,
	agent,
}: CreateAgentDialogProps) {
	const [formData, setFormData] = useState<AgentFormData>({
		name: "",
		description: "",
		status: "draft",
		toolIds: [],
		workflowIds: [],
		knowledgeBaseIds: [],
	});

	const isEditing = !!agent;

	useEffect(() => {
		if (agent) {
			setFormData({
				name: agent.name,
				description: agent.description,
				status: agent.status,
				toolIds: [], // TODO: Load actual relationships
				workflowIds: [],
				knowledgeBaseIds: [],
			});
		} else {
			setFormData({
				name: "",
				description: "",
				status: "draft",
				toolIds: [],
				workflowIds: [],
				knowledgeBaseIds: [],
			});
		}
	}, [agent]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement agent creation/update logic
		console.log(isEditing ? "Updating agent:" : "Creating agent:", formData);
		onClose();
	};

	const handleCancel = () => {
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} size="2xl">
			<DialogTitle>{isEditing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the agent configuration and relationships."
					: "Create a new AI agent by configuring its properties and selecting tools, workflows, and knowledge bases."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody>
					<Fieldset>
						<FieldGroup className="space-y-4">
							<Field>
								<Label>Agent Name</Label>
								<Input
									required
									placeholder="Enter agent name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe what this agent does"
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
											status: e.target.value as AgentFormData["status"],
										})
									}
								>
									<option value="draft">Draft</option>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</Select>
							</Field>

							<Field>
								<Label>Tools</Label>
								<Select
									multiple
									value={formData.toolIds}
									onChange={(e) => {
										const values = Array.from(
											e.target.selectedOptions,
											(option) => option.value,
										);
										setFormData({ ...formData, toolIds: values });
									}}
								>
									{/* TODO: Load actual tools from API */}
								</Select>
							</Field>

							<Field>
								<Label>Workflows</Label>
								<Select
									multiple
									value={formData.workflowIds}
									onChange={(e) => {
										const values = Array.from(
											e.target.selectedOptions,
											(option) => option.value,
										);
										setFormData({ ...formData, workflowIds: values });
									}}
								>
									{/* TODO: Load actual workflows from API */}
								</Select>
							</Field>

							<Field>
								<Label>Knowledge Bases</Label>
								<Select
									multiple
									value={formData.knowledgeBaseIds}
									onChange={(e) => {
										const values = Array.from(
											e.target.selectedOptions,
											(option) => option.value,
										);
										setFormData({ ...formData, knowledgeBaseIds: values });
									}}
								>
									{/* TODO: Load actual knowledge bases from API */}
								</Select>
							</Field>
						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={handleCancel}>
						Cancel
					</Button>
					<Button type="submit">
						{isEditing ? "Update Agent" : "Create Agent"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
