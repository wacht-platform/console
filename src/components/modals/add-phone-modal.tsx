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
import { countries } from "@/lib/constants/countries";
import { SimpleCombobox } from "@/components/ui/simple-combobox";

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    phoneNumber: string,
    countryCode: string,
    verified: boolean,
    isPrimary: boolean,
  ) => void;
}

export function AddPhoneModal({
  isOpen,
  onClose,
  onSubmit,
}: AddPhoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((c) => c.dialCode === "+1") || countries[0],
  );
  const [verified, setVerified] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    try {
      onSubmit(
        phoneNumber.trim(),
        selectedCountry.dialCode,
        verified,
        isPrimary,
      );
      setPhoneNumber("");
      setSelectedCountry(
        countries.find((c) => c.dialCode === "+1") || countries[0],
      );
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
    setSelectedCountry(
      countries.find((c) => c.dialCode === "+1") || countries[0],
    );
    setVerified(false);
    setIsPrimary(false);
    onClose();
  };

  const countryOptions = countries.map((c) => ({
    value: c,
    label: `${c.flag} ${c.dialCode}`,
    keywords: [c.name, c.dialCode, c.code],
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Phone Number</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field>
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <div className="w-32">
                  <SimpleCombobox
                    options={countryOptions}
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                    renderItem={(option: { value: typeof selectedCountry; label: string; keywords?: string[] }) => (
                      <div className="flex items-center gap-2">
                        <span>{option.value.flag}</span>
                        <span className="text-muted-foreground">{option.value.dialCode}</span>
                      </div>
                    )}
                    placeholder="Code"
                  />
                </div>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1"
                  required
                />
              </div>
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
                <Switch checked={verified} onCheckedChange={setVerified} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Primary
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set as primary phone number
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
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? "Adding..." : "Add Phone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

