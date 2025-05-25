import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorMessage } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { useCreateUser } from "@/lib/api/hooks/use-deployment-user-mutations";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUserMutation = useCreateUser();
  const { deploymentSettings, isLoading } = useCurrentDeployemnt();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        phone_number: phone || undefined,
        username: username || undefined,
        password: password || undefined,
      });

      // Reset form and close modal on success
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setUsername("");
    setPassword("");
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
          <div className="text-center py-4">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
