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

interface Tool {
	id: string;
	name: string;
	description: string;
	type: "api" | "function" | "database" | "external";
	status: "active" | "inactive" | "draft";
	lastModified: string;
	usageCount: number;
}

interface CreateToolDialogProps {
	open: boolean;
	onClose: () => void;
	tool?: Tool | null;
}

interface ToolFormData {
	name: string;
	description: string;
	type: "api" | "function" | "database" | "external";
	configuration: {
		endpoint?: string;
		method?: string;
		headers?: Record<string, string>;
		parameters?: Array<{
			name: string;
			type: string;
			required: boolean;
			description: string;
		}>;
		code?: string;
		query?: string;
	};
}

export function CreateToolDialog({
	open,
	onClose,
	tool,
}: CreateToolDialogProps) {
	const [formData, setFormData] = useState<ToolFormData>({
		name: "",
		description: "",
		type: "api",
		configuration: {},
	});

	const isEditing = !!tool;

	useEffect(() => {
		if (tool) {
			setFormData({
				name: tool.name,
				description: tool.description,
				type: tool.type,
				configuration: {}, // TODO: Load actual configuration
			});
		} else {
			setFormData({
				name: "",
				description: "",
				type: "api",
				configuration: {},
			});
		}
	}, [tool]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement tool creation/update logic
		console.log(isEditing ? "Updating tool:" : "Creating tool:", formData);
		onClose();
	};

	const renderConfigurationFields = () => {
		switch (formData.type) {
			case "api":
				return (
					<div className="space-y-4">
						<Field>
							<Label>API Endpoint</Label>
							<Input
								placeholder="https://api.example.com/endpoint"
								value={formData.configuration.endpoint || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...formData.configuration,
											endpoint: e.target.value,
										},
									})
								}
							/>
						</Field>
						<Field>
							<Label>HTTP Method</Label>
							<Select
								value={formData.configuration.method || "GET"}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...formData.configuration,
											method: e.target.value,
										},
									})
								}
							>
								<option value="GET">GET</option>
								<option value="POST">POST</option>
								<option value="PUT">PUT</option>
								<option value="DELETE">DELETE</option>
								<option value="PATCH">PATCH</option>
							</Select>
						</Field>
					</div>
				);
			case "function":
				return (
					<Field>
						<Label>Function Code</Label>
						<Textarea
							rows={8}
							placeholder="// Write your function code here
function myTool(input) {
  // Your logic here
  return result;
}"
							value={formData.configuration.code || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									configuration: {
										...formData.configuration,
										code: e.target.value,
									},
								})
							}
						/>
					</Field>
				);
			case "database":
				return (
					<Field>
						<Label>SQL Query Template</Label>
						<Textarea
							rows={4}
							placeholder="SELECT * FROM users WHERE id = {{user_id}}"
							value={formData.configuration.query || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									configuration: {
										...formData.configuration,
										query: e.target.value,
									},
								})
							}
						/>
					</Field>
				);
			case "external":
				return (
					<Field>
						<Label>External Service Configuration</Label>
						<Textarea
							rows={4}
							placeholder="Configure external service connection details..."
							value={formData.configuration.endpoint || ""}
							onChange={(e) =>
								setFormData({
									...formData,
									configuration: {
										...formData.configuration,
										endpoint: e.target.value,
									},
								})
							}
						/>
					</Field>
				);
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onClose={onClose} size="2xl">
			<DialogTitle>{isEditing ? "Edit Tool" : "Create New Tool"}</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the tool configuration and settings."
					: "Create a new tool that can be used by AI agents and workflows."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody>
					<Fieldset>
						<FieldGroup className="space-y-4">
							<Field>
								<Label>Tool Name</Label>
								<Input
									required
									placeholder="Enter tool name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe what this tool does"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Tool Type</Label>
								<Select
									value={formData.type}
									onChange={(e) =>
										setFormData({
											...formData,
											type: e.target.value as ToolFormData["type"],
											configuration: {}, // Reset configuration when type changes
										})
									}
								>
									<option value="api">API Call</option>
									<option value="function">Custom Function</option>
									<option value="database">Database Query</option>
									<option value="external">External Service</option>
								</Select>
							</Field>

							{renderConfigurationFields()}
						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">
						{isEditing ? "Update Tool" : "Create Tool"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
