import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRightIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import type {
    ManageAppListParams,
    ManageAppListResult,
} from "@/lib/api/hooks/use-manage-apps";
import { Pill } from "@/components/ui/pill";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

export interface AppManagerProps<T> {
    useApps: (params: ManageAppListParams) => ManageAppListResult<T>;
    /** Debounced search term, owned by the parent layout. */
    search: string;
    getKey: (row: T) => string;
    getTitle: (row: T) => string;
    getIdentifier: (row: T) => string;
    getActive: (row: T) => boolean;
    getSubtitle?: (row: T) => string | null | undefined;
    /** Navigation target on row click; defaults to getKey. */
    getHref?: (row: T) => string;
    emptyTitle: string;
    emptyMessage: string;
    navigable?: boolean;
    appHeader?: string;
    identifierHeader?: string;
    searchEmptyTitle?: string;
    searchEmptyMessage?: string;
    activeLabel?: string;
    inactiveLabel?: string;
}

export function AppManager<T>({
    useApps,
    search,
    getKey,
    getTitle,
    getIdentifier,
    getActive,
    getSubtitle,
    getHref,
    emptyTitle,
    emptyMessage,
    navigable = true,
    appHeader = "App",
    identifierHeader = "Identifier",
    searchEmptyTitle = "No results found",
    searchEmptyMessage = "Nothing matches that search.",
    activeLabel = "active",
    inactiveLabel = "inactive",
}: AppManagerProps<T>) {
    const navigate = useNavigate();
    const columnCount = navigable ? 4 : 3;
    const [page, setPage] = useState(1);

    // Reset to the first page whenever the search term changes.
    useEffect(() => {
        setPage(1);
    }, [search]);

    const { apps, hasMore, isLoading } = useApps({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
    });

    return (
        <div className="flex flex-col gap-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{appHeader}</TableHead>
                        <TableHead>{identifierHeader}</TableHead>
                        <TableHead>Status</TableHead>
                        {navigable ? <TableHead className="w-10" /> : null}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <SkeletonTableRows
                            rows={8}
                            columns={columnCount}
                            withAvatar={false}
                        />
                    ) : apps.length === 0 ? (
                        <TableEmptyRow
                            colSpan={columnCount}
                            icon={
                                <Squares2X2Icon className="h-8 w-8 text-muted-foreground/50" />
                            }
                            title={search ? searchEmptyTitle : emptyTitle}
                            description={search ? searchEmptyMessage : emptyMessage}
                        />
                    ) : (
                        apps.map((app) => {
                            const subtitle = getSubtitle?.(app);
                            const active = getActive(app);
                            return (
                                <TableRow
                                    key={getKey(app)}
                                    className={
                                        navigable ? "cursor-pointer" : undefined
                                    }
                                    onClick={
                                        navigable
                                            ? () =>
                                                  navigate(
                                                      getHref
                                                          ? getHref(app)
                                                          : getKey(app),
                                                  )
                                            : undefined
                                    }
                                >
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="truncate font-medium text-foreground">
                                                {getTitle(app)}
                                            </span>
                                            {subtitle ? (
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {subtitle}
                                                </span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {getIdentifier(app)}
                                    </TableCell>
                                    <TableCell>
                                        <Pill tone={active ? "ok" : "mute"}>
                                            {active ? activeLabel : inactiveLabel}
                                        </Pill>
                                    </TableCell>
                                    {navigable ? (
                                        <TableCell className="w-10 text-muted-foreground">
                                            <ChevronRightIcon className="size-4" />
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {!isLoading && (page > 1 || hasMore) ? (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Page {page}</p>
                    <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    aria-disabled={page <= 1}
                                    className={
                                        page <= 1
                                            ? "pointer-events-none opacity-50"
                                            : undefined
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage((p) => Math.max(1, p - 1));
                                    }}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    aria-disabled={!hasMore}
                                    className={
                                        !hasMore
                                            ? "pointer-events-none opacity-50"
                                            : undefined
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (hasMore) setPage((p) => p + 1);
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            ) : null}
        </div>
    );
}
