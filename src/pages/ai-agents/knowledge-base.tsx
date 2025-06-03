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
import { useKnowledgeBaseDocuments, useDeleteKnowledgeBase, type KnowledgeBaseDocument } from "../../lib/api/hooks/use-knowledge-bases";
import { useProjectStore } from "../../lib/store/project";

// Remove the local interface since we're importing it from the API hooks

const getTypeIcon = (fileType: string) => {
	if (fileType.includes("pdf")) {
		return <DocumentTextIcon className="h-4 w-4" />;
	}
	if (fileType.includes("markdown") || fileType.includes("md")) {
		return <BookOpenIcon className="h-4 w-4" />;
	}
	return <DocumentTextIcon className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

const getFileTypeLabel = (fileType: string) => {
	if (fileType.includes("pdf")) return "PDF";
	if (fileType.includes("markdown") || fileType.includes("md")) return "MD";
	return fileType.split("/").pop()?.toUpperCase() || "FILE";
};

export default function KnowledgeBasePage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingDocument, setEditingDocument] =
		useState<KnowledgeBaseDocument | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const { selectedDeployment } = useProjectStore();

	// For now, we'll use a placeholder knowledge base ID
	// In a real app, this would come from the URL params or be selected by the user
	const knowledgeBaseId = "placeholder-kb-id";

	const {
		data: documents = [],
		isLoading,
		error,
	} = useKnowledgeBaseDocuments(
		selectedDeployment?.id || "",
		knowledgeBaseId,
		{ limit: 50 }
	);

	const deleteDocumentMutation = useDeleteKnowledgeBase(selectedDeployment?.id || "");

	const handleCreateDocument = () => {
		setIsCreateDialogOpen(true);
	};

	const handleEditDocument = (doc: KnowledgeBaseDocument) => {
		setEditingDocument(doc);
		setIsCreateDialogOpen(true);
	};

	const handleDeleteDocument = async (documentId: string) => {
		if (confirm("Are you sure you want to delete this document?")) {
			try {
				await deleteDocumentMutation.mutateAsync(documentId);
			} catch (error) {
				console.error("Error deleting document:", error);
			}
		}
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
							<Input
								name="search"
								placeholder="Search documents..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</InputGroup>
					</div>
				</div>
				<Button onClick={handleCreateDocument}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Upload Document
				</Button>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
						<p className="mt-2 text-sm text-gray-500">Loading documents...</p>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<div className="text-red-500">
							<p className="text-sm">Error loading documents</p>
						</div>
					</div>
				) : documents.length === 0 ? (
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
								<TableHeader>Usage</TableHeader>
								<TableHeader className="w-[150px]">Actions</TableHeader>
							</TableRow>
						</TableHead>
						<TableBody>
							{documents
								.filter((doc) =>
									searchQuery === "" ||
									doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
									doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
								)
								.map((doc) => (
								<TableRow key={doc.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
												{getTypeIcon(doc.file_type)}
											</div>
											<span className="font-medium">{doc.title}</span>
										</div>
									</TableCell>
									<TableCell>{doc.description || "No description"}</TableCell>
									<TableCell>
										<Badge className="bg-blue-100 text-blue-800">
											{getFileTypeLabel(doc.file_type)}
										</Badge>
									</TableCell>
									<TableCell>{formatFileSize(doc.file_size)}</TableCell>
									<TableCell>{doc.usage_count} uses</TableCell>
									<TableCell>
										<div className="flex gap-2">
											<Button outline onClick={() => handleEditDocument(doc)}>
												Edit
											</Button>
											<Button
												outline
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleDeleteDocument(doc.id)}
												disabled={deleteDocumentMutation.isPending}
											>
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
				deploymentId={selectedDeployment?.id || ""}
				knowledgeBaseId={knowledgeBaseId}
			/>
		</div>
	);
}
