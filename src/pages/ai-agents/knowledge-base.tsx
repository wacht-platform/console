import { useState, useEffect } from "react";
import {
	MagnifyingGlassIcon,
	DocumentTextIcon,
	TrashIcon,
	PlusIcon,
	Square3Stack3DIcon,
	BookOpenIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PageHead } from "@/components/ui/page-head";
import { Tag } from "../../components/ui/tag";
import { Pill, type PillTone } from "@/components/ui/pill";
import { InlineLoader } from "../../components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { EnhancedUploadDialog } from "../../components/ai-agents/enhanced-upload-dialog";
import { CreateKnowledgeBaseFormDialog } from "../../components/ai-agents/create-knowledge-base-form-dialog";
import { ConfirmationDialog } from "../../components/modals/confirmation-dialog";
import { cn } from "@/lib/utils";
import {
	useKnowledgeBases,
	useKnowledgeBaseDocuments,
	useDeleteKnowledgeBase,
	useDeleteDocument,
	useCreateKnowledgeBase,
	type KnowledgeBase,
	type KnowledgeBaseDocument,
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

// Derive an indexing status from the document's processing metadata. Falls back
// to "indexed" when the backend doesn't surface an explicit status.
function getDocStatus(doc: KnowledgeBaseDocument): {
	tone: PillTone;
	label: string;
} {
	const raw = String(
		(doc.processing_metadata as { status?: unknown } | undefined)?.status ??
			"",
	).toLowerCase();
	if (raw.includes("fail") || raw.includes("error"))
		return { tone: "err", label: "failed" };
	if (raw && !["indexed", "completed", "done", "ready"].includes(raw))
		return { tone: "info", label: "indexing" };
	return { tone: "ok", label: "indexed" };
}

export default function KnowledgeBasePage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isCreateKnowledgeBaseDialogOpen, setIsCreateKnowledgeBaseDialogOpen] =
		useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [kbFilter, setKbFilter] = useState("");
	const [selectedKnowledgeBase, setSelectedKnowledgeBase] =
		useState<KnowledgeBase | null>(null);
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
			const stillExists = knowledgeBases.find(
				(kb) => kb.id === selectedKnowledgeBase.id,
			);
			if (!stillExists) {
				setSelectedKnowledgeBase(knowledgeBases[0]);
			}
		} else if (selectedKnowledgeBase && knowledgeBases.length === 0) {
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
	} = useKnowledgeBaseDocuments(selectedKnowledgeBase?.id || "", {
		limit: documentsLimit,
		offset: documentsPage * documentsLimit,
	});

	const documents = documentsResponse?.documents || [];
	const hasMoreDocuments = documentsResponse?.hasMore || false;

	const deleteKnowledgeBaseMutation = useDeleteKnowledgeBase();
	const deleteDocumentMutation = useDeleteDocument(
		selectedKnowledgeBase?.id || "",
	);
	const createKnowledgeBaseMutation = useCreateKnowledgeBase();

	const handleCreateDocument = () => {
		setIsCreateDialogOpen(true);
	};

	const handleDeleteDocument = (documentId: string, documentTitle: string) => {
		setDeleteDocumentDialog({ isOpen: true, documentId, documentTitle });
	};

	const handleDeleteKnowledgeBase = (
		knowledgeBaseId: string,
		knowledgeBaseName: string,
	) => {
		setDeleteKnowledgeBaseDialog({
			isOpen: true,
			knowledgeBaseId,
			knowledgeBaseName,
		});
	};

	const confirmDeleteDocument = async () => {
		if (!deleteDocumentDialog.documentId) return;
		try {
			await deleteDocumentMutation.mutateAsync(
				deleteDocumentDialog.documentId,
			);
			setDeleteDocumentDialog({
				isOpen: false,
				documentId: null,
				documentTitle: null,
			});
		} catch (error) {
			console.error("Error deleting document:", error);
		}
	};

	const confirmDeleteKnowledgeBase = async () => {
		if (!deleteKnowledgeBaseDialog.knowledgeBaseId) return;
		try {
			await deleteKnowledgeBaseMutation.mutateAsync(
				deleteKnowledgeBaseDialog.knowledgeBaseId,
			);
			setDeleteKnowledgeBaseDialog({
				isOpen: false,
				knowledgeBaseId: null,
				knowledgeBaseName: null,
			});
			if (
				selectedKnowledgeBase?.id ===
				deleteKnowledgeBaseDialog.knowledgeBaseId
			) {
				setSelectedKnowledgeBase(null);
			}
		} catch (error) {
			console.error("Error deleting knowledge base:", error);
		}
	};

	const handleCreateKnowledgeBase = async (
		name: string,
		description?: string,
	) => {
		try {
			const newKnowledgeBase =
				await createKnowledgeBaseMutation.mutateAsync({
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
			<div className="py-12 text-center">
				<p className="text-destructive">Error loading knowledge bases</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{knowledgeBasesError.message}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<PageHead
				eyebrow="Agents platform"
				title="Knowledge base"
				sub="Documents and sources your agents can search and retrieve from."
				actions={
					<>
						<Button
							variant="outline"
							onClick={() =>
								setIsCreateKnowledgeBaseDialogOpen(true)
							}
						>
							<Square3Stack3DIcon className="mr-2 h-4 w-4" />
							New knowledge base
						</Button>
						<Button
							onClick={handleCreateDocument}
							disabled={!selectedKnowledgeBase}
						>
							<PlusIcon className="mr-2 h-4 w-4" />
							Upload file
						</Button>
					</>
				}
			/>

			<div className="grid min-h-[560px] grid-cols-[264px_1fr] overflow-hidden rounded-lg border border-border bg-card">
				{/* Sidebar — list of knowledge bases */}
				<aside className="flex flex-col border-r border-border">
					<div className="flex h-[52px] items-center justify-between gap-2 border-b border-border px-4">
						<span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
							Knowledge bases
						</span>
						<span className="font-mono text-[11px] text-muted-foreground/70">
							{knowledgeBases.length}
						</span>
					</div>
					<div className="relative px-4 pb-2 pt-3">
						<MagnifyingGlassIcon className="pointer-events-none absolute left-[26px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search…"
							value={kbFilter}
							onChange={(e) => setKbFilter(e.target.value)}
							className="h-8 pl-[30px] text-sm"
						/>
					</div>
					<div className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-1">
						{knowledgeBases.length === 0 ? (
							<EmptyState
								compact
								icon={<Square3Stack3DIcon />}
								title="No knowledge bases"
								description="Create one to group documents that share retrieval settings."
								actionLabel="New knowledge base"
								onAction={() =>
									setIsCreateKnowledgeBaseDialogOpen(true)
								}
							/>
						) : (
							knowledgeBases
								.filter(
									(kb) =>
										kbFilter === "" ||
										kb.name
											.toLowerCase()
											.includes(kbFilter.toLowerCase()),
								)
								.map((kb) => {
									const active =
										selectedKnowledgeBase?.id === kb.id;
									return (
										<button
											key={kb.id}
											onClick={() =>
												handleKnowledgeBaseChange(kb)
											}
											className={cn(
												"group relative flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-colors",
												active
													? "bg-primary/10 font-medium text-primary"
													: "text-muted-foreground hover:bg-accent hover:text-foreground",
											)}
										>
											<Square3Stack3DIcon
												className={cn(
													"h-[15px] w-[15px] shrink-0",
													active
														? "opacity-100"
														: "opacity-75",
												)}
											/>
											<span className="flex-1 truncate">
												{kb.name}
											</span>
											<span
												className={cn(
													"font-mono text-[11px] tabular-nums",
													active
														? "text-primary"
														: "text-muted-foreground/70",
												)}
											>
												{kb.documents_count}
											</span>
											<span className="absolute right-1.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
												<TrashIcon
													className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-destructive"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteKnowledgeBase(
															kb.id,
															kb.name,
														);
													}}
												/>
											</span>
										</button>
									);
								})
						)}
					</div>
				</aside>

				{/* Main area — selected KB's documents */}
				<div className="flex min-w-0 flex-col">
					{selectedKnowledgeBase ? (
						<>
							{/* breadcrumb + filter row */}
							<div className="flex h-[52px] items-center gap-3.5 border-b border-border px-4">
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<Square3Stack3DIcon className="h-[15px] w-[15px] shrink-0 text-muted-foreground" />
									<span className="truncate text-[13px] font-medium text-foreground">
										{selectedKnowledgeBase.name}
									</span>
									<span className="size-1 shrink-0 rounded-full bg-muted-foreground/50" />
									<span className="whitespace-nowrap font-mono text-[12px] text-muted-foreground">
										{selectedKnowledgeBase.documents_count}{" "}
										items ·{" "}
										{formatFileSize(
											selectedKnowledgeBase.total_size,
										)}
									</span>
								</div>
								<div className="relative w-60 shrink-0">
									<MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Filter documents…"
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className="h-8 pl-8 text-sm"
									/>
								</div>
							</div>

							{/* documents table */}
							<div className="flex-1 overflow-y-auto">
								{isLoadingDocuments ? (
									<InlineLoader />
								) : documentsError ? (
									<div className="flex h-full flex-col items-center justify-center text-sm text-destructive">
										Failed to load documents
									</div>
								) : documents.length === 0 ? (
									<EmptyState
										className="h-full justify-center"
										icon={<DocumentTextIcon />}
										title="This folder is empty"
										description="Upload files to start building this knowledge base."
										actionLabel="Upload file"
										onAction={handleCreateDocument}
									/>
								) : (
									<table className="w-full caption-bottom text-[13px]">
										<thead className="sticky top-0 z-10 bg-secondary">
											<tr className="border-b border-border">
												<th className="h-9 px-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
													Name
												</th>
												<th className="h-9 w-[90px] px-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
													Type
												</th>
												<th className="h-9 w-[110px] px-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
													Size
												</th>
												<th className="h-9 w-[120px] px-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
													Status
												</th>
												<th className="h-9 w-[150px] px-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
													Date modified
												</th>
												<th className="h-9 w-[72px] px-4"></th>
											</tr>
										</thead>
										<tbody>
											{documents
												.filter(
													(doc) =>
														searchQuery === "" ||
														doc.title
															.toLowerCase()
															.includes(
																searchQuery.toLowerCase(),
															) ||
														doc.description
															?.toLowerCase()
															.includes(
																searchQuery.toLowerCase(),
															),
												)
												.map((doc) => {
													const status =
														getDocStatus(doc);
													return (
														<tr
															key={doc.id}
															className="group border-b border-border transition-colors last:border-0 hover:bg-accent"
														>
															<td className="px-4 py-2.5">
																<div className="flex items-center gap-2.5">
																	<span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:text-primary">
																		{getTypeIcon(
																			doc.file_type,
																		)}
																	</span>
																	<div className="flex min-w-0 flex-col">
																		<span className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
																			{
																				doc.title
																			}
																		</span>
																		{doc.description && (
																			<span className="max-w-[280px] truncate text-xs text-muted-foreground">
																				{
																					doc.description
																				}
																			</span>
																		)}
																	</div>
																</div>
															</td>
															<td className="px-3.5 py-2.5">
																<Tag>
																	{getFileTypeLabel(
																		doc.file_type,
																	)}
																</Tag>
															</td>
															<td className="px-3.5 py-2.5 font-mono text-[12px] tabular-nums text-muted-foreground">
																{formatFileSize(
																	doc.file_size,
																)}
															</td>
															<td className="px-3.5 py-2.5">
																<Pill
																	tone={
																		status.tone
																	}
																>
																	{status.label}
																</Pill>
															</td>
															<td className="px-3.5 py-2.5 font-mono text-[12px] tabular-nums text-muted-foreground">
																{new Date(
																	doc.created_at,
																).toLocaleDateString()}
															</td>
															<td className="px-4 py-2.5 text-right">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
																	onClick={() =>
																		handleDeleteDocument(
																			doc.id,
																			doc.title,
																		)
																	}
																	title="Delete file"
																>
																	<TrashIcon className="h-3.5 w-3.5" />
																</Button>
															</td>
														</tr>
													);
												})}
										</tbody>
									</table>
								)}

								{documents.length > 0 && (
									<button
										type="button"
										onClick={handleCreateDocument}
										className="mx-4 my-3.5 flex w-[calc(100%-2rem)] items-center justify-center gap-2.5 rounded-md border border-dashed border-input px-4 py-3 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
									>
										<span className="grid size-[26px] shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground">
											<PlusIcon className="h-3.5 w-3.5" />
										</span>
										<span className="text-[12px]">
											Drag & drop files here, or{" "}
											<span className="font-medium text-primary">
												browse
											</span>
										</span>
										<span className="font-mono text-[11px] text-muted-foreground/70">
											PDF · DOCX · TXT · MD · CSV · max 25
											MB
										</span>
									</button>
								)}
							</div>

							{/* footer */}
							<div className="flex h-11 items-center justify-between border-t border-border bg-secondary px-4 font-mono text-[11px] text-muted-foreground">
								<span>{documents.length} items</span>
								<span className="flex items-center gap-2">
									Page {documentsPage + 1}
									{(documents.length === documentsLimit ||
										hasMoreDocuments) && (
										<span className="inline-flex gap-2">
											<button
												disabled={documentsPage === 0}
												onClick={() =>
													setDocumentsPage(
														Math.max(
															0,
															documentsPage - 1,
														),
													)
												}
												className="hover:text-foreground disabled:opacity-50"
											>
												Prev
											</button>
											<span className="text-muted-foreground/30">
												|
											</span>
											<button
												disabled={!hasMoreDocuments}
												onClick={() =>
													setDocumentsPage(
														documentsPage + 1,
													)
												}
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
						<div className="flex h-full flex-col items-center justify-center p-12">
							<EmptyState
								icon={<Square3Stack3DIcon />}
								title="No knowledge base selected"
								description="Create or select a knowledge base from the sidebar to view its files and indexing status."
								actionLabel="New knowledge base"
								onAction={() =>
									setIsCreateKnowledgeBaseDialogOpen(true)
								}
							/>
							<div className="mt-4 max-w-[460px] rounded-md border border-border bg-secondary px-3.5 py-2.5 text-left font-mono text-[11px] leading-6 text-muted-foreground">
								<span className="font-medium text-foreground">
									tip
								</span>
								<br />
								Knowledge bases use the embeddings model from
								Configuration. Switch providers there before
								bulk-indexing.
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Dialogs */}
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
				onClose={() =>
					setDeleteDocumentDialog({
						isOpen: false,
						documentId: null,
						documentTitle: null,
					})
				}
				onConfirm={confirmDeleteDocument}
				title="Delete Document"
				message={`Are you sure you want to delete "${deleteDocumentDialog.documentTitle}"? This action cannot be undone.`}
				confirmText="Delete Document"
				isDestructive={true}
				isLoading={deleteDocumentMutation.isPending}
			/>

			<ConfirmationDialog
				isOpen={deleteKnowledgeBaseDialog.isOpen}
				onClose={() =>
					setDeleteKnowledgeBaseDialog({
						isOpen: false,
						knowledgeBaseId: null,
						knowledgeBaseName: null,
					})
				}
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
