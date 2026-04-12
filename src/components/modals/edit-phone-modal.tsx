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
import { Switch } from "@/components/ui/switch"

interface PhoneData {
  id: string;
  phone_number: string;
  verified: boolean;
  is_primary: boolean;
}

interface UserData {
  primary_phone_number_id: string | null;
}

interface EditPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: string,
    phoneNumber: string,
    verified: boolean,
    isPrimary: boolean,
  ) => void;
  phoneData: PhoneData | null;
  userData: UserData | null;
}

export function EditPhoneModal({
  isOpen,
  onClose,
  onSubmit,
  phoneData,
  userData,
}: EditPhoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verified, setVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Only reset form when modal opens or phoneData changes, not when userData updates
  useEffect(() => {
    if (phoneData && userData && isOpen && !hasUserInteracted) {
      setPhoneNumber(phoneData.phone_number);
      setVerified(phoneData.verified);
      setIsPrimary(userData.primary_phone_number_id === phoneData.id);
    }
  }, [phoneData, userData, isOpen, hasUserInteracted]);

  // Reset interaction flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUserInteracted(false);
    }
  }, [isOpen]);

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
    if (phoneData && userData) {
      setPhoneNumber(phoneData.phone_number);
      setVerified(phoneData.verified);
      setIsPrimary(userData.primary_phone_number_id === phoneData.id);
      setHasUserInteracted(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Phone Number</DialogTitle>
        </DialogHeader>

        <div className="py-4">
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
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Verified
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mark this phone number as verified
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
                    {isPrimary && userData?.primary_phone_number_id === phoneData?.id
                      ? "This is the primary phone number"
                      : "Set as primary phone number"}
                  </p>
                </div>
                <Switch
                  checked={isPrimary}
                  disabled={isPrimary && userData?.primary_phone_number_id === phoneData?.id}
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
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? "Updating..." : "Update Phone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
