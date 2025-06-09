import { useState, useEffect, useRef } from "react";
import {
	Dialog,
	DialogTitle,
	DialogBody,
	DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Label } from "@/components/ui/fieldset";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from 'sonner';
import { useUpdateWorkspace } from "@/lib/api/hooks/use-workspace-mutations";

interface EditWorkspaceDialogProps {
	isOpen: boolean;
	onClose: () => void;
	workspace: {
		id: string;
		name: string;
		description: string;
		image_url: string;
		public_metadata: Record<string, unknown>;
		private_metadata: Record<string, unknown>;
	};
}

export function EditWorkspaceDialog({
	isOpen,
	onClose,
	workspace,
}: EditWorkspaceDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const updateWorkspaceMutation = useUpdateWorkspace();

	// Initialize form data when workspace changes
	useEffect(() => {
		if (workspace) {
			setName(workspace.name || "");
			setDescription(workspace.description || "");
			setImagePreview(workspace.image_url || null);
			setSelectedImage(null);
		}
	}, [workspace]);

	// Reset form when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedImage(null);
			setImagePreview(workspace?.image_url || null);
		}
	}, [isOpen, workspace?.image_url]);

	const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error('Please select a valid image file');
				return;
			}

			// Validate file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				toast.error('Image size must be less than 5MB');
				return;
			}

			setSelectedImage(file);
			
			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleRemoveImage = () => {
		setSelectedImage(null);
		setImagePreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Workspace name is required");
			return;
		}

		try {
			const formData = new FormData();

			// Only append fields that have changed
			if (name.trim() !== workspace.name) {
				formData.append('name', name.trim());
			}
			if (description.trim() !== (workspace.description || "")) {
				formData.append('description', description.trim());
			}
			if (selectedImage) {
				formData.append('workspace_image', selectedImage);
			}

			await updateWorkspaceMutation.mutateAsync({
				workspaceId: workspace.id,
				data: formData,
			});
			toast.success("Workspace updated successfully!");
			onClose();
		} catch (error) {
			console.error("Failed to update workspace:", error);
			toast.error("Failed to update workspace. Please try again.");
		}
	};

	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle>Edit Workspace</DialogTitle>

			<DialogBody>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						{/* Workspace Image Upload */}
						<Field>
							<Label>Workspace Logo (optional)</Label>
							<div className="flex items-center space-x-4">
								{/* Avatar Preview */}
								<div
									className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 transition-all duration-200 cursor-pointer overflow-hidden"
									onClick={() => fileInputRef.current?.click()}
								>
									{imagePreview ? (
										<>
											<img
												src={imagePreview}
												alt="Workspace logo preview"
												className="w-full h-full object-cover"
											/>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveImage();
												}}
												className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
											>
												<XMarkIcon className="w-4 h-4" />
											</button>
										</>
									) : (
										<div className="flex flex-col items-center justify-center h-full">
											<PhotoIcon className="w-8 h-8 text-gray-400 mb-1" />
											<span className="text-xs text-gray-500 text-center px-1">
												Click to upload
											</span>
										</div>
									)}
								</div>

								{/* Hidden file input */}
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleImageSelect}
									className="hidden"
								/>

								{/* Upload instructions */}
								<div className="flex-1">
									<p className="text-sm text-gray-600">
										Upload a workspace logo. Recommended size: 200x200px.
									</p>
									<p className="text-xs text-gray-500 mt-1">
										Supports: JPG, PNG, GIF, WEBP (max 5MB)
									</p>
								</div>
							</div>
						</Field>

						{/* Workspace Name */}
						<Field>
							<Label htmlFor="name">Workspace Name *</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter workspace name"
								required
							/>
						</Field>

						{/* Description */}
						<Field>
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Enter workspace description (optional)"
								rows={3}
							/>
						</Field>
					</div>
				</form>
			</DialogBody>

			<DialogActions>
				<Button outline onClick={onClose} disabled={updateWorkspaceMutation.isPending}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={updateWorkspaceMutation.isPending}>
					{updateWorkspaceMutation.isPending ? "Updating..." : "Update Workspace"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
