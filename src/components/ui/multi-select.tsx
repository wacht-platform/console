import { Fragment } from "react";
import * as Headless from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
  modal?: boolean; // Add this prop to handle modal context
}

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  modal = false, // Default to false for backward compatibility
}: MultiSelectProps) {
  const handleToggleOption = (optionId: string) => {
    if (disabled) return;

    const newSelectedValues = selectedValues.includes(optionId)
      ? selectedValues.filter((id) => id !== optionId)
      : [...selectedValues, optionId];

    onChange(newSelectedValues);
  };

  const handleRemoveOption = (optionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedValues.filter((id) => id !== optionId));
  };

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.id),
  );

  return (
    <Field className={className}>
      {label && <Label>{label}</Label>}
      <Headless.Combobox
        value={selectedValues}
        onChange={() => {}}
        disabled={disabled}
        multiple
      >
        <div className="relative" data-slot="control">
          <Headless.ComboboxButton
            className={clsx([
              // Basic layout
              "group relative block w-full",
              // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
              "before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm",
              // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
              "dark:before:hidden",
              // Hide default focus styles
              "focus:outline-hidden",
              // Focus ring
              "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset data-focus:after:ring-2 data-focus:after:ring-blue-500",
              // Disabled state
              "data-disabled:opacity-50 data-disabled:before:bg-zinc-950/5 data-disabled:before:shadow-none",
            ])}
          >
            <div
              className={clsx([
                // Basic layout
                "relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",
                // Set minimum height for when no value is selected
                "min-h-11 sm:min-h-9",
                // Horizontal padding
                "pr-[calc(--spacing(7)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pl-[calc(--spacing(3)-1px)]",
                // Typography
                "text-left text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",
                // Border
                "border border-zinc-950/10 group-data-active:border-zinc-950/20 group-data-hover:border-zinc-950/20 dark:border-white/10 dark:group-data-active:border-white/20 dark:group-data-hover:border-white/20",
                // Background color
                "bg-transparent dark:bg-white/5",
                // Invalid state
                "group-data-invalid:border-red-500 group-data-hover:group-data-invalid:border-red-500 dark:group-data-invalid:border-red-600 dark:data-hover:group-data-invalid:border-red-600",
                // Disabled state
                "group-data-disabled:border-zinc-950/20 group-data-disabled:opacity-100 dark:group-data-disabled:border-white/15 dark:group-data-disabled:bg-white/[2.5%] dark:group-data-disabled:data-hover:border-white/15",
              ])}
            >
              {selectedOptions.length === 0 ? (
                <span className="block truncate text-zinc-500 dark:text-zinc-400">
                  {placeholder}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <span
                      key={option.id}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                    >
                      {option.name}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveOption(option.id, e)}
                          className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                          <XMarkIcon className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown arrow matching Listbox */}
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="size-5 stroke-zinc-500 group-data-disabled:stroke-zinc-600 sm:size-4 dark:stroke-zinc-400 forced-colors:stroke-[CanvasText]"
                viewBox="0 0 16 16"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M5.75 10.75L8 13L10.25 10.75"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.25 5.25L8 3L5.75 5.25"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Headless.ComboboxButton>

          <Headless.ComboboxOptions
            transition
            anchor={modal ? undefined : "bottom start"}
            className={clsx(
              modal
                ? [
                    // For modal context - use absolute positioning
                    "absolute left-0 right-0 top-full mt-2 z-[9999]",
                  ]
                : [
                    // For non-modal context - use anchor positioning
                    "[--anchor-gap:8px] [--anchor-padding:--spacing(4)]",
                  ],
              // Base styles
              "w-full scroll-py-1 rounded-xl p-1 select-none",
              // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
              "outline outline-transparent focus:outline-hidden",
              // Handle scrolling when menu won't fit in viewport
              "overflow-y-auto overscroll-contain max-h-60",
              // Popover background
              "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",
              // Shadows
              "ring-1 shadow-lg ring-zinc-950/10 dark:ring-white/10 dark:ring-inset",
              // Transitions
              "transition-opacity duration-100 ease-in data-closed:data-leave:opacity-0 data-transition:pointer-events-none",
            )}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selectedValues.includes(option.id);
                return (
                  <Headless.ComboboxOption
                    key={option.id}
                    value={option.id}
                    disabled={option.disabled}
                    as={Fragment}
                  >
                    {({ focus }) => (
                      <div
                        onClick={() =>
                          !option.disabled && handleToggleOption(option.id)
                        }
                        className={clsx(
                          // Basic layout
                          "group/option grid cursor-default grid-cols-[--spacing(5)_1fr] items-baseline gap-x-2 rounded-lg py-2.5 pr-3.5 pl-2 sm:grid-cols-[--spacing(4)_1fr] sm:py-1.5 sm:pr-3 sm:pl-1.5",
                          // Typography
                          "text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",
                          // Focus
                          focus && "bg-blue-500 text-white",
                          // Forced colors mode
                          "forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText]",
                          // Disabled
                          option.disabled && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <svg
                          className={clsx(
                            "relative size-5 self-center stroke-current sm:size-4",
                            isSelected ? "inline" : "invisible",
                          )}
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 8.5l3 3L12 4"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="col-start-2">
                          <span className="block truncate">{option.name}</span>
                          {option.description && (
                            <span
                              className={clsx(
                                "block text-xs mt-0.5",
                                focus
                                  ? "text-white/80"
                                  : "text-zinc-500 dark:text-zinc-400",
                              )}
                            >
                              {option.description}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </Headless.ComboboxOption>
                );
              })
            )}
          </Headless.ComboboxOptions>
        </div>
      </Headless.Combobox>
    </Field>
  );
}
