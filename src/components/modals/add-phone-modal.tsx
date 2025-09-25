import { useState, Fragment } from "react";
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
import { countries } from "@/lib/constants/countries";
import {
  ComboboxInput,
  ComboboxOptions,
  Combobox,
  ComboboxButton,
  Transition,
  ComboboxOption,
} from "@headlessui/react";
import clsx from "clsx";

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
  const [query, setQuery] = useState("");

  const filteredCountries =
    query === ""
      ? countries
      : countries.filter((country) => {
          const q = query.toLowerCase();
          return (
            country.name.toLowerCase().includes(q) ||
            country.dialCode.includes(q) ||
            country.code.toLowerCase().includes(q)
          );
        });

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
      setQuery("");
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
    setQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Add Phone Number</DialogTitle>
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <Label>Phone Number</Label>
            <div className="flex gap-2">
              <div className="w-32">
                <Combobox
                  value={selectedCountry}
                  onChange={(v) => setSelectedCountry(v!)}
                >
                  <div className="relative">
                    <ComboboxInput
                      className={clsx(
                        "relative block w-full appearance-none rounded-lg",
                        "py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]",
                        "pr-[calc(theme(spacing[10])-1px)] pl-[calc(theme(spacing[3.5])-1px)]",
                        "sm:pr-[calc(theme(spacing[9])-1px)] sm:pl-[calc(theme(spacing[3])-1px)]",
                        "text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white",
                        "border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20",
                        "bg-white dark:bg-white/5",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "disabled:border-zinc-950/20 disabled:opacity-50 dark:disabled:border-white/15",
                      )}
                      displayValue={(country: (typeof countries)[0]) =>
                        country ? country.dialCode : ""
                      }
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search..."
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-5 w-5 text-zinc-400"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M7 7l3 3 3-3m0 6l-3 3-3-3"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </ComboboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      afterLeave={() => setQuery("")}
                    >
                      <ComboboxOptions
                        className={clsx(
                          "absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg",
                          "bg-white dark:bg-zinc-800",
                          "shadow-lg ring-1 ring-black/5 dark:ring-white/10",
                          "py-1",
                          "focus:outline-none",
                        )}
                      >
                        {filteredCountries.length === 0 && query !== "" ? (
                          <div className="relative cursor-default select-none px-4 py-2 text-zinc-500 dark:text-zinc-400">
                            No countries found
                          </div>
                        ) : (
                          filteredCountries.map((country) => (
                            <ComboboxOption
                              key={country.code}
                              value={country}
                              className={({ focus }) =>
                                clsx(
                                  "relative cursor-default select-none py-2 pl-3 pr-9",
                                  focus
                                    ? "bg-blue-500 text-white"
                                    : "text-zinc-900 dark:text-white",
                                )
                              }
                            >
                              {({ focus, selected }) => (
                                <>
                                  <div className="flex items-center">
                                    <span className="block truncate">
                                      {country.dialCode}
                                    </span>
                                  </div>
                                  {selected && (
                                    <span
                                      className={clsx(
                                        "absolute inset-y-0 right-0 flex items-center pr-3",
                                        focus
                                          ? "text-white"
                                          : "text-blue-600 dark:text-blue-400",
                                      )}
                                    >
                                      <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                </>
                              )}
                            </ComboboxOption>
                          ))
                        )}
                      </ComboboxOptions>
                    </Transition>
                  </div>
                </Combobox>
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
              <Switch checked={verified} onChange={setVerified} />
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
