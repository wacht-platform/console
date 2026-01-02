import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
	ChevronDownIcon
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
	quickQuestions: string[];
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
		quickQuestions: [],
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newQuestion, setNewQuestion] = useState("");
	const [isQuickQuestionsOpen, setIsQuickQuestionsOpen] = useState(false);

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
					quickQuestions: (agent.configuration?.quick_questions as string[]) || [],
				});
				const qq = agent.configuration?.quick_questions as string[] | undefined;
				if (qq && qq.length > 0) {
					setIsQuickQuestionsOpen(true);
				}
			} else {
				setFormData({
					name: "",
					description: "",
					toolIds: [],
					workflowIds: [],
					knowledgeBaseIds: [],
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
		<Dialog open={open} onClose={onClose} size="5xl">
			<DialogTitle>{isEditing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the agent configuration and relationships."
					: "Create a new AI agent by configuring its properties and selecting tools, workflows, and knowledge bases."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody className="space-y-6">
					{/* Basic Information - Each on own line */}
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
							<Input
								placeholder="Describe what this agent does"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								invalid={!!errors.description}
							/>
							{errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
						</Field>
					</div>

					<div className="space-y-4">
						<div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
							<button
								type="button"
								onClick={() => setIsQuickQuestionsOpen(!isQuickQuestionsOpen)}
								className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
							>
								<div className="flex items-center gap-2">
									Quick Questions
									{formData.quickQuestions.length > 0 && (
										<span className="inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
											{formData.quickQuestions.length}
										</span>
									)}
								</div>
								<ChevronDownIcon
									className={`h-5 w-5 text-zinc-500 transition-transform duration-200 ${isQuickQuestionsOpen ? 'rotate-180' : ''}`}
								/>
							</button>

							{isQuickQuestionsOpen && (
								<div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
									<p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
										Add suggested questions to help users start a conversation.
									</p>
									<div className="flex gap-2 mb-3">
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
										<div className="flex flex-wrap gap-2">
											{formData.quickQuestions.map((question, index) => (
												<div key={index} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-md border border-zinc-200 dark:border-zinc-700/50 group hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
													<span className="text-sm text-zinc-700 dark:text-zinc-300">{question}</span>
													<button
														type="button"
														onClick={() => handleRemoveQuestion(index)}
														className="p-0.5 text-zinc-400 hover:text-red-500 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
													>
														<XMarkIcon className="h-3.5 w-3.5" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Resources Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
							<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Attach Resources</span>
							<span className="text-xs text-zinc-400">(optional)</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Tools */}
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/30 overflow-hidden">
								<div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
												<WrenchScrewdriverIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
											</div>
											<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tools</span>
											{formData.toolIds.length > 0 && (
												<Badge color="indigo" className="text-xs">{formData.toolIds.length}</Badge>
											)}
										</div>
									</div>
								</div>
								<div className="max-h-40 overflow-y-auto">
									{filteredTools.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2">
												<WrenchScrewdriverIcon className="h-5 w-5 text-zinc-400" />
											</div>
											<span className="text-sm text-zinc-500 text-center">No tools available</span>
											<span className="text-xs text-zinc-400 mt-1">Create tools to attach</span>
										</div>
									) : (
										filteredTools.map((tool) => (
											<div
												key={tool.id}
												onClick={() => toggleSelection(tool.id, 'tools')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.toolIds.includes(tool.id) ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
													}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.toolIds.includes(tool.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300 dark:border-zinc-600'
													}`}>
													{formData.toolIds.includes(tool.id) && <span className="text-white text-xs font-bold">✓</span>}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{tool.name}</p>
													<p className="text-xs text-zinc-500 truncate">{tool.tool_type}</p>
												</div>
											</div>
										))
									)}
								</div>
							</div>

							{/* Workflows */}
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/30 overflow-hidden">
								<div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50">
												<FireIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
											</div>
											<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Workflows</span>
											{formData.workflowIds.length > 0 && (
												<Badge color="orange" className="text-xs">{formData.workflowIds.length}</Badge>
											)}
										</div>
									</div>
								</div>
								<div className="max-h-40 overflow-y-auto">
									{filteredWorkflows.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2">
												<FireIcon className="h-5 w-5 text-zinc-400" />
											</div>
											<span className="text-sm text-zinc-500 text-center">No workflows available</span>
											<span className="text-xs text-zinc-400 mt-1">Create workflows to attach</span>
										</div>
									) : (
										filteredWorkflows.map((workflow) => (
											<div
												key={workflow.id}
												onClick={() => toggleSelection(workflow.id, 'workflows')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.workflowIds.includes(workflow.id) ? 'bg-orange-50 dark:bg-orange-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
													}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.workflowIds.includes(workflow.id) ? 'bg-orange-500 border-orange-500' : 'border-zinc-300 dark:border-zinc-600'
													}`}>
													{formData.workflowIds.includes(workflow.id) && <span className="text-white text-xs font-bold">✓</span>}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{workflow.name}</p>
												</div>
											</div>
										))
									)}
								</div>
							</div>

							{/* Knowledge Bases */}
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/30 overflow-hidden">
								<div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
												<BookOpenIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
											</div>
											<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Knowledge</span>
											{formData.knowledgeBaseIds.length > 0 && (
												<Badge color="emerald" className="text-xs">{formData.knowledgeBaseIds.length}</Badge>
											)}
										</div>
									</div>
								</div>
								<div className="max-h-40 overflow-y-auto">
									{filteredKnowledgeBases.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-2">
												<BookOpenIcon className="h-5 w-5 text-zinc-400" />
											</div>
											<span className="text-sm text-zinc-500 text-center">No knowledge bases</span>
											<span className="text-xs text-zinc-400 mt-1">Create knowledge bases</span>
										</div>
									) : (
										filteredKnowledgeBases.map((kb) => (
											<div
												key={kb.id}
												onClick={() => toggleSelection(kb.id, 'knowledgeBases')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.knowledgeBaseIds.includes(kb.id) ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
													}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.knowledgeBaseIds.includes(kb.id) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600'
													}`}>
													{formData.knowledgeBaseIds.includes(kb.id) && <span className="text-white text-xs font-bold">✓</span>}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{kb.name}</p>
													<p className="text-xs text-zinc-500 truncate">{kb.documents_count} documents</p>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</div>
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
