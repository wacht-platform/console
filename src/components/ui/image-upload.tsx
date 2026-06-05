import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/app-spinner";
import { useUploadImage } from "@/lib/api/hooks/use-upload-image";
import { toast } from 'sonner';

import { cn } from "@/lib/utils";

type ImageType = "logo" | "favicon" | "user-profile" | "org-profile" | "workspace-profile";

interface ImageUploadProps {
  label: string;
  imageType: ImageType;
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: "avatar" | "banner";
  shape?: "circle" | "square";
  customUploadHook?: {
    mutateAsync: (file: File) => Promise<string>;
  };
  imageClassName?: string;
}

const validateImageFile = (file: File, imageType?: ImageType): string | null => {
  const maxSize = 2 * 1024 * 1024; // 2MB to match the design
  const generalAllowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const faviconAllowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/gif'];

  if (file.size > maxSize) {
    return 'Image size must be less than 2MB';
  }

  // Use favicon-specific validation for favicon uploads
  if (imageType === 'favicon') {
    if (!faviconAllowedTypes.includes(file.type)) {
      return 'Please select a valid favicon file (.ico, .png, or .gif)';
    }
  } else {
    if (!generalAllowedTypes.includes(file.type)) {
      return 'Please select a valid image file (SVG, PNG, JPG, GIF, or WebP)';
    }
  }

  return null;
};

export function ImageUpload({
  label,
  imageType,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  className = "",
  required = false,
  disabled = false,
  variant = "banner",
  shape = "circle",
  customUploadHook,
  imageClassName,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImageMutation = useUploadImage();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file, imageType);
    if (validationError) {
      toast.error(validationError);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    setIsUploading(true);

    const uploadPromise = customUploadHook
      ? customUploadHook.mutateAsync(file)
      : uploadImageMutation.mutateAsync({
        imageType,
        file,
      });

    toast.promise(uploadPromise, {
      loading: `Uploading ${label.toLowerCase()}...`,
      success: `${label} uploaded successfully!`,
      error: `Failed to upload ${label.toLowerCase()}.`,
    });

    try {
      const imageUrl = await uploadPromise;
      setPreviewUrl(imageUrl);
      onImageUploaded(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (onImageRemoved) {
      onImageRemoved();
    } else {
      // If no onImageRemoved callback, still trigger onImageUploaded with empty string to mark as dirty
      onImageUploaded("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (variant === "avatar") {
    return (
      <Field className={className}>

        <div className="flex items-center space-x-4">
          {/* Avatar Preview */}
          <div className="relative">
            <div
              className={cn(
                "h-16 w-16 cursor-pointer overflow-hidden border border-dashed transition-colors",
                shape === "square" ? "rounded-xl" : "rounded-full",
                isUploading
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-secondary hover:border-muted-foreground/40 hover:bg-accent",
                disabled && "cursor-not-allowed opacity-50",
              )}
              onClick={!disabled ? handleUploadClick : undefined}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`${label} preview`}
                  className={cn("h-full w-full object-cover", imageClassName)}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {isUploading ? (
                    <Spinner className="h-5 w-5 text-primary" />
                  ) : (
                    <PhotoIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
            {previewUrl && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute -top-2 -right-2 z-10 rounded-full border-2 border-background bg-destructive p-1 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Upload Button and Info */}
          <div className="flex-1">
            {!disabled && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="text-sm mb-2"
              >
                {isUploading ? "Uploading…" : previewUrl ? "Change image" : "Upload image"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Recommended: square SVG, PNG, or JPG · max 2MB
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </Field>
    );
  }

  // Banner variant (original design)
  return (
    <Field className={className}>
      <Label>
        {label}{required ? "" : " (optional)"}
      </Label>

      <div className="space-y-3">
        {/* Upload Area */}
        <div
          className={cn(
            "relative h-36 w-full cursor-pointer rounded-lg border border-dashed transition-colors",
            isUploading
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-secondary hover:border-muted-foreground/40 hover:bg-accent",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onClick={!disabled ? handleUploadClick : undefined}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={`${label} preview`}
                className={cn("w-full h-full object-cover rounded-lg", imageClassName)}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              {isUploading ? (
                <>
                  <Spinner className="w-8 h-8 text-primary mb-2" />
                  <div className="text-sm text-primary mb-1">Uploading…</div>
                  <div className="text-xs text-muted-foreground">Please wait</div>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <div className="text-sm text-foreground mb-1">Upload logo</div>
                  <div className="text-xs text-muted-foreground">
                    Recommended: square SVG, PNG, or JPG · max 2MB
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </Field>
  );
}
