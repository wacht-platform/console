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

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    phoneNumber: string,
    verified: boolean,
    isPrimary: boolean
  ) => void;
}

export function AddPhoneModal({
  isOpen,
  onClose,
  onSubmit,
}: AddPhoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verified, setVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(phoneNumber.trim(), verified, isPrimary);
      setPhoneNumber("");
      setVerified(false);
      setIsPrimary(false);
      onClose();
    } catch (error) {
      console.error("Failed to add phone number:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber("");
    setVerified(false);
    setIsPrimary(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Add Phone Number</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
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
                  Mark this phone number as verified
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
                  Set as primary phone number
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
          disabled={isLoading || !phoneNumber.trim()}
        >
          {isLoading ? "Adding..." : "Add Phone"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
