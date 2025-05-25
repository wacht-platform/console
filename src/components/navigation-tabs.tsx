import clsx from "clsx";
import { Link } from "@/components/ui/link";

export interface Tab {
  name: string;
  href?: string;
  current?: boolean;
}

interface NavigationTabsProps {
  tabs: Tab[];
  className?: string;
  onChange?: (tab: Tab) => void;
}

export function NavigationTabs({
  tabs,
  className,
  onChange,
}: NavigationTabsProps) {
  return (
    <div
      className={clsx(
        "border-b border-zinc-200 dark:border-zinc-800",
        className
      )}
    >
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) =>
          tab.href ? (
            <Link
              key={tab.name}
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={clsx(
                tab.current
                  ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200",
                "whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium"
              )}
            >
              {tab.name}
            </Link>
          ) : (
            <button
              key={tab.name}
              onClick={() => onChange?.(tab)}
              className={clsx(
                tab.current
                  ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200",
                "whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium"
              )}
            >
              {tab.name}
            </button>
          )
        )}
      </nav>
    </div>
  );
}
