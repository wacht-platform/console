import { useState } from "react";
import {
	WrenchScrewdriverIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { InlineLoader } from "../../components/ui/loading-screen";
import { useTools, useDeleteTool } from "../../lib/api/hooks/use-tools";
import type { AiTool } from "@/types/ai-tool";

const getTypeBadge = (type: string) => {
	switch (type) {
		case "api":
			return "API Call";
		case "knowledge_base":
			return "Knowledge Base";
		case "platform_event":
			return "Platform Event";
		case "platform_function":
			return "Platform Function";
		default:
			return "Unknown";
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
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-xl font-normal tracking-tight">Tools</h1>
					<p className="text-sm text-muted-foreground">
						Manage tools that can be used by AI agents
					</p>
				</div>
				{!isLoading && !error && (
					<Button onClick={handleCreateTool}>
						Create Tool
					</Button>
				)}
			</div>

			{!isLoading && !error && tools.length > 0 && (
				<div className="relative mb-6">
					<MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search tools..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
			)}

			{isLoading ? (
				<InlineLoader />
			) : error ? (
				<div className="text-center py-12">
					<p className="text-destructive">Error loading tools: {error.message}</p>
				</div>
			) : tools.length === 0 ? (
				<div className="text-center py-12">
					<WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-2 text-sm font-normal">
						No tools
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Get started by creating your first AI tool.
					</p>
					<div className="mt-6">
						<Button onClick={handleCreateTool}>
							Create Tool
						</Button>
					</div>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
							<TableHead className="w-[150px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tools.map((tool) => (
							<TableRow key={tool.id}>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<WrenchScrewdriverIcon className="h-4 w-4" />
										</div>
										<span className="font-medium">{tool.name}</span>
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground max-w-sm truncate" title={tool.description || ""}>
									{tool.description}
								</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{getTypeBadge(tool.tool_type)}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex gap-2">
										<Button variant="ghost" size="icon" onClick={() => handleEditTool(tool)}>
											<PencilIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
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
