import { useState, useEffect } from "react";
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

interface PhoneData {
  id: string;
  phone_number: string;
  verified: boolean;
  is_primary: boolean;
}

interface EditPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, phoneNumber: string, verified: boolean, isPrimary: boolean) => void;
  phoneData: PhoneData | null;
}

export function EditPhoneModal({
  isOpen,
  onClose,
  onSubmit,
  phoneData,
}: EditPhoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verified, setVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update form when phoneData changes
  useEffect(() => {
    if (phoneData) {
      setPhoneNumber(phoneData.phone_number);
      setVerified(phoneData.verified);
      setIsPrimary(phoneData.is_primary);
    }
  }, [phoneData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !phoneData) return;

    setIsLoading(true);
    try {
      await onSubmit(phoneData.id, phoneNumber.trim(), verified, isPrimary);
      onClose();
    } catch (error) {
      console.error("Failed to update phone number:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (phoneData) {
      setPhoneNumber(phoneData.phone_number);
      setVerified(phoneData.verified);
      setIsPrimary(phoneData.is_primary);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Edit Phone Number</DialogTitle>
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
        <Button type="button" outline onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || !phoneNumber.trim()}
        >
          {isLoading ? "Updating..." : "Update Phone"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
