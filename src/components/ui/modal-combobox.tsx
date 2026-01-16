"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ModalCombobox<T extends { id: string }>({
  options,
  value,
  onChange,
  displayValue,
  placeholder = "Select...",
  disabled = false,
  className,
}: {
  options: T[];
  value: T | null;
  onChange: (value: T | null) => void;
  displayValue: (item: T | null) => string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  filterFunction?: (item: T, query: string) => boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? (
            (value as any).flag && (value as any).name ? (
              <div className="flex items-center gap-2 truncate">
                <span>{(value as any).flag}</span>
                <span className="truncate">{(value as any).name}</span>
                {(value as any).dialCode && (
                  <span className="text-muted-foreground ml-1">{(value as any).dialCode}</span>
                )}
              </div>
            ) : displayValue(value)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={displayValue(option)}
                  // Use keywords to help with filtering for complex items like countries
                  keywords={(option as any).name ? [(option as any).name, (option as any).dialCode] : undefined}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {(option as any).flag && (option as any).name ? (
                    <div className="flex items-center gap-2 w-full">
                      <span>{(option as any).flag}</span>
                      <span className="flex-1">{(option as any).name}</span>
                      <span className="text-muted-foreground text-sm">{(option as any).dialCode}</span>
                    </div>
                  ) : (
                    displayValue(option)
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}