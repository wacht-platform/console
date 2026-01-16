import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";

interface EmailData {
  id: string;
  email: string;
  verified: boolean;
  is_primary: boolean;
}

interface UserData {
  primary_email_address_id: string | null;
}

interface EditEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: string,
    email: string,
    verified: boolean,
    isPrimary: boolean,
  ) => void;
  emailData: EmailData | null;
  userData: UserData | null;
}

export function EditEmailModal({
  isOpen,
  onClose,
  onSubmit,
  emailData,
  userData,
}: EditEmailModalProps) {
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Only reset form when modal opens or emailData changes, not when userData updates
  useEffect(() => {
    if (emailData && userData && isOpen && !hasUserInteracted) {
      setEmail(emailData.email);
      setVerified(emailData.verified);
      setIsPrimary(userData.primary_email_address_id === emailData.id);
    }
  }, [emailData, userData, isOpen, hasUserInteracted]);

  // Reset interaction flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUserInteracted(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !emailData) return;

    setIsLoading(true);
    try {
      await onSubmit(emailData.id, email.trim(), verified, isPrimary);
      onClose();
    } catch (error) {
      console.error("Failed to update email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (emailData && userData) {
      setEmail(emailData.email);
      setVerified(emailData.verified);
      setIsPrimary(userData.primary_email_address_id === emailData.id);
      setHasUserInteracted(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Email Address</DialogTitle>
        </DialogHeader>

        <div className="py-4">
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
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Verified
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mark this email as verified
                  </p>
                </div>
                <Switch checked={verified} onCheckedChange={(c) => setVerified(c)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Primary
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isPrimary && userData?.primary_email_address_id === emailData?.id
                      ? "This is the primary email address"
                      : "Set as primary email address"}
                  </p>
                </div>
                <Switch
                  checked={isPrimary}
                  disabled={isPrimary && userData?.primary_email_address_id === emailData?.id}
                  onCheckedChange={(checked) => {
                    setIsPrimary(checked);
                    setHasUserInteracted(true);
                  }}
                />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
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
            {isLoading ? "Updating..." : "Update Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
