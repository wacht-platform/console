import { useState, useEffect } from "react";
import {
	BookOpenIcon,
	MagnifyingGlassIcon,
	DocumentTextIcon,
	TrashIcon,
	PlusIcon,
	FolderIcon,
	ChevronRightIcon,
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
import { InlineLoader } from "../../components/ui/loading-screen";
import { EnhancedUploadDialog } from "../../components/ai-agents/enhanced-upload-dialog";
import { CreateKnowledgeBaseFormDialog } from "../../components/ai-agents/create-knowledge-base-form-dialog";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import {
	useKnowledgeBases,
	useKnowledgeBaseDocuments,
	useDeleteKnowledgeBase,
	useDeleteDocument,
	useCreateKnowledgeBase,
	type KnowledgeBase
} from "../../lib/api/hooks/use-knowledge-bases";


// Helper function to format file sizes
function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const getTypeIcon = (fileType: string) => {
	if (fileType.includes("pdf")) {
		return <DocumentTextIcon className="h-4 w-4" />;
	}
	if (fileType.includes("markdown") || fileType.includes("md")) {
		return <BookOpenIcon className="h-4 w-4" />;
	}
	return <DocumentTextIcon className="h-4 w-4" />;
};

const getFileTypeLabel = (fileType: string) => {
	if (fileType.includes("pdf")) return "PDF";
	if (fileType.includes("markdown") || fileType.includes("md")) return "MD";
	return fileType.split("/").pop()?.toUpperCase() || "FILE";
};

export default function KnowledgeBasePage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isCreateKnowledgeBaseDialogOpen, setIsCreateKnowledgeBaseDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
	const [documentsPage, setDocumentsPage] = useState(0);
	const [documentsLimit] = useState(20);

	// Confirmation dialog states
	const [deleteDocumentDialog, setDeleteDocumentDialog] = useState<{
		isOpen: boolean;
		documentId: string | null;
		documentTitle: string | null;
	}>({
		isOpen: false,
		documentId: null,
		documentTitle: null,
	});

	const [deleteKnowledgeBaseDialog, setDeleteKnowledgeBaseDialog] = useState<{
		isOpen: boolean;
		knowledgeBaseId: string | null;
		knowledgeBaseName: string | null;
	}>({
		isOpen: false,
		knowledgeBaseId: null,
		knowledgeBaseName: null,
	});

	// Fetch available knowledge bases
	const {
		data: knowledgeBasesResponse,
		isLoading: isLoadingKnowledgeBases,
		error: knowledgeBasesError,
	} = useKnowledgeBases({ limit: 50 });

	const knowledgeBases = knowledgeBasesResponse?.data || [];

	// Auto-select the first knowledge base if none is selected, or if the selected one no longer exists
	useEffect(() => {
		if (!selectedKnowledgeBase && knowledgeBases.length > 0) {
			setSelectedKnowledgeBase(knowledgeBases[0]);
		} else if (selectedKnowledgeBase && knowledgeBases.length > 0) {
			// Check if the currently selected knowledge base still exists
			const stillExists = knowledgeBases.find(kb => kb.id === selectedKnowledgeBase.id);
			if (!stillExists) {
				setSelectedKnowledgeBase(knowledgeBases[0]);
			}
		} else if (selectedKnowledgeBase && knowledgeBases.length === 0) {
			// No knowledge bases left, clear selection
			setSelectedKnowledgeBase(null);
		}
	}, [knowledgeBases, selectedKnowledgeBase]);

	// Reset pagination when knowledge base changes
	const handleKnowledgeBaseChange = (kb: KnowledgeBase) => {
		setSelectedKnowledgeBase(kb);
		setDocumentsPage(0);
	};

	// Fetch documents for the selected knowledge base
	const {
		data: documentsResponse,
		isLoading: isLoadingDocuments,
		error: documentsError,
	} = useKnowledgeBaseDocuments(
		selectedKnowledgeBase?.id || "",
		{
			limit: documentsLimit,
			offset: documentsPage * documentsLimit
		}
	);

	const documents = documentsResponse?.documents || [];
	const hasMoreDocuments = documentsResponse?.hasMore || false;

	const deleteKnowledgeBaseMutation = useDeleteKnowledgeBase();
	const deleteDocumentMutation = useDeleteDocument(selectedKnowledgeBase?.id || "");
	const createKnowledgeBaseMutation = useCreateKnowledgeBase();

	const handleCreateDocument = () => {
		setIsCreateDialogOpen(true);
	};

	const handleDeleteDocument = (documentId: string, documentTitle: string) => {
		setDeleteDocumentDialog({
			isOpen: true,
			documentId,
			documentTitle,
		});
	};

	const handleDeleteKnowledgeBase = (knowledgeBaseId: string, knowledgeBaseName: string) => {
		setDeleteKnowledgeBaseDialog({
			isOpen: true,
			knowledgeBaseId,
			knowledgeBaseName,
		});
	};

	const confirmDeleteDocument = async () => {
		if (!deleteDocumentDialog.documentId) return;

		try {
			await deleteDocumentMutation.mutateAsync(deleteDocumentDialog.documentId);
			setDeleteDocumentDialog({ isOpen: false, documentId: null, documentTitle: null });
		} catch (error) {
			console.error("Error deleting document:", error);
		}
	};

	const confirmDeleteKnowledgeBase = async () => {
		if (!deleteKnowledgeBaseDialog.knowledgeBaseId) return;

		try {
			await deleteKnowledgeBaseMutation.mutateAsync(deleteKnowledgeBaseDialog.knowledgeBaseId);
			setDeleteKnowledgeBaseDialog({ isOpen: false, knowledgeBaseId: null, knowledgeBaseName: null });

			// Reset selected knowledge base if it was deleted
			if (selectedKnowledgeBase?.id === deleteKnowledgeBaseDialog.knowledgeBaseId) {
				setSelectedKnowledgeBase(null);
			}
		} catch (error) {
			console.error("Error deleting knowledge base:", error);
		}
	};

	const handleCreateKnowledgeBase = async (name: string, description?: string) => {
		try {
			const newKnowledgeBase = await createKnowledgeBaseMutation.mutateAsync({
				name,
				description,
				configuration: {},
			});
			setSelectedKnowledgeBase(newKnowledgeBase);
			setIsCreateKnowledgeBaseDialogOpen(false);
		} catch (error) {
			console.error("Error creating knowledge base:", error);
		}
	};

	// Loading state
	if (isLoadingKnowledgeBases) {
		return <InlineLoader />;
	}

	// Error state
	if (knowledgeBasesError) {
		return (
			<div className="text-center py-12">
				<p className="text-destructive">Error loading knowledge bases</p>
				<p className="text-xs text-muted-foreground mt-1">{knowledgeBasesError.message}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-10rem)]">
			{/* Header */}
			<div className="flex items-center justify-between mb-4 shrink-0">
				<div>
					<h1 className="text-xl font-normal tracking-tight">Knowledge Base</h1>
					<p className="text-sm text-muted-foreground">
						Manage your documents and knowledge sources
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="ghost" onClick={() => setIsCreateKnowledgeBaseDialogOpen(true)}>
						<FolderIcon className="h-4 w-4 mr-2" />
						New Knowledge Base
					</Button>
					<Button onClick={handleCreateDocument} disabled={!selectedKnowledgeBase}>
						<PlusIcon className="h-4 w-4 mr-2" />
						Upload File
					</Button>
				</div>
			</div>

			{/* Main Content - Split Layout */}
			<div className="flex flex-1 gap-6 min-h-0 border rounded-lg bg-background overflow-hidden relative">

				{/* Sidebar (Folder List) */}
				<div className="w-64 border-r flex flex-col bg-muted/10">
					<div className="p-3 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Knowledge Bases
					</div>
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{knowledgeBases.length === 0 ? (
							<div className="text-center py-8 px-4">
								<p className="text-xs text-muted-foreground">No knowledge bases yet</p>
							</div>
						) : (
							knowledgeBases.map((kb) => (
								<button
									key={kb.id}
									onClick={() => handleKnowledgeBaseChange(kb)}
									className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left group relative ${selectedKnowledgeBase?.id === kb.id
										? "bg-primary/10 text-primary font-medium"
										: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
										}`}
								>
									<FolderIcon className={`h-4 w-4 shrink-0 ${selectedKnowledgeBase?.id === kb.id ? "text-primary fill-primary/20" : "text-muted-foreground"
										}`} />
									<span className="truncate flex-1">{kb.name}</span>
									<span className="text-xs opacity-50 tabular-nums">{kb.documents_count}</span>

									{/* Hover Actions */}
									<div className={`absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50 rounded p-0.5 ${selectedKnowledgeBase?.id === kb.id ? "bg-background/50" : ""}`}>
										<TrashIcon
											className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive cursor-pointer"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteKnowledgeBase(kb.id, kb.name);
											}}
										/>
									</div>
								</button>
							))
						)}
					</div>
				</div>

				{/* Main Area (File List) */}
				<div className="flex-1 flex flex-col min-w-0 bg-background">
					{selectedKnowledgeBase ? (
						<>
							{/* Toolbar */}
							<div className="flex items-center gap-4 p-3 border-b shrink-0">
								<div className="flex items-center text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
									<FolderIcon className="h-4 w-4 mr-2 text-muted-foreground/70" />
									<span className="font-medium text-foreground">{selectedKnowledgeBase.name}</span>
									<ChevronRightIcon className="h-4 w-4 mx-2 text-muted-foreground/50" />
									<span>{selectedKnowledgeBase.documents_count} items</span>
									<span className="mx-2 text-muted-foreground/30">•</span>
									<span>{formatFileSize(selectedKnowledgeBase.total_size)}</span>
								</div>

								<div className="ml-auto w-64 max-w-sm">
									<div className="relative">
										<MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Filter documents..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-9 h-8 text-sm"
										/>
									</div>
								</div>
							</div>

							{/* Description Banner (optional) */}
							{selectedKnowledgeBase.description && (
								<div className="px-4 py-2 bg-muted/20 border-b text-xs text-muted-foreground">
									{selectedKnowledgeBase.description}
								</div>
							)}

							{/* File Grid/List */}
							<div className="flex-1 overflow-y-auto">
								{isLoadingDocuments ? (
									<InlineLoader />
								) : documentsError ? (
									<div className="flex flex-col items-center justify-center h-full text-destructive text-sm">
										Failed to load documents
									</div>
								) : documents.length === 0 ? (
									<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
										<div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
											<DocumentTextIcon className="h-6 w-6 opacity-50" />
										</div>
										<p className="text-sm font-medium">This folder is empty</p>
										<p className="text-xs mt-1">Upload files to get started</p>
									</div>
								) : (
									<Table>
										<TableHeader className="bg-muted/5 sticky top-0 z-10">
											<TableRow className="hover:bg-transparent border-b-muted/10">
												<TableHead className="w-[40%] pl-4 h-9 text-xs uppercase tracking-wider font-medium">Name</TableHead>
												<TableHead className="h-9 text-xs uppercase tracking-wider font-medium">Type</TableHead>
												<TableHead className="h-9 text-xs uppercase tracking-wider font-medium">Size</TableHead>
												<TableHead className="h-9 text-xs uppercase tracking-wider font-medium">Date Modified</TableHead>
												<TableHead className="w-[50px] h-9"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{documents
												.filter((doc) =>
													searchQuery === "" ||
													doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
													doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
												)
												.map((doc) => (
													<TableRow key={doc.id} className="group hover:bg-muted/30 border-b-muted/10">
														<TableCell className="pl-4 py-2">
															<div className="flex items-center gap-3">
																<div className="h-8 w-8 rounded bg-background border flex items-center justify-center text-muted-foreground shrink-0 group-hover:border-primary/20 group-hover:text-primary transition-colors">
																	{getTypeIcon(doc.file_type)}
																</div>
																<div className="flex flex-col min-w-0">
																	<span className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
																		{doc.title}
																	</span>
																	{doc.description && (
																		<span className="text-xs text-muted-foreground truncate max-w-[200px]">
																			{doc.description}
																		</span>
																	)}
																</div>
															</div>
														</TableCell>
														<TableCell className="py-2">
															<Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">
																{getFileTypeLabel(doc.file_type)}
															</Badge>
														</TableCell>
														<TableCell className="text-xs text-muted-foreground tabular-nums py-2">
															{formatFileSize(doc.file_size)}
														</TableCell>
														<TableCell className="text-xs text-muted-foreground tabular-nums py-2">
															{new Date(doc.created_at).toLocaleDateString()}
														</TableCell>
														<TableCell className="py-2 pr-2 text-right">
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:text-destructive hover:bg-destructive/10"
																onClick={() => handleDeleteDocument(doc.id, doc.title)}
																title="Delete file"
															>
																<TrashIcon className="h-3.5 w-3.5" />
															</Button>
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								)}
							</div>

							{/* Footer stats */}
							<div className="border-t bg-muted/5 p-2 px-4 text-xs text-muted-foreground flex justify-between shrink-0">
								<span>{documents.length} items</span>
								<span>
									Page {documentsPage + 1}
									{(documents.length === documentsLimit || hasMoreDocuments) && (
										<span className="ml-2 gap-2 inline-flex">
											<button
												disabled={documentsPage === 0}
												onClick={() => setDocumentsPage(Math.max(0, documentsPage - 1))}
												className="hover:text-foreground disabled:opacity-50"
											>
												Prev
											</button>
											<span className="text-muted-foreground/30">|</span>
											<button
												disabled={!hasMoreDocuments}
												onClick={() => setDocumentsPage(documentsPage + 1)}
												className="hover:text-foreground disabled:opacity-50"
											>
												Next
											</button>
										</span>
									)}
								</span>
							</div>
						</>
					) : (
						<div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
							<FolderIcon className="h-16 w-16 mb-4 opacity-20" />
							<p className="text-lg font-medium text-foreground/50">No Knowledge Base Selected</p>
							<p className="text-sm">Select a knowledge base from the sidebar to view files</p>
						</div>
					)}
				</div>
			</div>

			{/* Dialogs - kept the same */}
			<EnhancedUploadDialog
				open={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(false)}
				knowledgeBaseId={selectedKnowledgeBase?.id || ""}
			/>

			<CreateKnowledgeBaseFormDialog
				open={isCreateKnowledgeBaseDialogOpen}
				onClose={() => setIsCreateKnowledgeBaseDialogOpen(false)}
				onCreate={handleCreateKnowledgeBase}
			/>

			<ConfirmationDialog
				isOpen={deleteDocumentDialog.isOpen}
				onClose={() => setDeleteDocumentDialog({ isOpen: false, documentId: null, documentTitle: null })}
				onConfirm={confirmDeleteDocument}
				title="Delete Document"
				message={`Are you sure you want to delete "${deleteDocumentDialog.documentTitle}"? This action cannot be undone.`}
				confirmText="Delete Document"
				isDestructive={true}
				isLoading={deleteDocumentMutation.isPending}
			/>

			<ConfirmationDialog
				isOpen={deleteKnowledgeBaseDialog.isOpen}
				onClose={() => setDeleteKnowledgeBaseDialog({ isOpen: false, knowledgeBaseId: null, knowledgeBaseName: null })}
				onConfirm={confirmDeleteKnowledgeBase}
				title="Delete Knowledge Base"
				message={`Are you sure you want to delete "${deleteKnowledgeBaseDialog.knowledgeBaseName}"? This will permanently delete the knowledge base and all its documents. This action cannot be undone.`}
				confirmText="Delete Knowledge Base"
				isDestructive={true}
				isLoading={deleteKnowledgeBaseMutation.isPending}
			/>
		</div>
	);
}
