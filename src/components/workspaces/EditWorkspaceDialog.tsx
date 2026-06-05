import { useState, useEffect, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
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

	useEffect(() => {
		if (workspace) {
			setName(workspace.name || "");
			setDescription(workspace.description || "");
			setImagePreview(workspace.image_url || null);
			setSelectedImage(null);
		}
	}, [workspace]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedImage(null);
			setImagePreview(workspace?.image_url || null);
		}
	}, [isOpen, workspace?.image_url]);

	const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please select a valid image file");
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			toast.error("Image size must be less than 2MB");
			return;
		}

		setSelectedImage(file);

		const reader = new FileReader();
		reader.onload = (e) => {
			setImagePreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);
	};

	const [shouldRemoveImage, setShouldRemoveImage] = useState(false);

	const handleRemoveImage = () => {
		setSelectedImage(null);
		setImagePreview(null);
		setShouldRemoveImage(true);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
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

			if (name.trim() !== workspace.name) {
				formData.append("name", name.trim());
			}
			if (description.trim() !== (workspace.description || "")) {
				formData.append("description", description.trim());
			}
			if (shouldRemoveImage) {
				formData.append("remove_image", "true");
			} else if (selectedImage) {
				formData.append("workspace_image", selectedImage);
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
		<Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Workspace</DialogTitle>
				</DialogHeader>
				<div className="py-4">
					<form onSubmit={handleSubmit} className="flex flex-col gap-5">
						{/* Workspace Logo - Centered */}
						<div className="flex flex-col items-center">
							<div
								className="size-16 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border bg-secondary transition-colors hover:border-input hover:bg-accent"
								onClick={() => fileInputRef.current?.click()}
							>
								{imagePreview ? (
									<img
										src={imagePreview}
										alt="Workspace logo preview"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="flex items-center justify-center h-full">
										<PhotoIcon className="size-6 text-muted-foreground" />
									</div>
								)}
							</div>
							<div className="mt-1.5 flex items-center gap-2">
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
								>
									{imagePreview ? "Change logo" : "Add logo"}
								</button>
								{imagePreview && (
									<>
										<span className="text-muted-foreground/40">·</span>
										<button
											type="button"
											onClick={handleRemoveImage}
											className="text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
										>
											Remove
										</button>
									</>
								)}
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleImageSelect}
								className="hidden"
							/>
						</div>

						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Engineering Team"
							/>
						</div>

						<div className="space-y-2">
							<Label>
								Description
								<span className="ml-1 font-normal text-muted-foreground">·  optional</span>
							</Label>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="A brief description of the workspace..."
								rows={2}
							/>
						</div>
					</form>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={updateWorkspaceMutation.isPending}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={updateWorkspaceMutation.isPending}>
						{updateWorkspaceMutation.isPending ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
