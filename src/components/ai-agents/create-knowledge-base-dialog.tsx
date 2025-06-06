import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Field, FieldGroup, Fieldset, Label } from "../ui/fieldset";
import {
	Dialog,
	DialogActions,
	DialogBody,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";
import {
	CloudArrowUpIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useUploadDocument, useUploadUrl, type KnowledgeBaseDocument } from "../../lib/api/hooks/use-knowledge-bases";

interface CreateKnowledgeBaseDialogProps {
	open: boolean;
	onClose: () => void;
	document?: KnowledgeBaseDocument | null;
	deploymentId: string;
	knowledgeBaseId: string;
}

interface KnowledgeBaseFormData {
	title: string;
	description: string;
	files: File[];
	urls: string[];
}

type UploadMode = 'files' | 'urls';

export function CreateKnowledgeBaseDialog({
	open,
	onClose,
	document,
	deploymentId: _deploymentId,
	knowledgeBaseId,
}: CreateKnowledgeBaseDialogProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [formData, setFormData] = useState<KnowledgeBaseFormData>({
		title: "",
		description: "",
		files: [],
		urls: [],
	});
	const [dragActive, setDragActive] = useState(false);
	const [uploadMode, setUploadMode] = useState<UploadMode>('files');


	const uploadDocumentMutation = useUploadDocument(knowledgeBaseId);
	const uploadUrlMutation = useUploadUrl(knowledgeBaseId);
	const isEditing = !!document;

	useEffect(() => {
		if (document) {
			setFormData({
				title: document.title,
				description: document.description || "",
				files: [], // Can't pre-populate file input
				urls: [],
			});
		} else {
			setFormData({
				title: "",
				description: "",
				files: [],
				urls: [],
			});
		}
		setUploadMode('files');
	}, [document]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (uploadMode === 'files' && formData.files.length === 0 && !isEditing) {
			return; // Files are required for new uploads
		}

		if (uploadMode === 'urls' && formData.urls.length === 0 && !isEditing) {
			return; // URLs are required for new uploads
		}

		try {
			if (isEditing) {
				// TODO: Implement document update logic
				console.log("Updating document:", formData);
			} else {
				if (uploadMode === 'files') {
					// Upload multiple files
					for (const file of formData.files) {
						const uploadFormData = new FormData();
						uploadFormData.append("title", formData.title || file.name.replace(/\.[^/.]+$/, ""));
						if (formData.description) {
							uploadFormData.append("description", formData.description);
						}
						uploadFormData.append("file", file);

						await uploadDocumentMutation.mutateAsync(uploadFormData);
					}
				} else {
					// Upload multiple URLs
					for (const url of formData.urls) {
						const urlTitle = formData.title || new URL(url).pathname.split('/').pop() || 'Webpage';
						await uploadUrlMutation.mutateAsync({
							title: urlTitle,
							description: formData.description,
							url: url,
						});
					}
				}
			}
			onClose();
		} catch (error) {
			console.error("Error uploading:", error);
		}
	};

	const handleFileSelect = (files: FileList) => {
		const newFiles = Array.from(files);
		setFormData(prev => ({
			...prev,
			files: [...prev.files, ...newFiles]
		}));

		// Auto-populate title from first filename if empty
		if (!formData.title && newFiles.length > 0) {
			const nameWithoutExtension = newFiles[0].name.replace(/\.[^/.]+$/, "");
			setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileSelect(files);
		}
	};



	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			handleFileSelect(files);
		}
	};



	return (
		<Dialog open={open} onClose={onClose} size="2xl">
			<DialogTitle>
				{isEditing
					? "Edit Knowledge Base Document"
					: "Upload Knowledge Base Document"}
			</DialogTitle>
			<DialogDescription>
				{isEditing
					? "Update the document information and optionally replace the file."
					: "Upload a PDF or Markdown document to add to the knowledge base."}
			</DialogDescription>

			<form onSubmit={handleSubmit}>
				<DialogBody>
					<Fieldset>
						<FieldGroup className="space-y-4">
							<Field>
								<Label>Title</Label>
								<Input
									required
									placeholder="Enter document title"
									value={formData.title}
									onChange={(e) =>
										setFormData({ ...formData, title: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>Description</Label>
								<Textarea
									placeholder="Describe the content of this document"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
								/>
							</Field>

							<Field>
								<Label>{isEditing ? "Replace File (Optional)" : "File"}</Label>
								<div
									className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
											? "border-blue-400 bg-blue-50"
											: "border-gray-300 hover:border-gray-400"
										}`}
									onDragEnter={handleDrag}
									onDragLeave={handleDrag}
									onDragOver={handleDrag}
									onDrop={handleDrop}
								>
									{formData.files.length > 0 ? (
										<div className="space-y-3">
											<div className="flex items-center justify-center">
												<DocumentTextIcon className="h-10 w-10 text-green-500" />
											</div>
											<div>
												<p className="font-medium text-gray-900">
													{formData.files.length} file(s) selected
												</p>
												<p className="text-sm text-gray-500">
													Ready to upload
												</p>
											</div>
											<Button
												type="button"
												outline
												onClick={() => {
													setFormData({ ...formData, files: [] });
													if (fileInputRef.current) {
														fileInputRef.current.value = "";
													}
												}}
											>
												Clear Files
											</Button>
										</div>
									) : (
										<div className="space-y-3">
											<div className="flex items-center justify-center">
												<CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
											</div>
											<div>
												<p className="text-base font-medium text-gray-900">
													Drop your file here, or{" "}
													<button
														type="button"
														className="text-blue-600 hover:text-blue-500"
														onClick={() => fileInputRef.current?.click()}
													>
														browse
													</button>
												</p>
												<p className="text-sm text-gray-500 mt-1">
													Supports PDF and Markdown files up to 10MB
												</p>
											</div>
										</div>
									)}
									<input
										ref={fileInputRef}
										type="file"
										className="hidden"
										accept=".pdf,.md,.markdown,.html,.htm,.txt,.json"
										multiple
										onChange={handleFileInputChange}
									/>
								</div>
							</Field>
						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={(!isEditing && formData.files.length === 0) || uploadDocumentMutation.isPending}
					>
						{uploadDocumentMutation.isPending
							? "Uploading..."
							: isEditing
								? "Update Document"
								: "Upload Document"
						}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
