import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/fieldset";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useUpdateUser } from "@/lib/api/hooks/use-update-user";

interface ProfileData {
  first_name?: string;
  last_name?: string;
  username?: string;
  image_url?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData | null;
  userId: string;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profileData,
  userId,
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateUser } = useUpdateUser(userId);

  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.first_name || "");
      setLastName(profileData.last_name || "");
      setUsername(profileData.username || "");
      setImagePreview(profileData.image_url || null);
    }
  }, [profileData]);

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

    setIsLoading(true);
    try {
      await updateUser({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        username: username.trim() || undefined,
        profile_image: selectedImage || undefined,
      });
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (profileData) {
      setFirstName(profileData.first_name || "");
      setLastName(profileData.last_name || "");
      setUsername(profileData.username || "");
      setImagePreview(profileData.image_url || null);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Upload */}
          <Field>
            <Label>Profile Image (optional)</Label>
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
                      alt="Profile preview"
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
                    <PhotoIcon className="w-6 h-6 text-gray-400" />
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
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>First Name</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </Field>

            <Field>
              <Label>Last Name</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </Field>
          </div>

          <Field>
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </Field>
        </form>
      </DialogBody>
      <DialogActions>
        <Button
          type="button"
          outline
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
