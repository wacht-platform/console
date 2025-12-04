import clsx from "clsx";
import type React from "react";
import { createContext, useContext, useState } from "react";
import { Link } from "./link";

const TableContext = createContext<{
  bleed: boolean;
  dense: boolean;
  grid: boolean;
  striped: boolean;
  modern: boolean;
}>({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
  modern: false,
});

export function Table({
  bleed = false,
  dense = false,
  grid = false,
  striped = false,
  modern = true,
  children,
}: {
  bleed?: boolean;
  dense?: boolean;
  grid?: boolean;
  striped?: boolean;
  modern?: boolean;
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <TableContext.Provider
      value={
        { bleed, dense, grid, striped, modern } as React.ContextType<
          typeof TableContext
        >
      }
    >
      <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-700/50">
        <table className="min-w-full bg-white dark:bg-transparent">
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

export function TableHead({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      {...props}
      className={clsx(
        className,
        "border-b border-l border-r border-zinc-200 dark:border-zinc-700/50",
        "bg-zinc-50/50 dark:bg-zinc-800/30",
      )}
    />
  );
}

export function TableBody(props: React.ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props} />;
}

const TableRowContext = createContext<{
  href?: string;
  target?: string;
  title?: string;
}>({
  href: undefined,
  target: undefined,
  title: undefined,
});

export function TableRow({
  href,
  target,
  title,
  className,
  ...props
}: {
  href?: string;
  target?: string;
  title?: string;
} & React.ComponentPropsWithoutRef<"tr">) {
  return (
    <TableRowContext.Provider
      value={
        { href, target, title } as React.ContextType<typeof TableRowContext>
      }
    >
      <tr
        {...props}
        className={clsx(
          className,
          "border-b border-zinc-100/60 dark:border-zinc-700/30 last:border-b-0",
          "even:bg-zinc-50/50 dark:even:bg-zinc-800/20",
          "hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 transition-colors",
          href && "cursor-pointer",
        )}
      />
    </TableRowContext.Provider>
  );
}

export function TableHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...props}
      className={clsx(
        className,
        "px-6 py-2 text-left text-sm font-normal text-zinc-500 dark:text-zinc-400",
        "border-r border-zinc-300/70 dark:border-zinc-700/50 last:border-r-0",
      )}
      style={{ borderRightWidth: "1.5px" }}
    />
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"td">) {
  const { href, target, title } = useContext(TableRowContext);
  const [cellRef, setCellRef] = useState<HTMLElement | null>(null);

  return (
    <td
      ref={href ? setCellRef : undefined}
      {...props}
      className={clsx(
        className,
        "relative px-6 py-2 text-sm text-zinc-900 dark:text-zinc-200",
      )}
    >
      {href && (
        <Link
          data-row-link
          href={href}
          target={target}
          aria-label={title}
          tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
          className="absolute inset-0 focus:outline-hidden"
        />
      )}
      {children}
    </td>
  );
}
