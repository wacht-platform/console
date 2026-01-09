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
	ChevronDownIcon,
	LinkIcon
} from "@heroicons/react/24/outline";
import { toast } from 'sonner';

import type { Agent } from "../../lib/api/hooks/use-agents";
import { useCreateAgent, useUpdateAgent } from "../../lib/api/hooks/use-agents";
import { useTools } from "../../lib/api/hooks/use-tools";
import { useWorkflows } from "../../lib/api/hooks/use-workflows";
import { useKnowledgeBases } from "../../lib/api/hooks/use-knowledge-bases";
import { useIntegrations } from "../../lib/api/hooks/use-integrations";
import { SiWhatsapp, SiClickup } from "react-icons/si";
import { BsMicrosoftTeams } from "react-icons/bs";

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

const getIntegrationIcon = (type: string) => {
	switch (type) {
		case "teams":
			return <BsMicrosoftTeams className="h-4 w-4 text-[#6264A7]" />;
		case "whatsapp":
			return <SiWhatsapp className="h-4 w-4 text-[#25D366]" />;
		case "clickup":
			return <SiClickup className="h-4 w-4 text-[#7B44AC]" />;
		default:
			return <LinkIcon className="h-4 w-4 text-zinc-500" />;
	}
};

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
		integrationIds: [],
		quickQuestions: [],
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newQuestion, setNewQuestion] = useState("");
	const [isQuickQuestionsOpen, setIsQuickQuestionsOpen] = useState(false);

	const isEditing = !!agent;

	// API hooks
	const createAgentMutation = useCreateAgent();
	const updateAgentMutation = useUpdateAgent();

	// Fetch available resources
	const { data: toolsData } = useTools({ limit: 100 });
	const { data: workflowsData } = useWorkflows({ limit: 100 });
	const { data: knowledgeBasesData } = useKnowledgeBases({ limit: 100 });
	const { data: integrationsData } = useIntegrations(agent?.id ?? "");

	const tools = toolsData?.tools || [];
	const workflows = workflowsData?.workflows || [];
	const knowledgeBases = knowledgeBasesData?.data || [];
	const integrations = integrationsData?.integrations || [];

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
					integrationIds: (agent.configuration?.integration_ids as string[]) || [],
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
				<DialogBody className="space-y-6">
					{/* Basic Information */}
					<div className="grid grid-cols-2 gap-4">
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

					{/* Quick Questions */}
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

					{/* Resources Section - 2x2 Grid */}
					<div className="space-y-4">
						<div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700">
							<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Attach Resources</span>
							<span className="text-xs text-zinc-400">(optional)</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							{/* Tools */}
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/30 overflow-hidden">
								<div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
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
								<div className="max-h-36 overflow-y-auto">
									{tools.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<WrenchScrewdriverIcon className="h-5 w-5 text-zinc-400 mb-2" />
											<span className="text-sm text-zinc-500">No tools available</span>
										</div>
									) : (
										tools.map((tool) => (
											<div
												key={tool.id}
												onClick={() => toggleSelection(tool.id, 'tools')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.toolIds.includes(tool.id) ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.toolIds.includes(tool.id) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
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
								<div className="max-h-36 overflow-y-auto">
									{workflows.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<FireIcon className="h-5 w-5 text-zinc-400 mb-2" />
											<span className="text-sm text-zinc-500">No workflows available</span>
										</div>
									) : (
										workflows.map((workflow) => (
											<div
												key={workflow.id}
												onClick={() => toggleSelection(workflow.id, 'workflows')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.workflowIds.includes(workflow.id) ? 'bg-orange-50 dark:bg-orange-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.workflowIds.includes(workflow.id) ? 'bg-orange-500 border-orange-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
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
									<div className="flex items-center gap-2">
										<div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
											<BookOpenIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
										</div>
										<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Knowledge Bases</span>
										{formData.knowledgeBaseIds.length > 0 && (
											<Badge color="emerald" className="text-xs">{formData.knowledgeBaseIds.length}</Badge>
										)}
									</div>
								</div>
								<div className="max-h-36 overflow-y-auto">
									{knowledgeBases.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<BookOpenIcon className="h-5 w-5 text-zinc-400 mb-2" />
											<span className="text-sm text-zinc-500">No knowledge bases</span>
										</div>
									) : (
										knowledgeBases.map((kb) => (
											<div
												key={kb.id}
												onClick={() => toggleSelection(kb.id, 'knowledgeBases')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.knowledgeBaseIds.includes(kb.id) ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.knowledgeBaseIds.includes(kb.id) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
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

							{/* Integrations */}
							<div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/30 overflow-hidden">
								<div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
									<div className="flex items-center gap-2">
										<div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
											<LinkIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
										</div>
										<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Integrations</span>
										{formData.integrationIds.length > 0 && (
											<Badge color="purple" className="text-xs">{formData.integrationIds.length}</Badge>
										)}
									</div>
								</div>
								<div className="max-h-36 overflow-y-auto">
									{integrations.length === 0 ? (
										<div className="flex flex-col items-center justify-center py-6 px-4">
											<LinkIcon className="h-5 w-5 text-zinc-400 mb-2" />
											<span className="text-sm text-zinc-500">No integrations</span>
										</div>
									) : (
										integrations.map((integration) => (
											<div
												key={integration.id}
												onClick={() => toggleSelection(integration.id, 'integrations')}
												className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors ${formData.integrationIds.includes(integration.id) ? 'bg-purple-50 dark:bg-purple-900/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
											>
												<div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${formData.integrationIds.includes(integration.id) ? 'bg-purple-500 border-purple-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
													{formData.integrationIds.includes(integration.id) && <span className="text-white text-xs font-bold">✓</span>}
												</div>
												<div className="flex items-center gap-2 flex-1 min-w-0">
													{getIntegrationIcon(integration.integration_type)}
													<p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{integration.name}</p>
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
