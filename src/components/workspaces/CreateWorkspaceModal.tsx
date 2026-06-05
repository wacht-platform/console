import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Assuming shadcn Label exists or use standard
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useCreateWorkspace } from "@/lib/api/hooks/use-workspace-mutations";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { selectedDeployment } = useProjects();
  const createWorkspaceMutation = useCreateWorkspace(organizationId);

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

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Workspace name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Upload image first if selected, then create workspace with image URL
      let imageUrl: string | undefined;

      if (selectedImage && selectedDeployment) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("type", "workspace-profile");

        try {
          const response = await apiClient.post(
            `/deployments/${selectedDeployment.id}/upload-image`,
            formData
          );
          imageUrl = response.data.url;
        } catch (error) {
          console.error("Failed to upload image:", error);
          // Continue without image
        }
      }

      await createWorkspaceMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl,
      });

      toast.success("Workspace created successfully!");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Workspace Logo - Centered */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-border bg-secondary hover:bg-secondary transition-all duration-200 cursor-pointer overflow-hidden"
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
                    <PhotoIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary hover:text-primary dark:text-primary dark:hover:text-primary font-medium"
                >
                  {imagePreview ? "Change logo" : "Add logo"}
                </button>
                {imagePreview && (
                  <>
                    <span className="text-muted-foreground dark:text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
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
              <Label>Organization</Label>
              <div className="px-3 py-2 bg-secondary border border-border dark:border-border rounded-md text-sm text-muted-foreground">
                {organizationName}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering Team"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Description
                <span className="ml-1 text-muted-foreground font-normal">·  optional</span>
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
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createWorkspaceMutation.isPending}
          >
            {createWorkspaceMutation.isPending
              ? "Creating..."
              : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
