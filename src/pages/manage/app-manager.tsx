import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronRightIcon,
    Squares2X2Icon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { PageHead } from "@/components/ui/page-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
    kind,
    apps,
    loading,
    eyebrow,
    title,
    sub,
    emptyTitle,
    emptyMessage,
}: {
    kind: "api-auth" | "webhook";
    apps: ManagedApp[];
    loading: boolean;
    eyebrow: string;
    title: string;
    sub: string;
    emptyTitle: string;
    emptyMessage: string;
}) {
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const selected = params.get("app");
    const selectedApp = apps.find((a) => a.app_slug === selected) ?? null;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return apps;
        return apps.filter((app) =>
            `${app.name} ${app.app_slug} ${app.description ?? ""}`
                .toLowerCase()
                .includes(term),
        );
    }, [apps, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const selectApp = (slug: string) => {
        const next = new URLSearchParams(params);
        next.set("app", slug);
        setParams(next);
    };

    const clearSelection = () => {
        const next = new URLSearchParams(params);
        next.delete("app");
        setParams(next);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow={eyebrow}
                title={title}
                sub={sub}
                actions={
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <FunnelIcon className="size-4" />
                                Filter
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-64 p-3">
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search apps…"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 bg-secondary pl-8 text-[13px]"
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
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
                    {loading ? (
                        <SkeletonTableRows rows={8} columns={4} withAvatar={false} />
                    ) : paged.length === 0 ? (
                        <TableEmptyRow
                            colSpan={4}
                            icon={
                                <Squares2X2Icon className="h-8 w-8 text-muted-foreground/50" />
                            }
                            title={search ? "No apps found" : emptyTitle}
                            description={
                                search ? "Try adjusting your search." : emptyMessage
                            }
                        />
                    ) : (
                        paged.map((app) => (
                            <TableRow
                                key={app.app_slug}
                                className="cursor-pointer"
                                data-state={
                                    app.app_slug === selected ? "selected" : undefined
                                }
                                onClick={() => selectApp(app.app_slug)}
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

            {!loading && filtered.length > PAGE_SIZE ? (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                        {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                        {filtered.length}
                    </p>
                    <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    aria-disabled={currentPage <= 1}
                                    className={
                                        currentPage <= 1
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
                                <span className="px-2 text-xs text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    aria-disabled={currentPage >= totalPages}
                                    className={
                                        currentPage >= totalPages
                                            ? "pointer-events-none opacity-50"
                                            : undefined
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage((p) => Math.min(totalPages, p + 1));
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            ) : null}

            {selectedApp ? (
                <div className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                                {selectedApp.name}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                                {selectedApp.app_slug}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={clearSelection}
                        >
                            <XMarkIcon className="size-3.5" />
                            Close
                        </Button>
                    </div>
                    <div className="min-h-[600px]">
                        <VanityEmbedShell kind={kind} appSlug={selectedApp.app_slug} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
