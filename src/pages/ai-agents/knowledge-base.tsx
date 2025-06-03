import { useState } from "react";
import {
	BookOpenIcon,
	PlusIcon,
	MagnifyingGlassIcon,
	DocumentTextIcon,
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
import { CreateKnowledgeBaseDialog } from "../../components/ai-agents/create-knowledge-base-dialog";

interface KnowledgeBaseDocument {
	id: string;
	title: string;
	description: string;
	type: "pdf" | "markdown";
	size: string;
	uploadedAt: string;
	status: "processing" | "ready" | "error";
	usageCount: number;
}

const documents: KnowledgeBaseDocument[] = [];

const getStatusColor = (status: KnowledgeBaseDocument["status"]) => {
	switch (status) {
		case "ready":
			return "bg-green-100 text-green-800";
		case "processing":
			return "bg-yellow-100 text-yellow-800";
		case "error":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};

const getTypeIcon = (type: KnowledgeBaseDocument["type"]) => {
	switch (type) {
		case "pdf":
			return <DocumentTextIcon className="h-4 w-4" />;
		case "markdown":
			return <BookOpenIcon className="h-4 w-4" />;
		default:
			return <DocumentTextIcon className="h-4 w-4" />;
	}
};

export default function KnowledgeBasePage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingDocument, setEditingDocument] =
		useState<KnowledgeBaseDocument | null>(null);

	const handleCreateDocument = () => {
		setIsCreateDialogOpen(true);
	};

	const handleEditDocument = (doc: KnowledgeBaseDocument) => {
		setEditingDocument(doc);
		setIsCreateDialogOpen(true);
	};

	return (
		<div>
			<div className="flex flex-col gap-2 mb-2">
				<Heading>Knowledge Base</Heading>
				<p className="text-sm text-gray-600">
					Upload and manage documents that AI agents can reference
				</p>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="sm:flex-1">
					<div className="mt-4 flex max-w-md gap-2">
						<InputGroup className="w-64">
							<MagnifyingGlassIcon className="size-4" />
							<Input name="search" placeholder="Search documents..." />
						</InputGroup>
					</div>
				</div>
				<Button onClick={handleCreateDocument}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Upload Document
				</Button>
			</div>

			<div className="mt-6">
				{documents.length === 0 ? (
					<div className="text-center py-12">
						<BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-semibold text-gray-900">
							No documents
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							Get started by uploading your first document.
						</p>
						<div className="mt-6">
							<Button onClick={handleCreateDocument}>
								<PlusIcon className="mr-2 h-4 w-4" />
								Upload Document
							</Button>
						</div>
					</div>
				) : (
					<Table>
						<TableHead>
							<TableRow>
								<TableHeader>Title</TableHeader>
								<TableHeader>Description</TableHeader>
								<TableHeader>Type</TableHeader>
								<TableHeader>Size</TableHeader>
								<TableHeader>Status</TableHeader>
								<TableHeader>Usage</TableHeader>
								<TableHeader className="w-[150px]">Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{documents.map((doc) => (
								<TableRow key={doc.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
												{getTypeIcon(doc.type)}
											</div>
											<span className="font-medium">{doc.title}</span>
										</div>
									</TableCell>
									<TableCell>{doc.description}</TableCell>
									<TableCell>
										<Badge className="bg-blue-100 text-blue-800">
											{doc.type.toUpperCase()}
										</Badge>
									</TableCell>
									<TableCell>{doc.size}</TableCell>
									<TableCell>
										<Badge className={getStatusColor(doc.status)}>
											{doc.status}
										</Badge>
									</TableCell>
									<TableCell>{doc.usageCount} uses</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditDocument(doc)}>
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

			<CreateKnowledgeBaseDialog
				open={isCreateDialogOpen}
				onClose={() => {
					setIsCreateDialogOpen(false);
					setEditingDocument(null);
				}}
				document={editingDocument}
			/>
		</div>
	);
}
