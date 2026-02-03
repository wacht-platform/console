import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import {
	WrenchScrewdriverIcon,
	FireIcon,
	BookOpenIcon,
	CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from 'sonner';

import type { Agent } from "../../lib/api/hooks/use-agents";
import { useCreateAgent, useUpdateAgent } from "../../lib/api/hooks/use-agents";
import { useTools } from "../../lib/api/hooks/use-tools";
import { useKnowledgeBases } from "../../lib/api/hooks/use-knowledge-bases";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface CreateAgentDialogProps {
	open: boolean;
	onClose: () => void;
	agent?: Agent | null;
}

interface AgentFormData {
	name: string;
	description: string;
	toolIds: string[];
	knowledgeBaseIds: string[];
	integrationIds: string[];
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
	const [activeTab, setActiveTab] = useState("details");
	const [formData, setFormData] = useState<AgentFormData>({
		name: "",
		description: "",
		toolIds: [],
		knowledgeBaseIds: [],
		integrationIds: [],
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEditing = !!agent;

	// API hooks
	const createAgentMutation = useCreateAgent();
	const updateAgentMutation = useUpdateAgent();

	// Fetch available resources
	const { data: toolsData } = useTools({ limit: 100 });
	const { data: knowledgeBasesData } = useKnowledgeBases({ limit: 100 });

	const tools = toolsData?.tools || [];
	const knowledgeBases = knowledgeBasesData?.data || [];

	// Reset form when dialog opens/closes
	useEffect(() => {
		if (open) {
			setActiveTab("details");
			if (agent) {
				setFormData({
					name: agent.name,
					description: agent.description || "",
					toolIds: (agent.configuration?.tool_ids as string[]) || [],
					knowledgeBaseIds: (agent.configuration?.knowledge_base_ids as string[]) || [],
					integrationIds: (agent.configuration?.integration_ids as string[]) || [],
				});
			} else {
				setFormData({
					name: "",
					description: "",
					toolIds: [],
					knowledgeBaseIds: [],
					integrationIds: [],
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
					knowledge_base_ids: formData.knowledgeBaseIds,
					integration_ids: formData.integrationIds,
					quick_questions: [],
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

	const toggleSelection = (id: string, type: 'tools' | 'knowledgeBases') => {
		const fieldMap = {
			tools: 'toolIds',
			knowledgeBases: 'knowledgeBaseIds',
		} as const;
		const fieldName = fieldMap[type];
		const currentIds = formData[fieldName];
		const newIds = currentIds.includes(id)
			? currentIds.filter(existingId => existingId !== id)
			: [...currentIds, id];

		setFormData({ ...formData, [fieldName]: newIds });
	};

	return (
		<Dialog open={open} onOpenChange={(val) => !val && onClose()}>
			<DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
				<DialogHeader className="p-6 pb-2">
					<DialogTitle>{isEditing ? "Edit Agent" : "Create Agent"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update agent configuration."
							: "Configure your new AI agent."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
						<div className="px-6">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="details">Details</TabsTrigger>
								<TabsTrigger value="capabilities">Capabilities</TabsTrigger>
							</TabsList>
						</div>

						<div className="flex-1 overflow-y-auto p-6">
							<TabsContent value="details" className="mt-0 space-y-6">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Agent Name <span className="text-destructive">*</span></Label>
										<Input
											required
											placeholder="e.g. Customer Support Bot"
											value={formData.name}
											onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										/>
										{errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
									</div>

									<div className="space-y-2">
										<Label>Description</Label>
										<Textarea
											placeholder="Describe the agent's purpose and personality..."
											value={formData.description}
											onChange={(e) => setFormData({ ...formData, description: e.target.value })}
											rows={6}
										/>
										{errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
									</div>
								</div>
							</TabsContent>

							<TabsContent value="capabilities" className="mt-0 space-y-8">
								{/* Tools Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label className="flex items-center gap-2 text-base">
											<WrenchScrewdriverIcon className="h-4 w-4 text-primary" />
											Tools
										</Label>
										{formData.toolIds.length > 0 && (
											<Badge variant="secondary">{formData.toolIds.length} selected</Badge>
										)}
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{tools.length === 0 ? (
											<div className="col-span-full text-sm text-muted-foreground py-2 italic text-center border border-dashed rounded-lg">
												No tools available
											</div>
										) : (
											tools.map((tool) => (
												<div
													key={tool.id}
													onClick={() => toggleSelection(tool.id, 'tools')}
													className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${formData.toolIds.includes(tool.id)
														? "border-primary bg-primary/5 hover:bg-primary/10"
														: "border-border"
														}`}
												>
													<div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center border ${formData.toolIds.includes(tool.id)
														? "bg-primary border-primary text-primary-foreground"
														: "border-muted-foreground"
														}`}>
														{formData.toolIds.includes(tool.id) && <CheckIcon className="h-3 w-3" />}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">{tool.name}</div>
														<div className="text-xs text-muted-foreground truncate">{tool.tool_type}</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>

								{/* Knowledge Base Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label className="flex items-center gap-2 text-base">
											<BookOpenIcon className="h-4 w-4 text-blue-500" />
											Knowledge Bases
										</Label>
										{formData.knowledgeBaseIds.length > 0 && (
											<Badge variant="secondary">{formData.knowledgeBaseIds.length} selected</Badge>
										)}
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{knowledgeBases.length === 0 ? (
											<div className="col-span-full text-sm text-muted-foreground py-2 italic text-center border border-dashed rounded-lg">
												No knowledge bases available
											</div>
										) : (
											knowledgeBases.map((kb) => (
												<div
													key={kb.id}
													onClick={() => toggleSelection(kb.id, 'knowledgeBases')}
													className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${formData.knowledgeBaseIds.includes(kb.id)
														? "border-primary bg-primary/5 hover:bg-primary/10"
														: "border-border"
														}`}
												>
													<div className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center border ${formData.knowledgeBaseIds.includes(kb.id)
														? "bg-primary border-primary text-primary-foreground"
														: "border-muted-foreground"
														}`}>
														{formData.knowledgeBaseIds.includes(kb.id) && <CheckIcon className="h-3 w-3" />}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-sm truncate">{kb.name}</div>
														<div className="text-xs text-muted-foreground truncate">{kb.documents_count} documents</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</TabsContent>
						</div>

						<div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/40 shrink-0">
							<Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
								Cancel
							</Button>
							<Button
								type="submit"
								onClick={handleSubmit}
								disabled={isSubmitting || !formData.name.trim()}
							>
								{isSubmitting
									? (isEditing ? "Updating..." : "Creating...")
									: (isEditing ? "Update Agent" : "Create Agent")
								}
							</Button>
						</div>
					</Tabs>
				</form>
			</DialogContent>
		</Dialog>
	);
}
