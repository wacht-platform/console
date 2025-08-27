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
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { toast } from 'sonner';
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();
  const { deploymentSettings, isLoading } = useCurrentDeployemnt();

  // Create user mutation using multipart form data
  const createUserMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }

      const response = await apiClient.post(
        `/deployments/${selectedDeployment.id}/users`,
        formData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deployment-users", selectedDeployment?.id],
      });
    },

  });

  // Get auth settings from deployment
  const authSettings = deploymentSettings?.auth_settings;

  // Check if fields are enabled and required
  const isFirstNameEnabled = authSettings?.first_name?.enabled ?? true;
  const isFirstNameRequired = authSettings?.first_name?.required ?? true;

  const isLastNameEnabled = authSettings?.last_name?.enabled ?? true;
  const isLastNameRequired = authSettings?.last_name?.required ?? true;

  const isEmailEnabled = authSettings?.email_address?.enabled ?? true;
  const isEmailRequired = authSettings?.email_address?.required ?? true;

  const isPhoneEnabled = authSettings?.phone_number?.enabled ?? true;
  const isPhoneRequired = authSettings?.phone_number?.required ?? false;

  const isUsernameEnabled = authSettings?.username?.enabled ?? true;
  const isUsernameRequired = authSettings?.username?.required ?? false;

  const isPasswordEnabled = authSettings?.password?.enabled ?? true;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate first name if required
    if (isFirstNameRequired && !firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name if required
    if (isLastNameRequired && !lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Validate email if required
    if (isEmailRequired && !email.trim()) {
      newErrors.email = "Email is required";
    } else if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    // Validate phone if required
    if (isPhoneRequired && !phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    // Validate username if required
    if (isUsernameRequired && !username.trim()) {
      newErrors.username = "Username is required";
    }

    // Validate password if required
    if (isPasswordEnabled && !password && authSettings?.password?.min_length) {
      newErrors.password = `Password must be at least ${authSettings.password.min_length} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setSelectedImage(file);

    // Create preview URL
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
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      if (email) formData.append('email_address', email);
      if (phone) formData.append('phone_number', phone);
      if (username) formData.append('username', username);
      if (password) formData.append('password', password);
      if (selectedImage) formData.append('profile_image', selectedImage);

      await createUserMutation.mutateAsync(formData);

      // Reset form and close modal on success
      toast.success("User created successfully!");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user. Please try again.");
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setUsername("");
    setPassword("");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Create User</DialogTitle>
      <DialogBody>
        {isLoading ? (
          <div className="text-center py-4 text-zinc-600 dark:text-zinc-400">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Image Upload */}
            <Field>
              <Label>Profile Image (optional)</Label>
              <div className="flex items-center space-x-4">
                {/* Avatar Preview */}
                <div
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer overflow-hidden"
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
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 transition-colors shadow-sm"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
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

            {isFirstNameEnabled && (
              <Field>
                <Label>
                  First Name{isFirstNameRequired ? "" : " (optional)"}
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <ErrorMessage>{errors.firstName}</ErrorMessage>
                )}
              </Field>
            )}

            {isLastNameEnabled && (
              <Field>
                <Label>
                  Last Name{isLastNameRequired ? "" : " (optional)"}
                </Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <ErrorMessage>{errors.lastName}</ErrorMessage>
                )}
              </Field>
            )}

            {isEmailEnabled && (
              <Field>
                <Label>Email{isEmailRequired ? "" : " (optional)"}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </Field>
            )}

            {isPhoneEnabled && (
              <Field>
                <Label>
                  Phone Number{isPhoneRequired ? "" : " (optional)"}
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
                {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
              </Field>
            )}

            {isUsernameEnabled && (
              <Field>
                <Label>Username{isUsernameRequired ? "" : " (optional)"}</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
                {errors.username && (
                  <ErrorMessage>{errors.username}</ErrorMessage>
                )}
              </Field>
            )}

            {isPasswordEnabled && (
              <Field>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <ErrorMessage>{errors.password}</ErrorMessage>
                )}
              </Field>
            )}
          </form>
        )}
      </DialogBody>
      <DialogActions>
        <Button outline onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={createUserMutation.isPending}>
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
