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
import { useInviteUser } from "@/lib/api/hooks/use-deployment-user-mutations";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inviteUserMutation = useInviteUser();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    const days = parseInt(expiryDays, 10);
    if (isNaN(days) || days < 1) {
      newErrors.expiryDays = "Expiry days must be a positive number";
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
      await inviteUserMutation.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        expiry_days: parseInt(expiryDays, 10),
      });

      // Reset form and close modal on success
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setExpiryDays("7");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Invite User</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <ErrorMessage>{errors.firstName}</ErrorMessage>
            )}
          </Field>

          <Field>
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
            {errors.lastName && <ErrorMessage>{errors.lastName}</ErrorMessage>}
          </Field>

          <Field>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </Field>

          <Field>
            <Label>Invitation Expiry (days)</Label>
            <Input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="Enter expiry in days"
              min="1"
            />
            {errors.expiryDays && (
              <ErrorMessage>{errors.expiryDays}</ErrorMessage>
            )}
          </Field>
        </form>
      </DialogBody>
      <DialogActions>
        <Button outline onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={inviteUserMutation.isPending}>
          {inviteUserMutation.isPending ? "Inviting..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
