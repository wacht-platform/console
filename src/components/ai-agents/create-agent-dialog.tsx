import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input, InputGroup } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, FieldGroup, Fieldset, Label } from "../ui/fieldset";
import {
	Dialog,
	DialogActions,
	DialogBody,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import {
	WrenchScrewdriverIcon,
	FireIcon,
	BookOpenIcon,
	MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { toast } from 'sonner';

import type { Agent } from "../../lib/api/hooks/use-agents";
import { useCreateAgent, useUpdateAgent } from "../../lib/api/hooks/use-agents";
import { useTools } from "../../lib/api/hooks/use-tools";
import { useWorkflows } from "../../lib/api/hooks/use-workflows";
import { useKnowledgeBases } from "../../lib/api/hooks/use-knowledge-bases";

interface CreateAgentDialogProps {
	open: boolean;
	onClose: () => void;
	agent?: Agent | null;
}

interface AgentFormData {
	name: string;
	description: string;
	toolIds: string[];
	workflowIds: string[];
	knowledgeBaseIds: string[];
}

interface FormErrors {
	name?: string;
	description?: string;
}

export function CreateAgentDialog({
	open,
	onClose,
	agent,
}: CreateAgentDialogProps) {
	const [formData, setFormData] = useState<AgentFormData>({
		name: "",
		description: "",
		toolIds: [],
		workflowIds: [],
		knowledgeBaseIds: [],
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Search states
	const [toolsSearch, setToolsSearch] = useState("");
	const [workflowsSearch, setWorkflowsSearch] = useState("");
	const [knowledgeBasesSearch, setKnowledgeBasesSearch] = useState("");

	const isEditing = !!agent;

	// API hooks
	const createAgentMutation = useCreateAgent();
	const updateAgentMutation = useUpdateAgent();

	// Fetch available resources
	const { data: toolsData } = useTools({ limit: 100 });
	const { data: workflowsData } = useWorkflows({ limit: 100 });
	const { data: knowledgeBasesData } = useKnowledgeBases({ limit: 100 });

	const tools = toolsData?.tools || [];
	const workflows = workflowsData?.workflows || [];
	const knowledgeBases = knowledgeBasesData?.data || [];

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (open) {
			if (agent) {
				setFormData({
					name: agent.name,
					description: agent.description || "",
					toolIds: (agent.configuration?.tool_ids as string[]) || [],
					workflowIds: (agent.configuration?.workflow_ids as string[]) || [],
					knowledgeBaseIds: (agent.configuration?.knowledge_base_ids as string[]) || [],
				});
			} else {
				setFormData({
					name: "",
					description: "",
					toolIds: [],
					workflowIds: [],
					knowledgeBaseIds: [],
				});
			}
			setErrors({});
			setIsSubmitting(false);
		}
	}, [open, agent]);

	// Validation function
	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = "Agent name is required";
		} else if (formData.name.length < 2) {
			newErrors.name = "Agent name must be at least 2 characters";
		} else if (formData.name.length > 100) {
			newErrors.name = "Agent name must be less than 100 characters";
		}

		if (formData.description && formData.description.length > 500) {
			newErrors.description = "Description must be less than 500 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const agentData = {
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				configuration: {
					tool_ids: formData.toolIds,
					workflow_ids: formData.workflowIds,
					knowledge_base_ids: formData.knowledgeBaseIds,
				},
			};

			if (isEditing && agent) {
				await updateAgentMutation.mutateAsync({
					agentId: agent.id,
					agent: agentData,
				});
				toast.success("Agent updated successfully");
			} else {
				await createAgentMutation.mutateAsync(agentData);
				toast.success("Agent created successfully");
			}

			onClose();
		} catch (error) {
			console.error("Failed to save agent:", error);
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
			toast.error(isEditing ? `Failed to update agent: ${errorMessage}` : `Failed to create agent: ${errorMessage}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		// Reset search states
		setToolsSearch("");
		setWorkflowsSearch("");
		setKnowledgeBasesSearch("");
		onClose();
	};

	const toggleSelection = (id: string, type: 'tools' | 'workflows' | 'knowledgeBases') => {
		const fieldName = type === 'tools' ? 'toolIds' : type === 'workflows' ? 'workflowIds' : 'knowledgeBaseIds';
		const currentIds = formData[fieldName];
		const newIds = currentIds.includes(id)
			? currentIds.filter(existingId => existingId !== id)
			: [...currentIds, id];

		setFormData({ ...formData, [fieldName]: newIds });
	};

	// Filter functions
	const filteredTools = tools.filter(tool =>
		toolsSearch === "" ||
		tool.name.toLowerCase().includes(toolsSearch.toLowerCase()) ||
		tool.tool_type.toLowerCase().includes(toolsSearch.toLowerCase())
	);

	const filteredWorkflows = workflows.filter(workflow =>
		workflowsSearch === "" ||
		workflow.name.toLowerCase().includes(workflowsSearch.toLowerCase()) ||
		(workflow.description && workflow.description.toLowerCase().includes(workflowsSearch.toLowerCase()))
	);

	const filteredKnowledgeBases = knowledgeBases.filter(kb =>
		knowledgeBasesSearch === "" ||
		kb.name.toLowerCase().includes(knowledgeBasesSearch.toLowerCase())
	);

	return (
		<Dialog open={open} onClose={onClose} size="4xl">
			<DialogTitle>{isEditing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the agent configuration and relationships."
					: "Create a new AI agent by configuring its properties and selecting tools, workflows, and knowledge bases."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody className="space-y-6">
					{/* Basic Information */}
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
									invalid={!!errors.name}
								/>
								{errors.name && (
									<p className="text-sm text-red-600 mt-1">{errors.name}</p>
								)}
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe what this agent does"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									rows={3}
									invalid={!!errors.description}
								/>
								{errors.description && (
									<p className="text-sm text-red-600 mt-1">{errors.description}</p>
								)}
								<p className="text-sm text-zinc-500 mt-1">
									{formData.description.length}/500 characters
								</p>
							</Field>
						</FieldGroup>
					</Fieldset>



					{/* Tools Selection */}
					<Fieldset>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<WrenchScrewdriverIcon className="h-5 w-5 text-indigo-600" />
								<span className="text-sm text-zinc-900">Tools ({formData.toolIds.length} selected)</span>
							</div>
							<InputGroup className="w-64">
								<MagnifyingGlassIcon className="size-4" />
								<Input
									placeholder="Search tools..."
									value={toolsSearch}
									onChange={(e) => setToolsSearch(e.target.value)}
								/>
							</InputGroup>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
							{filteredTools.map((tool) => (
								<div
									key={tool.id}
									className={`p-3 border rounded-lg cursor-pointer transition-colors ${
										formData.toolIds.includes(tool.id)
											? 'border-indigo-300 bg-indigo-50'
											: 'border-zinc-200 hover:border-indigo-200 hover:bg-indigo-50/30'
									}`}
									onClick={() => toggleSelection(tool.id, 'tools')}
								>
									<div className="flex items-center gap-2">
										<div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100 text-indigo-600">
											<WrenchScrewdriverIcon className="h-3 w-3" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-zinc-900 truncate">{tool.name}</p>
											<p className="text-xs text-zinc-500 truncate">{tool.tool_type}</p>
										</div>
										{formData.toolIds.includes(tool.id) && (
											<Badge color="indigo" className="text-xs">Selected</Badge>
										)}
									</div>
								</div>
							))}
							{filteredTools.length === 0 && (
								<div className="col-span-full text-center py-8 text-zinc-500">
									<WrenchScrewdriverIcon className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
									<p className="text-sm">
										{toolsSearch ? "No tools match your search" : "No tools available"}
									</p>
								</div>
							)}
						</div>
					</Fieldset>

					{/* Workflows Selection */}
					<Fieldset>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<FireIcon className="h-5 w-5 text-orange-600" />
								<span className="text-sm text-zinc-900">Workflows ({formData.workflowIds.length} selected)</span>
							</div>
							<InputGroup className="w-64">
								<MagnifyingGlassIcon className="size-4" />
								<Input
									placeholder="Search workflows..."
									value={workflowsSearch}
									onChange={(e) => setWorkflowsSearch(e.target.value)}
								/>
							</InputGroup>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
							{filteredWorkflows.map((workflow) => (
								<div
									key={workflow.id}
									className={`p-3 border rounded-lg cursor-pointer transition-colors ${
										formData.workflowIds.includes(workflow.id)
											? 'border-orange-300 bg-orange-50'
											: 'border-zinc-200 hover:border-orange-200 hover:bg-orange-50/30'
									}`}
									onClick={() => toggleSelection(workflow.id, 'workflows')}
								>
									<div className="flex items-center gap-2">
										<div className="flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-orange-600">
											<FireIcon className="h-3 w-3" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-zinc-900 truncate">{workflow.name}</p>
											<p className="text-xs text-zinc-500 truncate">{workflow.description || 'No description'}</p>
										</div>
										{formData.workflowIds.includes(workflow.id) && (
											<Badge color="orange" className="text-xs">Selected</Badge>
										)}
									</div>
								</div>
							))}
							{filteredWorkflows.length === 0 && (
								<div className="col-span-full text-center py-8 text-zinc-500">
									<FireIcon className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
									<p className="text-sm">
										{workflowsSearch ? "No workflows match your search" : "No workflows available"}
									</p>
								</div>
							)}
						</div>
					</Fieldset>

					{/* Knowledge Bases Selection */}
					<Fieldset>
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<BookOpenIcon className="h-5 w-5 text-emerald-600" />
								<span className="text-sm text-zinc-900">Knowledge Bases ({formData.knowledgeBaseIds.length} selected)</span>
							</div>
							<InputGroup className="w-64">
								<MagnifyingGlassIcon className="size-4" />
								<Input
									placeholder="Search knowledge bases..."
									value={knowledgeBasesSearch}
									onChange={(e) => setKnowledgeBasesSearch(e.target.value)}
								/>
							</InputGroup>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
							{filteredKnowledgeBases.map((kb) => (
								<div
									key={kb.id}
									className={`p-3 border rounded-lg cursor-pointer transition-colors ${
										formData.knowledgeBaseIds.includes(kb.id)
											? 'border-emerald-300 bg-emerald-50'
											: 'border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50/30'
									}`}
									onClick={() => toggleSelection(kb.id, 'knowledgeBases')}
								>
									<div className="flex items-center gap-2">
										<div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-emerald-600">
											<BookOpenIcon className="h-3 w-3" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-zinc-900 truncate">{kb.name}</p>
											<p className="text-xs text-zinc-500 truncate">{kb.documents_count} documents</p>
										</div>
										{formData.knowledgeBaseIds.includes(kb.id) && (
											<Badge color="emerald" className="text-xs">Selected</Badge>
										)}
									</div>
								</div>
							))}
							{filteredKnowledgeBases.length === 0 && (
								<div className="col-span-full text-center py-8 text-zinc-500">
									<BookOpenIcon className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
									<p className="text-sm">
										{knowledgeBasesSearch ? "No knowledge bases match your search" : "No knowledge bases available"}
									</p>
								</div>
							)}
						</div>
					</Fieldset>


				</DialogBody>

				<DialogActions>
					<Button outline onClick={handleCancel} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || !formData.name.trim()}
					>
						{isSubmitting
							? (isEditing ? "Updating..." : "Creating...")
							: (isEditing ? "Update Agent" : "Create Agent")
						}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
