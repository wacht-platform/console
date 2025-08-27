import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

export function Stat({
  title,
  value,
  change,
  showPeriodText = true,
}: {
  title: string;
  value: string;
  change: string;
  showPeriodText?: boolean;
}) {
  return (
    <div>
      <Divider />
      <div className="mt-6 text-lg/6 font-medium sm:text-sm/6 text-zinc-900 dark:text-zinc-100">{title}</div>
      <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8 text-zinc-900 dark:text-white">{value}</div>
      <div className="mt-3 text-sm/6 sm:text-xs/6">
        {change ? (
          <Badge color={change.startsWith("+") ? "lime" : "pink"}>{change}</Badge>
        ) : showPeriodText ? (
          <span className="text-zinc-500 dark:text-zinc-400">-</span>
        ) : null}
        {showPeriodText && (
          <>
            {" "}
            <span className="text-zinc-500 dark:text-zinc-400">from previous period</span>
          </>
        )}
      </div>
    </div>
  );
}
