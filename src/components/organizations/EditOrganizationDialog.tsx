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
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EditOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organization: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    public_metadata: Record<string, unknown>;
    private_metadata: Record<string, unknown>;
  };
}

export function EditOrganizationDialog({
  isOpen,
  onClose,
  organization,
}: EditOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  const updateOrganizationMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }

      const response = await apiClient.patch(
        `/deployments/${selectedDeployment.id}/organizations/${organization.id}`,
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizations", selectedDeployment?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", organization.id],
      });
    },
  });

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setDescription(organization.description || "");
      setImagePreview(organization.image_url || null);
      setSelectedImage(null);
    }
  }, [organization]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      const formData = new FormData();

      if (name.trim() !== organization.name) {
        formData.append("name", name.trim());
      }
      if (description.trim() !== (organization.description || "")) {
        formData.append("description", description.trim());
      }
      if (selectedImage) {
        formData.append("organization_image", selectedImage);
      }

      await updateOrganizationMutation.mutateAsync(formData);
      toast.success("Organization updated successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Edit Organization</DialogTitle>

      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Organization Image Upload */}
            <Field>
              <Label>Organization Logo (optional)</Label>
              <div className="flex items-center space-x-4">
                {/* Avatar Preview */}
                <div
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Organization logo preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                    </div>
                  )}
                </div>

                {/* Upload Button and Info */}
                <div className="flex-1">
                  <Button
                    type="button"
                    outline
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm mb-2"
                  >
                    {imagePreview ? "Change Logo" : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Recommended: Square PNG or JPG, max 2MB
                  </p>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </Field>

            <Field>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter organization description"
                rows={3}
              />
            </Field>
          </div>
        </form>
      </DialogBody>

      <DialogActions>
        <Button
          type="button"
          outline
          onClick={onClose}
          disabled={updateOrganizationMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={updateOrganizationMutation.isPending}
        >
          {updateOrganizationMutation.isPending
            ? "Updating..."
            : "Update Organization"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
