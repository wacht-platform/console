import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
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
              className={`w-20 h-20 rounded-full border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${isUploading
                ? 'border-blue-300 bg-blue-50'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={!disabled ? handleUploadClick : undefined}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`${label} preview`}
                  className={cn("w-full h-full object-contain", imageClassName)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {isUploading ? (
                    <Spinner className="w-6 h-6 text-blue-500" />
                  ) : (
                    <PhotoIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
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
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg border-2 border-white z-10"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Upload Button and Info */}
          <div className="flex-1">
            {!disabled && (
              <Button
                type="button"
                outline
                onClick={handleUploadClick}
                disabled={isUploading}
                className="text-sm mb-2"
              >
                {isUploading ? "Uploading..." : previewUrl ? "Change Image" : "Upload Image"}
              </Button>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Recommended: Square SVG, PNG, or JPG, max 2MB
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
          className={`relative w-full h-36 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${isUploading
            ? 'border-blue-300 bg-blue-50'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
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
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              {isUploading ? (
                <>
                  <Spinner className="w-8 h-8 text-blue-500 mb-2" />
                  <div className="text-sm text-blue-600 mb-1">Uploading...</div>
                  <div className="text-xs text-gray-500">Please wait</div>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mb-2" />
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Upload logo</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Recommended: Square SVG, PNG, or JPG, max 2MB
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
