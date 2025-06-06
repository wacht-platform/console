import { useState } from "react";
import {
	WrenchScrewdriverIcon,
	PlusIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
	GlobeAltIcon,
	BookOpenIcon,
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
import { CreateToolDialog } from "../../components/ai-agents/create-tool-dialog";
import { useTools, useDeleteTool, useCreateTool, useUpdateTool } from "../../lib/api/hooks/use-tools";
import type { AiTool, CreateToolRequest, UpdateToolRequest } from "@/types/ai-tool";

const getTypeColor = (type: string) => {
	switch (type) {
		case "api":
			return "bg-blue-100 text-blue-800";
		case "knowledge_base":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

export default function ToolsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingTool, setEditingTool] = useState<AiTool | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

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

	const handleDeleteTool = async (toolId: string) => {
		if (confirm("Are you sure you want to delete this tool?")) {
			try {
				await deleteToolMutation.mutateAsync(toolId);
			} catch (error) {
				console.error("Failed to delete tool:", error);
			}
		}
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>AI Tools</Heading>
				<p className="text-sm text-gray-600">
					Manage tools that can be used by AI agents and workflows
				</p>
			</div>

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

			<div className="mt-6">
				{isLoading ? (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-2 text-sm text-gray-500">Loading tools...</p>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<p className="text-red-600">Error loading tools: {error.message}</p>
					</div>
				) : tools.length === 0 ? (
					<div className="text-center py-12">
						<WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-semibold text-gray-900">
							No tools
						</h3>
						<p className="mt-1 text-sm text-gray-500">
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
								<TableHeader>Status</TableHeader>
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
											{tool.tool_type === "api" ? "API Call" : "Knowledge Base"}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge className="bg-green-100 text-green-800">Active</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditTool(tool)}>
												<PencilIcon className="h-4 w-4" />
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleDeleteTool(tool.id)}
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
				tool={editingTool}
			/>
		</div>
	);
}
