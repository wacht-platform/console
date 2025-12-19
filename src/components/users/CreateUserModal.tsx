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
import { PhotoIcon } from "@heroicons/react/24/outline";

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
  const [skipChecks, setSkipChecks] = useState(false);
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
    } else if (isPasswordEnabled && password && !skipChecks && authSettings?.password?.min_length) {
      if (password.length < authSettings.password.min_length) {
        newErrors.password = `Password must be at least ${authSettings.password.min_length} characters`;
      }
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
      formData.append('skip_password_check', skipChecks.toString());
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
    setSkipChecks(false);
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

  // Helper to render optional indicator
  const renderLabel = (text: string, required: boolean) => (
    <Label>
      {text}
      {!required && <span className="ml-1 text-zinc-400 dark:text-zinc-500 font-normal">·  optional</span>}
    </Label>
  );

  return (
    <Dialog open={isOpen} onClose={handleClose} size="md">
      <DialogTitle>Create User</DialogTitle>
      <DialogBody>
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">Loading settings...</div>
        ) : (
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
            {(isFirstNameEnabled || isLastNameEnabled) && (
              <div className="grid grid-cols-2 gap-3">
                {isFirstNameEnabled && (
                  <Field>
                    {renderLabel("First name", isFirstNameRequired)}
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <ErrorMessage>{errors.firstName}</ErrorMessage>
                    )}
                  </Field>
                )}

                {isLastNameEnabled && (
                  <Field>
                    {renderLabel("Last name", isLastNameRequired)}
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <ErrorMessage>{errors.lastName}</ErrorMessage>
                    )}
                  </Field>
                )}
              </div>
            )}

            {isEmailEnabled && (
              <Field>
                {renderLabel("Email", isEmailRequired)}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  autoComplete="off"
                />
                {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
              </Field>
            )}

            {isUsernameEnabled && (
              <Field>
                {renderLabel("Username", isUsernameRequired)}
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                />
                {errors.username && (
                  <ErrorMessage>{errors.username}</ErrorMessage>
                )}
              </Field>
            )}

            {isPhoneEnabled && (
              <Field>
                {renderLabel("Phone number", isPhoneRequired)}
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
              </Field>
            )}

            {isPasswordEnabled && (
              <Field>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <ErrorMessage>{errors.password}</ErrorMessage>
                )}
              </Field>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="skipChecks"
                checked={skipChecks}
                onChange={(e) => setSkipChecks(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <label htmlFor="skipChecks" className="text-sm text-zinc-600 dark:text-zinc-400">
                Skip password validation
              </label>
            </div>
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
