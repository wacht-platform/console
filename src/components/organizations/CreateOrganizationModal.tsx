import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorMessage } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrganizationModal({
  isOpen,
  onClose,
}: CreateOrganizationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  const createOrganizationMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }

      const response = await apiClient.post(
        `/deployments/${selectedDeployment.id}/organizations`,
        formData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizations", selectedDeployment?.id],
      });
    },
  });

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
      newErrors.name = "Organization name is required";
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
      const formData = new FormData();
      formData.append("name", name.trim());
      if (description.trim())
        formData.append("description", description.trim());
      if (selectedImage) formData.append("organization_image", selectedImage);

      await createOrganizationMutation.mutateAsync(formData);

      toast.success("Organization created successfully!");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization. Please try again.");
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
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Create Organization</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label>Organization Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </Field>

          <Field>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter organization description"
              rows={3}
            />
            {errors.description && (
              <ErrorMessage>{errors.description}</ErrorMessage>
            )}
          </Field>
        </form>
      </DialogBody>
      <DialogActions>
        <Button outline onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createOrganizationMutation.isPending}
        >
          {createOrganizationMutation.isPending
            ? "Creating..."
            : "Create Organization"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
