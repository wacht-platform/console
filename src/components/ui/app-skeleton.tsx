import { Card, CardContent, CardFooter, CardHeader } from "./card"
import { Skeleton } from "./skeleton"

export function SkeletonTableRows({
  rows,
  columns,
  withAvatar = false,
}: {
  rows: number
  columns: number
  withAvatar?: boolean
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
  )
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
  )
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
  )
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
  )
}

export function SkeletonProjectCard() {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6 pt-0">
        <div className="mt-2 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/30">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardFooter>
    </Card>
  )
}
