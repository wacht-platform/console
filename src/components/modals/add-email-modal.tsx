import { useState } from "react";
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
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Email Address</DialogTitle>
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
                <Switch checked={verified} onCheckedChange={setVerified} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Primary
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set as primary email address
                  </p>
                </div>
                <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
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
            {isLoading ? "Adding..." : "Add Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
