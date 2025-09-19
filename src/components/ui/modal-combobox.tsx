"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { useState, useMemo } from "react";

export function ModalCombobox<T extends { id: string }>({
  options,
  value,
  onChange,
  displayValue,
  filterFunction,
  placeholder,
  disabled,
  className,
}: {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  displayValue: (item: T | null) => string;
  filterFunction?: (item: T, query: string) => boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    
    return options.filter((option) => {
      if (filterFunction) {
        return filterFunction(option, query);
      }
      const display = displayValue(option).toLowerCase();
      return display.includes(query.toLowerCase());
    });
  }, [options, query, displayValue, filterFunction]);

  return (
    <Headless.Combobox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Headless.ComboboxInput
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
            className
          )}
          displayValue={(item: T) => item ? displayValue(item) : ""}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
        
        <Headless.ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
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
        </Headless.ComboboxButton>

        <Headless.ComboboxOptions
          className={clsx(
            "absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-lg",
            "bg-white dark:bg-zinc-800",
            "shadow-lg ring-1 ring-black/5 dark:ring-white/10",
            "py-1",
            "focus:outline-none"
          )}
        >
          {filteredOptions.length === 0 && query !== "" ? (
            <div className="relative cursor-default select-none px-4 py-2 text-zinc-500 dark:text-zinc-400">
              No users found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <Headless.ComboboxOption
                key={option.id}
                value={option}
                className={({ active }) =>
                  clsx(
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    active ? "bg-blue-500 text-white" : "text-zinc-900 dark:text-white"
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span className={clsx("block truncate", selected && "font-semibold")}>
                      {displayValue(option)}
                    </span>
                    {selected && (
                      <span
                        className={clsx(
                          "absolute inset-y-0 right-0 flex items-center pr-3",
                          active ? "text-white" : "text-blue-600 dark:text-blue-400"
                        )}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
              </Headless.ComboboxOption>
            ))
          )}
        </Headless.ComboboxOptions>
      </div>
    </Headless.Combobox>
  );
}