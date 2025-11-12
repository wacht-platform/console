import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

export function Stat({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
  showPeriodText?: boolean;
}) {
  const isPositive = change && change.startsWith("+");
  const isNegative = change && change.startsWith("-");
  const hasChange = change && change !== "";

  return (
    <div>
      <div className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      <div className="mt-2 text-3xl font-normal text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        {hasChange ? (
          <>
            {isPositive && (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ArrowUpIcon className="w-4 h-4" />
                <span className="font-normal">{change}</span>
              </div>
            )}
            {isNegative && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <ArrowDownIcon className="w-4 h-4" />
                <span className="font-normal">{change}</span>
              </div>
            )}
            <span className="text-zinc-500 dark:text-zinc-400 font-normal">
              vs last period
            </span>
          </>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500 font-normal">
            No data for comparison
          </span>
        )}
      </div>
    </div>
  );
}
