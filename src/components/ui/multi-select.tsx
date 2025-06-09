import { useState } from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Field, Label } from "./fieldset";
import clsx from "clsx";

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOption = (optionId: string) => {
    if (disabled) return;
    
    const newSelectedValues = selectedValues.includes(optionId)
      ? selectedValues.filter(id => id !== optionId)
      : [...selectedValues, optionId];
    
    onChange(newSelectedValues);
  };

  const handleRemoveOption = (optionId: string) => {
    if (disabled) return;
    onChange(selectedValues.filter(id => id !== optionId));
  };

  const selectedOptions = options.filter(option => selectedValues.includes(option.id));

  return (
    <Field className={className}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        {/* Selected values display */}
        <div
          className={clsx(
            "min-h-[2.75rem] w-full rounded-lg border border-zinc-950/10 bg-white px-3 py-2 text-sm",
            "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
            "dark:border-white/10 dark:bg-white/5",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-zinc-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                >
                  {option.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOption(option.id);
                      }}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon
              className={clsx(
                "h-5 w-5 text-zinc-400 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Dropdown options */}
        {isOpen && !disabled && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
            <div className="max-h-60 overflow-auto py-1">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-zinc-500">No options available</div>
              ) : (
                options.map((option) => {
                  const isSelected = selectedValues.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => handleToggleOption(option.id)}
                      className={clsx(
                        "w-full px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-zinc-50 dark:hover:bg-zinc-700",
                        "focus:bg-zinc-50 focus:outline-none dark:focus:bg-zinc-700",
                        isSelected && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
                        option.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{option.name}</div>
                          {option.description && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </Field>
  );
}
