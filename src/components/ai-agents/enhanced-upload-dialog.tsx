import { useState, useRef } from "react";
import { Button } from "../ui/button";
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
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUploadDocument } from "../../lib/api/hooks/use-knowledge-bases";
import { toast } from 'sonner';

interface EnhancedUploadDialogProps {
	open: boolean;
	onClose: () => void;
	knowledgeBaseId: string;
}

export function EnhancedUploadDialog({
	open,
	onClose,
	knowledgeBaseId,
}: EnhancedUploadDialogProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [dragActive, setDragActive] = useState(false);

	const uploadDocumentMutation = useUploadDocument(knowledgeBaseId);

	const resetForm = () => {
		setFiles([]);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (files.length === 0) {
			return;
		}

		const uploadPromise = async () => {
			// Upload multiple files
			for (const file of files) {
				const uploadFormData = new FormData();
				// Extract title from filename (remove extension)
				const title = file.name.replace(/\.[^/.]+$/, "");
				uploadFormData.append("title", title);
				uploadFormData.append("file", file);

				await uploadDocumentMutation.mutateAsync(uploadFormData);
			}
		};

		try {
			await toast.promise(uploadPromise(), {
				loading: files.length === 1 ? "Uploading document..." : `Uploading ${files.length} documents...`,
				success: files.length === 1 ? "Document uploaded successfully!" : `${files.length} documents uploaded successfully!`,
				error: 'Failed to upload documents. Please try again.',
			});
			handleClose();
		} catch (error) {
			console.error("Error uploading:", error);
		}
	};

	const handleFileSelect = (fileList: FileList) => {
		const newFiles = Array.from(fileList);
		console.log('Files selected:', newFiles.map(f => f.name));

		setFiles(prev => [...prev, ...newFiles]);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fileList = e.target.files;
		if (fileList && fileList.length > 0) {
			handleFileSelect(fileList);
		}
	};

	const removeFile = (index: number) => {
		setFiles(prev => prev.filter((_, i) => i !== index));
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

		const fileList = e.dataTransfer.files;
		if (fileList && fileList.length > 0) {
			handleFileSelect(fileList);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const isUploading = uploadDocumentMutation.isPending;

	return (
		<Dialog open={open} onClose={handleClose} size="2xl">
			<form onSubmit={handleSubmit}>
				<DialogBody>
					<DialogTitle>Upload Documents to Knowledge Base</DialogTitle>
					<DialogDescription>
						Upload documents to enhance your AI agent's knowledge. Supported formats include PDF, Markdown, Text, and JSON files
					</DialogDescription>

					<Fieldset className="mt-4">
						<FieldGroup className="space-y-6">
							{/* File Upload */}
							<Field>
								<Label>Files</Label>
								<div
									className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mt-2 ${
										dragActive
											? "border-blue-400 bg-blue-50"
											: "border-gray-300 hover:border-gray-400"
									}`}
									onDragEnter={handleDrag}
									onDragLeave={handleDrag}
									onDragOver={handleDrag}
									onDrop={handleDrop}
								>
									{files.length > 0 ? (
										<div className="space-y-4">
											<div className="flex items-center justify-center">
												<DocumentTextIcon className="h-10 w-10 text-green-500" />
											</div>
											<div className="text-sm font-medium text-gray-900 text-center">
												{files.length === 1 ? "1 document selected" : `${files.length} documents selected`}
											</div>
											<div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
												{files.map((file, index) => (
													<div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
														<div className="flex items-center gap-2 overflow-hidden">
															<DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
															<span className="text-sm truncate font-medium">{file.name}</span>
															<span className="text-xs text-gray-500 flex-shrink-0">({formatFileSize(file.size)})</span>
														</div>
														<Button
															type="button"
															outline
															onClick={() => removeFile(index)}
															className="p-1 h-6 w-6 flex-shrink-0 ml-2 hover:bg-red-50 hover:border-red-200"
														>
															<XMarkIcon className="h-3 w-3 text-red-500" />
														</Button>
													</div>
												))}
											</div>
											<div className="flex justify-between">
												<Button
													type="button"
													outline
													onClick={() => fileInputRef.current?.click()}
												>
													Add More Documents
												</Button>
												<Button
													type="button"
													outline
													onClick={() => setFiles([])}
													className="text-red-600 border-red-200 hover:bg-red-50"
												>
													Clear All
												</Button>
											</div>
										</div>
									) : (
										<div className="space-y-3">
											<div className="flex items-center justify-center">
												<CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
											</div>
											<div>
												<p className="text-sm font-medium text-gray-900">
													Drop files here or click to browse
												</p>
												<p className="text-xs text-gray-500">
													Supports PDF, Markdown, Text, and JSON files
												</p>
											</div>
											<Button
												type="button"
												outline
												onClick={() => fileInputRef.current?.click()}
											>
												Select Documents
											</Button>
										</div>
									)}

									<input
										ref={fileInputRef}
										type="file"
										className="hidden"
										multiple
										accept=".pdf,.md,.markdown,.txt,.json"
										onChange={handleFileInputChange}
									/>
								</div>
							</Field>

						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={handleClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isUploading || files.length === 0}
					>
						{isUploading
							? "Uploading Documents..."
							: files.length === 1
								? "Upload Document"
								: `Upload ${files.length} Documents`
						}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
