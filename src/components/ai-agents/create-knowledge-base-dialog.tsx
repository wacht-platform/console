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
import { useUploadDocument, type KnowledgeBaseDocument } from "../../lib/api/hooks/use-knowledge-bases";

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
	file: File | null;
}

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
		file: null,
	});
	const [dragActive, setDragActive] = useState(false);

	const uploadMutation = useUploadDocument(knowledgeBaseId);
	const isEditing = !!document;

	useEffect(() => {
		if (document) {
			setFormData({
				title: document.title,
				description: document.description || "",
				file: null, // Can't pre-populate file input
			});
		} else {
			setFormData({
				title: "",
				description: "",
				file: null,
			});
		}
	}, [document]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.file && !isEditing) {
			return; // File is required for new uploads
		}

		try {
			if (isEditing) {
				// TODO: Implement document update logic
				console.log("Updating document:", formData);
			} else {
				// Upload new document
				const uploadFormData = new FormData();
				uploadFormData.append("title", formData.title);
				if (formData.description) {
					uploadFormData.append("description", formData.description);
				}
				if (formData.file) {
					uploadFormData.append("file", formData.file);
				}

				await uploadMutation.mutateAsync(uploadFormData);
			}
			onClose();
		} catch (error) {
			console.error("Error uploading document:", error);
		}
	};

	const handleFileSelect = (file: File) => {
		setFormData({ ...formData, file });
		if (!formData.title && file.name) {
			// Auto-populate title from filename
			const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
			setFormData((prev) => ({ ...prev, title: nameWithoutExtension, file }));
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
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

		const file = e.dataTransfer.files?.[0];
		if (
			file &&
			(file.type === "application/pdf" || file.name.endsWith(".md"))
		) {
			handleFileSelect(file);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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
									{formData.file ? (
										<div className="space-y-3">
											<div className="flex items-center justify-center">
												<DocumentTextIcon className="h-10 w-10 text-green-500" />
											</div>
											<div>
												<p className="font-medium text-gray-900">
													{formData.file.name}
												</p>
												<p className="text-sm text-gray-500">
													{formatFileSize(formData.file.size)} •{" "}
													{formData.file.type || "Unknown type"}
												</p>
											</div>
											<Button
												type="button"
												outline
												onClick={() => {
													setFormData({ ...formData, file: null });
													if (fileInputRef.current) {
														fileInputRef.current.value = "";
													}
												}}
											>
												Remove File
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
										accept=".pdf,.md,.markdown"
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
						disabled={(!isEditing && !formData.file) || uploadMutation.isPending}
					>
						{uploadMutation.isPending
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
