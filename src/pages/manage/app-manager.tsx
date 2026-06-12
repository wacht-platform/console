import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
    MagnifyingGlassIcon,
    ChevronRightIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";
import type {
    ManageAppListParams,
    ManageAppListResult,
} from "@/lib/api/hooks/use-manage-apps";
import { PageHead } from "@/components/ui/page-head";
import { Input } from "@/components/ui/input";
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

export interface ManagedApp {
    app_slug: string;
    name: string;
    description?: string | null;
    is_active: boolean;
}

export function AppManager({
    useApps,
    eyebrow,
    title,
    sub,
    emptyTitle,
    emptyMessage,
}: {
    useApps: (params: ManageAppListParams) => ManageAppListResult<ManagedApp>;
    eyebrow: string;
    title: string;
    sub: string;
    emptyTitle: string;
    emptyMessage: string;
}) {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    // Debounce the slug search and reset to the first page when it changes.
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const { apps, hasMore, isLoading } = useApps({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow={eyebrow}
                title={title}
                sub={sub}
                actions={
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by slug…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 w-56 bg-secondary pl-8 text-[13px]"
                        />
                    </div>
                }
            />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>App</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <SkeletonTableRows rows={8} columns={4} withAvatar={false} />
                    ) : apps.length === 0 ? (
                        <TableEmptyRow
                            colSpan={4}
                            icon={
                                <Squares2X2Icon className="h-8 w-8 text-muted-foreground/50" />
                            }
                            title={debouncedSearch ? "No apps found" : emptyTitle}
                            description={
                                debouncedSearch
                                    ? "No app matches that slug."
                                    : emptyMessage
                            }
                        />
                    ) : (
                        apps.map((app) => (
                            <TableRow
                                key={app.app_slug}
                                className="cursor-pointer"
                                onClick={() => navigate(app.app_slug)}
                            >
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="truncate font-medium text-foreground">
                                            {app.name}
                                        </span>
                                        {app.description ? (
                                            <span className="truncate text-xs text-muted-foreground">
                                                {app.description}
                                            </span>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {app.app_slug}
                                </TableCell>
                                <TableCell>
                                    <Pill tone={app.is_active ? "ok" : "mute"}>
                                        {app.is_active ? "active" : "inactive"}
                                    </Pill>
                                </TableCell>
                                <TableCell className="w-10 text-muted-foreground">
                                    <ChevronRightIcon className="size-4" />
                                </TableCell>
                            </TableRow>
                        ))
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
