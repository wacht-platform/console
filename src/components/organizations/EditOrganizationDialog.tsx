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
import { PhotoIcon } from "@heroicons/react/24/outline";
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
      if (shouldRemoveImage) {
        formData.append("remove_image", "true");
      } else if (selectedImage) {
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
    <Dialog open={isOpen} onClose={onClose} size="md">
      <DialogTitle>Edit Organization</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Logo - Centered */}
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-600 dark:hover:border-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Organization logo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PhotoIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {imagePreview ? "Change logo" : "Add logo"}
              </button>
              {imagePreview && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
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

          <Field>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
            />
          </Field>

          <Field>
            <Label>
              Description
              <span className="ml-1 text-zinc-400 dark:text-zinc-500 font-normal">·  optional</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the organization..."
              rows={2}
            />
          </Field>
        </form>
      </DialogBody>
      <DialogActions>
        <Button
          outline
          onClick={onClose}
          disabled={updateOrganizationMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={updateOrganizationMutation.isPending}
        >
          {updateOrganizationMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
