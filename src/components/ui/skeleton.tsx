import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }

export function SkeletonTableRows({
  rows,
  columns,
  withAvatar = false,
}: {
  rows: number;
  columns: number;
  withAvatar?: boolean;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="p-3 align-middle [&:has([role=checkbox])]:pr-0">
              {j === 0 && withAvatar ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ) : (
                <Skeleton className="h-4 w-full" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <tbody className="[&_tr:last-child]:border-0">
          <SkeletonTableRows rows={rows} columns={columns} />
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}


