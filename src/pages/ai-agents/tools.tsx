import { useState } from "react";
import {
	WrenchScrewdriverIcon,
	PlusIcon,
	MagnifyingGlassIcon,
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

interface Tool {
	id: string;
	name: string;
	description: string;
	type: "api" | "function" | "database" | "external";
	status: "active" | "inactive" | "draft";
	lastModified: string;
	usageCount: number;
}

const tools: Tool[] = [];

const getTypeColor = (type: Tool["type"]) => {
	switch (type) {
		case "api":
			return "bg-blue-100 text-blue-800";
		case "function":
			return "bg-green-100 text-green-800";
		case "database":
			return "bg-purple-100 text-purple-800";
		case "external":
			return "bg-orange-100 text-orange-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

export default function ToolsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingTool, setEditingTool] = useState<Tool | null>(null);

	const handleCreateTool = () => {
		setIsCreateDialogOpen(true);
	};

	const handleEditTool = (tool: Tool) => {
		setEditingTool(tool);
		setIsCreateDialogOpen(true);
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
							<Input name="search" placeholder="Search tools..." />
						</InputGroup>
					</div>
				</div>
				<Button onClick={handleCreateTool}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Create Tool
				</Button>
			</div>

			<div className="mt-6">
				{tools.length === 0 ? (
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
								<TableHeader>Usage</TableHeader>
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
										<Badge className={getTypeColor(tool.type)}>
											{tool.type}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge>{tool.status}</Badge>
									</TableCell>
									<TableCell>{tool.usageCount} uses</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditTool(tool)}>
												Edit
											</Button>
											<Button outline className="text-red-600 hover:bg-red-50">
												Delete
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
