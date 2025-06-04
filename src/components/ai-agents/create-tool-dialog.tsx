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
import type {
	AiTool,
	AiToolType,
	ToolFormData,
	ApiToolConfiguration,
	KnowledgeBaseToolConfiguration,
	HttpMethod,
} from "../../types/ai-tool";
import type { DeploymentJWTTemplate } from "../../types/deployment";

interface CreateToolDialogProps {
	open: boolean;
	onClose: () => void;
	tool?: AiTool | null;
	jwtTemplates?: DeploymentJWTTemplate[];
}

export function CreateToolDialog({
	open,
	onClose,
	tool,
	jwtTemplates = [],
}: CreateToolDialogProps) {
	const [formData, setFormData] = useState<ToolFormData>({
		name: "",
		description: "",
		type: "api",
		configuration: {
			type: "Api",
			endpoint: "",
			method: "GET",
			headers: [],
			query_parameters: [],
			body_parameters: [],
		} as ApiToolConfiguration,
	});

	const isEditing = !!tool;

	useEffect(() => {
		if (tool) {
			setFormData({
				name: tool.name,
				description: tool.description || "",
				type: tool.tool_type,
				configuration: tool.configuration,
			});
		} else {
			setFormData({
				name: "",
				description: "",
				type: "api",
				configuration: {
					type: "Api",
					endpoint: "",
					method: "GET",
					headers: [],
					query_parameters: [],
					body_parameters: [],
				} as ApiToolConfiguration,
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
				const apiConfig = formData.configuration as ApiToolConfiguration;
				return (
					<div className="space-y-4">
						<Field>
							<Label>API Endpoint</Label>
							<Input
								placeholder="https://api.example.com/endpoint"
								value={apiConfig.endpoint}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...apiConfig,
											endpoint: e.target.value,
										},
									})
								}
							/>
						</Field>
						<Field>
							<Label>HTTP Method</Label>
							<Select
								value={apiConfig.method}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...apiConfig,
											method: e.target.value as HttpMethod,
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

						{/* Authorization Section */}
						<Field>
							<Label>Authorization</Label>
							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={apiConfig.authorization?.authorize_as_user || false}
										onChange={(e) =>
											setFormData({
												...formData,
												configuration: {
													...apiConfig,
													authorization: {
														...apiConfig.authorization,
														authorize_as_user: e.target.checked,
														jwt_template_id: apiConfig.authorization?.jwt_template_id,
														custom_headers: apiConfig.authorization?.custom_headers || [],
													},
												},
											})
										}
									/>
									<span>Authorize as user</span>
								</label>

								{apiConfig.authorization?.authorize_as_user && (
									<Field>
										<Label>JWT Template</Label>
										<Select
											value={apiConfig.authorization?.jwt_template_id || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													configuration: {
														...apiConfig,
														authorization: {
															...apiConfig.authorization!,
															jwt_template_id: e.target.value || undefined,
														},
													},
												})
											}
										>
											<option value="">Select JWT Template</option>
											{jwtTemplates.map((template) => (
												<option key={template.id} value={template.id}>
													{template.name}
												</option>
											))}
										</Select>
									</Field>
								)}
							</div>
						</Field>
					</div>
				);
			case "knowledge_base":
				const kbConfig = formData.configuration as KnowledgeBaseToolConfiguration;
				return (
					<div className="space-y-4">
						<Field>
							<Label>Knowledge Base ID</Label>
							<Input
								placeholder="Enter knowledge base ID"
								value={kbConfig.knowledge_base_id}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...kbConfig,
											knowledge_base_id: e.target.value,
										},
									})
								}
							/>
						</Field>
						<Field>
							<Label>Max Results</Label>
							<Input
								type="number"
								placeholder="10"
								value={kbConfig.search_settings.max_results || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...kbConfig,
											search_settings: {
												...kbConfig.search_settings,
												max_results: e.target.value ? parseInt(e.target.value) : undefined,
											},
										},
									})
								}
							/>
						</Field>
						<Field>
							<Label>Similarity Threshold</Label>
							<Input
								type="number"
								step="0.1"
								min="0"
								max="1"
								placeholder="0.7"
								value={kbConfig.search_settings.similarity_threshold || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										configuration: {
											...kbConfig,
											search_settings: {
												...kbConfig.search_settings,
												similarity_threshold: e.target.value ? parseFloat(e.target.value) : undefined,
											},
										},
									})
								}
							/>
						</Field>
						<Field>
							<label className="flex items-center space-x-2">
								<input
									type="checkbox"
									checked={kbConfig.search_settings.include_metadata}
									onChange={(e) =>
										setFormData({
											...formData,
											configuration: {
												...kbConfig,
												search_settings: {
													...kbConfig.search_settings,
													include_metadata: e.target.checked,
												},
											},
										})
									}
								/>
								<span>Include metadata in results</span>
							</label>
						</Field>
					</div>
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
									onChange={(e) => {
										const newType = e.target.value as AiToolType;
										const newConfiguration = newType === "api"
											? {
												type: "Api" as const,
												endpoint: "",
												method: "GET" as HttpMethod,
												headers: [],
												query_parameters: [],
												body_parameters: [],
											} as ApiToolConfiguration
											: {
												type: "KnowledgeBase" as const,
												knowledge_base_id: "",
												search_settings: {
													max_results: 10,
													similarity_threshold: 0.7,
													include_metadata: true,
												},
											} as KnowledgeBaseToolConfiguration;

										setFormData({
											...formData,
											type: newType,
											configuration: newConfiguration,
										});
									}}
								>
									<option value="api">API Call</option>
									<option value="knowledge_base">Knowledge Base Search</option>
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
