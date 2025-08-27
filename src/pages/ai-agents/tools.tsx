import { useState } from "react";
import {
	WrenchScrewdriverIcon,
	PlusIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "../../components/ui/heading";
import { Button } from "../../components/ui/button";
import { Input, InputGroup } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { CreateToolDialog } from "../../components/ai-agents/create-tool-dialog";
import { Spinner } from "../../components/ui/spinner";
import { useTools, useDeleteTool } from "../../lib/api/hooks/use-tools";
import type { AiTool } from "@/types/ai-tool";

const getTypeColor = (type: string) => {
	switch (type) {
		case "api":
			return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
		case "knowledge_base":
			return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
		case "platform_event":
			return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
		case "platform_function":
			return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300";
		default:
			return "bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-300";
	}
};

export default function ToolsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingTool, setEditingTool] = useState<AiTool | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [toolToDelete, setToolToDelete] = useState<AiTool | null>(null);

	// API hooks
	const { data, isLoading, error } = useTools({
		search: searchTerm || undefined,
	});
	const tools = data?.tools || [];
	const deleteToolMutation = useDeleteTool();

	const handleCreateTool = () => {
		setEditingTool(null);
		setIsCreateDialogOpen(true);
	};

	const handleEditTool = (tool: AiTool) => {
		setEditingTool(tool);
		setIsCreateDialogOpen(true);
	};

	const handleDeleteTool = (tool: AiTool) => {
		setToolToDelete(tool);
		setConfirmDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (toolToDelete) {
			try {
				await deleteToolMutation.mutateAsync(toolToDelete.id);
				setConfirmDeleteOpen(false);
				setToolToDelete(null);
			} catch (error) {
				console.error("Failed to delete tool:", error);
			}
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>AI Tools</Heading>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Manage tools that can be used by AI agents and workflows
				</p>
			</div>

			{!isLoading && !error && tools.length > 0 && (
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="sm:flex-1">
						<div className="mt-4 flex max-w-md gap-2">
							<InputGroup className="w-64">
								<MagnifyingGlassIcon className="size-4" />
								<Input
									name="search"
									placeholder="Search tools..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</InputGroup>
						</div>
					</div>
					<Button onClick={handleCreateTool}>
						<PlusIcon className="mr-2 h-4 w-4" />
						Create Tool
					</Button>
				</div>
			)}

			<div className="mt-6">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center min-h-[400px] py-12">
						<Spinner size="lg" />
						<p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading tools...</p>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<p className="text-red-600 dark:text-red-400">Error loading tools: {error.message}</p>
					</div>
				) : tools.length === 0 ? (
					<div className="text-center py-12">
						<WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
						<h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
							No tools
						</h3>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Get started by creating your first AI tool.
						</p>
						<div className="mt-6">
							<Button onClick={handleCreateTool}>
								<PlusIcon className="mr-2 h-4 w-4" />
								Create Tool
							</Button>
						</div>
					</div>
				) : (
					<Table>
						<TableHead>
							<TableRow>
								<TableHeader>Name</TableHeader>
								<TableHeader>Description</TableHeader>
								<TableHeader>Type</TableHeader>
								<TableHeader className="w-[150px]">Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{tools.map((tool) => (
								<TableRow key={tool.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
												<WrenchScrewdriverIcon className="h-4 w-4" />
											</div>
											<span className="font-medium">{tool.name}</span>
										</div>
									</TableCell>
									<TableCell>{tool.description}</TableCell>
									<TableCell>
										<Badge className={getTypeColor(tool.tool_type)}>
											{tool.tool_type === "api" ? "API Call" :
											 tool.tool_type === "knowledge_base" ? "Knowledge Base" :
											 tool.tool_type === "platform_event" ? "Platform Event" :
											 tool.tool_type === "platform_function" ? "Platform Function" :
											 "Unknown"}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditTool(tool)}>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleDeleteTool(tool)}
												disabled={deleteToolMutation.isPending}
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
			</div>

			<CreateToolDialog
				open={isCreateDialogOpen}
				onClose={() => {
					setIsCreateDialogOpen(false);
					setEditingTool(null);
				}}
				tool={editingTool || undefined}
			/>
			
			<ConfirmationDialog
				isOpen={confirmDeleteOpen}
				onClose={() => {
					setConfirmDeleteOpen(false);
					setToolToDelete(null);
				}}
				onConfirm={handleConfirmDelete}
				title="Delete Tool"
				message={toolToDelete ? `Are you sure you want to delete the tool "${toolToDelete.name}"? This action cannot be undone.` : ''}
				confirmText="Delete"
				isDestructive={true}
				isLoading={deleteToolMutation.isPending}
			/>
		</div>
	);
}
