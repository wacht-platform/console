import { Select } from "@/components/ui/select";
import { CalendarIcon } from "@heroicons/react/24/outline";

export type DateRangeOption = {
  label: string;
  value: string;
  hours: number;
};

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { label: "Last 24 hours", value: "24h", hours: 24 },
  { label: "Last 48 hours", value: "48h", hours: 48 },
  { label: "Last 3 days", value: "3d", hours: 72 },
  { label: "Last 7 days", value: "7d", hours: 168 },
];

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string, hours: number) => void;
  className?: string;
}

export function DateRangeSelector({
  value,
  onChange,
  className = "",
}: DateRangeSelectorProps) {


  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CalendarIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      <Select
        value={value}
        onChange={(newValue) => {
          const option = DATE_RANGE_OPTIONS.find((opt) => opt.value === (newValue as any).target.value);
          if (option) {
            onChange(option.value, option.hours);
          }
        }}
      >
        {DATE_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export { DATE_RANGE_OPTIONS };