import { useState, useRef } from "react";
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
	XMarkIcon,
	LinkIcon,
	PlusIcon,
} from "@heroicons/react/24/outline";
import { useUploadDocument, useUploadUrl } from "../../lib/api/hooks/use-knowledge-bases";

interface EnhancedUploadDialogProps {
	open: boolean;
	onClose: () => void;
	knowledgeBaseId: string;
}

type UploadMode = 'files' | 'urls';

interface UploadData {
	title: string;
	description: string;
	files: File[];
	urls: string[];
}

export function EnhancedUploadDialog({
	open,
	onClose,
	knowledgeBaseId,
}: EnhancedUploadDialogProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadMode, setUploadMode] = useState<UploadMode>('files');
	const [formData, setFormData] = useState<UploadData>({
		title: "",
		description: "",
		files: [],
		urls: [],
	});
	const [currentUrl, setCurrentUrl] = useState('');
	const [dragActive, setDragActive] = useState(false);

	const uploadDocumentMutation = useUploadDocument(knowledgeBaseId);
	const uploadUrlMutation = useUploadUrl(knowledgeBaseId);

	const resetForm = () => {
		setFormData({
			title: "",
			description: "",
			files: [],
			urls: [],
		});
		setCurrentUrl('');
		setUploadMode('files');
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (uploadMode === 'files' && formData.files.length === 0) {
			return;
		}

		if (uploadMode === 'urls' && formData.urls.length === 0) {
			return;
		}

		try {
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
			handleClose();
		} catch (error) {
			console.error("Error uploading:", error);
		}
	};

	const handleFileSelect = (files: FileList) => {
		const newFiles = Array.from(files);
		console.log('Files selected:', newFiles.map(f => f.name));

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

	const removeFile = (index: number) => {
		setFormData(prev => ({
			...prev,
			files: prev.files.filter((_, i) => i !== index)
		}));
	};

	const addUrl = () => {
		if (currentUrl.trim()) {
			setFormData(prev => ({
				...prev,
				urls: [...prev.urls, currentUrl.trim()]
			}));
			setCurrentUrl('');
		}
	};

	const removeUrl = (index: number) => {
		setFormData(prev => ({
			...prev,
			urls: prev.urls.filter((_, i) => i !== index)
		}));
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

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const isUploading = uploadDocumentMutation.isPending || uploadUrlMutation.isPending;

	return (
		<Dialog open={open} onClose={handleClose} size="2xl">
			<form onSubmit={handleSubmit}>
				<DialogBody>
					<DialogTitle>Upload Documents</DialogTitle>
					<DialogDescription>
						Add documents to your knowledge base by uploading files or providing URLs.
					</DialogDescription>

					<Fieldset>
						<FieldGroup className="space-y-6">
							{/* Upload Mode Selector */}
							<Field>
								<Label>Upload Method</Label>
								<div className="flex gap-2 mt-2">
									{uploadMode === 'files' ? (
										<Button
											type="button"
											onClick={() => setUploadMode('files')}
										>
											<DocumentTextIcon className="mr-2 h-4 w-4" />
											Files
										</Button>
									) : (
										<Button
											type="button"
											outline
											onClick={() => setUploadMode('files')}
										>
											<DocumentTextIcon className="mr-2 h-4 w-4" />
											Files
										</Button>
									)}
									{uploadMode === 'urls' ? (
										<Button
											type="button"
											onClick={() => setUploadMode('urls')}
										>
											<LinkIcon className="mr-2 h-4 w-4" />
											URLs
										</Button>
									) : (
										<Button
											type="button"
											outline
											onClick={() => setUploadMode('urls')}
										>
											<LinkIcon className="mr-2 h-4 w-4" />
											URLs
										</Button>
									)}
								</div>
							</Field>

							{/* Title Field */}
							<Field>
								<Label>Title (Optional)</Label>
								<Input
									name="title"
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
									placeholder="Leave empty to auto-generate from file/URL names"
									className="mt-2"
								/>
							</Field>

							{/* Description Field */}
							<Field>
								<Label>Description (Optional)</Label>
								<Textarea
									name="description"
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									rows={3}
									placeholder="Add a description for these documents..."
									className="mt-2"
								/>
							</Field>

							{/* File Upload Mode */}
							{uploadMode === 'files' && (
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
										{formData.files.length > 0 ? (
											<div className="space-y-4">
												<div className="flex items-center justify-center">
													<DocumentTextIcon className="h-10 w-10 text-green-500" />
												</div>
												<div className="text-sm font-medium text-gray-900 text-center">
													{formData.files.length} file(s) selected
												</div>
												<div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
													{formData.files.map((file, index) => (
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
														<PlusIcon className="mr-2 h-4 w-4" />
														Add More Files
													</Button>
													<Button
														type="button"
														outline
														onClick={() => setFormData(prev => ({ ...prev, files: [] }))}
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
														Supports PDF, Markdown, HTML, Text, and JSON files
													</p>
												</div>
												<Button
													type="button"
													outline
													onClick={() => fileInputRef.current?.click()}
												>
													Choose Files
												</Button>
											</div>
										)}

										<input
											ref={fileInputRef}
											type="file"
											className="hidden"
											multiple
											accept=".pdf,.md,.markdown,.html,.htm,.txt,.json"
											onChange={handleFileInputChange}
										/>
									</div>
								</Field>
							)}

							{/* URL Upload Mode */}
							{uploadMode === 'urls' && (
								<Field>
									<Label>URLs</Label>
									<div className="space-y-3 mt-2">
										<div className="flex gap-2">
											<Input
												value={currentUrl}
												onChange={(e) => setCurrentUrl(e.target.value)}
												placeholder="https://example.com/page"
												onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
											/>
											<Button
												type="button"
												outline
												onClick={addUrl}
												disabled={!currentUrl.trim()}
											>
												<PlusIcon className="h-4 w-4" />
											</Button>
										</div>
										
										{formData.urls.length > 0 && (
											<div className="space-y-2 max-h-32 overflow-y-auto">
												{formData.urls.map((url, index) => (
													<div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
														<div className="flex items-center gap-2">
															<LinkIcon className="h-4 w-4 text-gray-500" />
															<span className="text-sm truncate">{url}</span>
														</div>
														<Button
															type="button"
															outline
															onClick={() => removeUrl(index)}
															className="p-1 h-6 w-6"
														>
															<XMarkIcon className="h-3 w-3" />
														</Button>
													</div>
												))}
											</div>
										)}
									</div>
								</Field>
							)}
						</FieldGroup>
					</Fieldset>
				</DialogBody>

				<DialogActions>
					<Button outline onClick={handleClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={
							isUploading ||
							(uploadMode === 'files' && formData.files.length === 0) ||
							(uploadMode === 'urls' && formData.urls.length === 0)
						}
					>
						{isUploading
							? "Uploading..."
							: uploadMode === 'files'
							? `Upload ${formData.files.length} File(s)`
							: `Upload ${formData.urls.length} URL(s)`
						}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
