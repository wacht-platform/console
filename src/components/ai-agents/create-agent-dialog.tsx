import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, Label } from "../ui/fieldset";
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
	XMarkIcon,
	PlusIcon,
	ChevronUpIcon,
	InformationCircleIcon
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
	integrationIds: string[];
	quickQuestions: string[];
}

interface FormErrors {
	name?: string;
	description?: string;
}

function CollapsibleSection({
	title,
	children,
	isOpen,
	onToggle,
	badgeCount = 0,
	icon: Icon
}: {
	title: string;
	children: React.ReactNode;
	isOpen: boolean;
	onToggle: () => void;
	badgeCount?: number;
	icon?: React.ElementType;
}) {
	return (
		<div className="border-b border-zinc-300 dark:border-zinc-600 last:border-b-0">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
			>
				<div className="flex items-center gap-2">
					{Icon && <Icon className={`h-4 w-4 ${isOpen ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`} />}
					<span>{title}</span>
					{badgeCount > 0 && (
						<Badge className="ml-1" color="zinc">{badgeCount}</Badge>
					)}
				</div>
				<ChevronUpIcon
					className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
				/>
			</button>

			{isOpen && (
				<div className="pb-4 animate-in slide-in-from-top-1 duration-150">
					{children}
				</div>
			)}
		</div>
	);
}

export function CreateAgentDialog({
	open,
	onClose,
	agent,
}: CreateAgentDialogProps) {
	const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));

	const [formData, setFormData] = useState<AgentFormData>({
		name: "",
		description: "",
		toolIds: [],
		workflowIds: [],
		knowledgeBaseIds: [],
		integrationIds: [],
		quickQuestions: [],
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newQuestion, setNewQuestion] = useState("");

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
			setOpenSections(new Set(['basic']));
			if (agent) {
				setFormData({
					name: agent.name,
					description: agent.description || "",
					toolIds: (agent.configuration?.tool_ids as string[]) || [],
					workflowIds: (agent.configuration?.workflow_ids as string[]) || [],
					knowledgeBaseIds: (agent.configuration?.knowledge_base_ids as string[]) || [],
					integrationIds: (agent.configuration?.integration_ids as string[]) || [],
					quickQuestions: (agent.configuration?.quick_questions as string[]) || [],
				});
			} else {
				setFormData({
					name: "",
					description: "",
					toolIds: [],
					workflowIds: [],
					knowledgeBaseIds: [],
					integrationIds: [],
					quickQuestions: [],
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

		if (formData.description && formData.description.length > 2000) {
			newErrors.description = "Description must be less than 2000 characters";
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
					integration_ids: formData.integrationIds,
					quick_questions: formData.quickQuestions,
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
		onClose();
	};

	const toggleSelection = (id: string, type: 'tools' | 'workflows' | 'knowledgeBases' | 'integrations') => {
		const fieldMap = {
			tools: 'toolIds',
			workflows: 'workflowIds',
			knowledgeBases: 'knowledgeBaseIds',
			integrations: 'integrationIds'
		} as const;
		const fieldName = fieldMap[type];
		const currentIds = formData[fieldName];
		const newIds = currentIds.includes(id)
			? currentIds.filter(existingId => existingId !== id)
			: [...currentIds, id];

		setFormData({ ...formData, [fieldName]: newIds });
	};

	const handleAddQuestion = () => {
		if (newQuestion.trim()) {
			setFormData({
				...formData,
				quickQuestions: [...formData.quickQuestions, newQuestion.trim()]
			});
			setNewQuestion("");
		}
	};

	const handleRemoveQuestion = (index: number) => {
		const newQuestions = [...formData.quickQuestions];
		newQuestions.splice(index, 1);
		setFormData({
			...formData,
			quickQuestions: newQuestions
		});
	};

	return (
		<Dialog open={open} onClose={onClose} size="4xl">
			<DialogTitle>{isEditing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the agent configuration and relationships."
					: "Create a new AI agent by configuring its properties and selecting resources."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody className="space-y-0">
					{/* Basic Information */}
					<CollapsibleSection
						title="Basic Information"
						icon={InformationCircleIcon}
						isOpen={openSections.has('basic')}
						onToggle={() => {
							const next = new Set(openSections);
							if (next.has('basic')) next.delete('basic'); else next.add('basic');
							setOpenSections(next);
						}}
					>
						<div className="space-y-4">
							<Field>
								<Label>Agent Name</Label>
								<Input
									required
									placeholder="Enter agent name"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									invalid={!!errors.name}
								/>
								{errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe what this agent does..."
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									rows={5}
								/>
								{errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
							</Field>
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						title="Tools"
						badgeCount={formData.toolIds.length}
						icon={WrenchScrewdriverIcon}
						isOpen={openSections.has('tools')}
						onToggle={() => {
							const next = new Set(openSections);
							if (next.has('tools')) next.delete('tools'); else next.add('tools');
							setOpenSections(next);
						}}
					>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{tools.length === 0 ? (
								<p className="text-sm text-zinc-500 text-center py-4">No tools available</p>
							) : (
								tools.map((tool) => (
									<div
										key={tool.id}
										onClick={() => toggleSelection(tool.id, 'tools')}
										className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-md border transition-colors ${formData.toolIds.includes(tool.id) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-indigo-300'}`}
									>
										<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.toolIds.includes(tool.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
											{formData.toolIds.includes(tool.id) && <span className="text-white text-xs font-bold">✓</span>}
										</div>
										<div>
											<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{tool.name}</p>
											<p className="text-xs text-zinc-500">{tool.tool_type}</p>
										</div>
									</div>
								))
							)}
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						title="Workflows"
						badgeCount={formData.workflowIds.length}
						icon={FireIcon}
						isOpen={openSections.has('workflows')}
						onToggle={() => {
							const next = new Set(openSections);
							if (next.has('workflows')) next.delete('workflows'); else next.add('workflows');
							setOpenSections(next);
						}}
					>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{workflows.length === 0 ? (
								<p className="text-sm text-zinc-500 text-center py-4">No workflows available</p>
							) : (
								workflows.map((workflow) => (
									<div
										key={workflow.id}
										onClick={() => toggleSelection(workflow.id, 'workflows')}
										className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-md border transition-colors ${formData.workflowIds.includes(workflow.id) ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800' : 'bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-orange-300'}`}
									>
										<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.workflowIds.includes(workflow.id) ? 'bg-orange-500 border-orange-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
											{formData.workflowIds.includes(workflow.id) && <span className="text-white text-xs font-bold">✓</span>}
										</div>
										<div>
											<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{workflow.name}</p>
											<p className="text-xs text-zinc-500">{workflow.description || "No description"}</p>
										</div>
									</div>
								))
							)}
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						title="Knowledge Bases"
						badgeCount={formData.knowledgeBaseIds.length}
						icon={BookOpenIcon}
						isOpen={openSections.has('knowledgeBases')}
						onToggle={() => {
							const next = new Set(openSections);
							if (next.has('knowledgeBases')) next.delete('knowledgeBases'); else next.add('knowledgeBases');
							setOpenSections(next);
						}}
					>
						<div className="space-y-2 max-h-60 overflow-y-auto">
							{knowledgeBases.length === 0 ? (
								<p className="text-sm text-zinc-500 text-center py-4">No knowledge bases available</p>
							) : (
								knowledgeBases.map((kb) => (
									<div
										key={kb.id}
										onClick={() => toggleSelection(kb.id, 'knowledgeBases')}
										className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-md border transition-colors ${formData.knowledgeBaseIds.includes(kb.id) ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:border-emerald-300'}`}
									>
										<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.knowledgeBaseIds.includes(kb.id) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
											{formData.knowledgeBaseIds.includes(kb.id) && <span className="text-white text-xs font-bold">✓</span>}
										</div>
										<div>
											<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{kb.name}</p>
											<p className="text-xs text-zinc-500">{kb.documents_count} documents</p>
										</div>
									</div>
								))
							)}
						</div>
					</CollapsibleSection>

					<CollapsibleSection
						title="Quick Questions"
						badgeCount={formData.quickQuestions.length}
						icon={PlusIcon}
						isOpen={openSections.has('quickQuestions')}
						onToggle={() => {
							const next = new Set(openSections);
							if (next.has('quickQuestions')) next.delete('quickQuestions'); else next.add('quickQuestions');
							setOpenSections(next);
						}}
					>
						<div className="space-y-4">
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								Add suggested questions to help users start a conversation.
							</p>
							<div className="flex gap-2">
								<Input
									className="flex-1"
									placeholder="e.g. 'What are your capabilities?'"
									value={newQuestion}
									onChange={(e) => setNewQuestion(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											handleAddQuestion();
										}
									}}
								/>
								<Button type="button" outline onClick={handleAddQuestion}>
									<PlusIcon className="h-4 w-4 mr-1.5" />
									Add
								</Button>
							</div>

							{formData.quickQuestions.length > 0 && (
								<div className="space-y-2">
									{formData.quickQuestions.map((question, index) => (
										<div key={index} className="flex items-center justify-between pl-4 pr-2 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700">
											<span className="text-sm text-zinc-900 dark:text-zinc-100">{question}</span>
											<button
												type="button"
												onClick={() => handleRemoveQuestion(index)}
												className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
											>
												<XMarkIcon className="h-4 w-4" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					</CollapsibleSection>
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
