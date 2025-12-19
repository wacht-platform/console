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
import { PhotoIcon } from "@heroicons/react/24/outline";
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

    setIsLoading(true);
    try {
      await updateUser({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        username: username.trim() || undefined,
        profile_image: selectedImage || undefined,
        remove_profile_image: shouldRemoveImage || undefined,
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
    <Dialog open={isOpen} onClose={handleClose} size="md">
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image Upload - Centered */}
          <div className="flex flex-col items-center pb-2">
            <div
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-600 dark:hover:border-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PhotoIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {imagePreview ? "Change photo" : "Add photo"}
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

          {/* Name fields - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>First name</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </Field>

            <Field>
              <Label>Last name</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </Field>
          </div>

          <Field>
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
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
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
