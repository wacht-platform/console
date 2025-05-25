import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, verified: boolean, isPrimary: boolean) => void;
}

export function AddEmailModal({
  isOpen,
  onClose,
  onSubmit,
}: AddEmailModalProps) {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(email.trim(), verified, isPrimary);
      setEmail("");
      setVerified(false);
      setIsPrimary(false);
      onClose();
    } catch (error) {
      console.error("Failed to add email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setVerified(false);
    setIsPrimary(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Add Email Address</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </Field>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Verified
                </label>
                <p className="text-sm text-gray-500">
                  Mark this email as verified
                </p>
              </div>
              <Switch checked={verified} onChange={setVerified} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Primary
                </label>
                <p className="text-sm text-gray-500">
                  Set as primary email address
                </p>
              </div>
              <Switch checked={isPrimary} onChange={setIsPrimary} />
            </div>
          </div>
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
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? "Adding..." : "Add Email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
