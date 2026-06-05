import { useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { Input } from "@/components/ui/input";
import { PageHead } from "@/components/ui/page-head";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSegments } from "@/lib/api/hooks/use-segments";
import { CreateSegmentModal } from "@/components/segments/CreateSegmentModal";
import { Segment } from "@/types/segment";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { format } from "date-fns";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    CheckIcon,
    PlusIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { IconUser, IconBuilding, IconBriefcase } from "@tabler/icons-react";

const SORT_OPTIONS = [
    ["created_at-desc", "Newest first"],
    ["created_at-asc", "Oldest first"],
    ["name-asc", "Name (A–Z)"],
    ["name-desc", "Name (Z–A)"],
] as const;

export function SegmentsManageTab() {
    const navigate = useNavigate();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [segmentToEdit, setSegmentToEdit] = useState<Segment | null>(null);

    const [sortKey, setSortKey] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 500);

    const {
        data: segments,
        isLoading,
        isError,
    } = useSegments({
        search: debouncedSearch,
        sort_key: sortKey,
        sort_order: sortOrder,
    });

    const handleCreate = () => {
        setSegmentToEdit(null);
        setCreateModalOpen(true);
    };

    const handleSortChange = (value: string) => {
        const [key, order] = value.split("-");
        setSortKey(key);
        setSortOrder(order);
    };

    return (
        <div className="flex flex-col gap-6">
            <CreateSegmentModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                segmentToEdit={segmentToEdit}
            />

            <PageHead
                className="mb-0"
                eyebrow="Management"
                title="Segments"
                sub="Group users, organizations, and workspaces for targeting and rollouts."
                actions={
                    <>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <FunnelIcon className="size-4" />
                                    Filter
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                className="w-64 space-y-3 p-3"
                            >
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search segments…"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="h-8 bg-secondary pl-8 text-[13px]"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="px-1 pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                        Sort by
                                    </div>
                                    {SORT_OPTIONS.map(([value, label]) => {
                                        const active =
                                            `${sortKey}-${sortOrder}` === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    handleSortChange(value)
                                                }
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition-colors",
                                                    active
                                                        ? "bg-accent text-foreground"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                                )}
                                            >
                                                {label}
                                                {active && (
                                                    <CheckIcon className="size-3.5 text-primary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            className="gap-1.5"
                            data-tour-id="segments-create-button"
                            onClick={handleCreate}
                        >
                            <PlusIcon className="size-4" />
                            Create segment
                        </Button>
                    </>
                }
            />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <SkeletonTableRows rows={5} columns={5} />
                    ) : isError ? (
                        <TableRow>
                            <TableCell
                                colSpan={5}
                                className="text-center text-red-500"
                            >
                                Failed to load segments.
                            </TableCell>
                        </TableRow>
                    ) : segments?.length === 0 ? (
                        search ? (
                            <TableEmptyRow
                                colSpan={5}
                                icon={
                                    <MagnifyingGlassIcon className="h-8 w-8 text-muted-foreground/50" />
                                }
                                title="No results found"
                                description="Try adjusting your search terms."
                            />
                        ) : (
                            <TableEmptyRow
                                colSpan={5}
                                icon={
                                    <IconBriefcase className="h-8 w-8 text-muted-foreground/50" />
                                }
                                title="No segments"
                                description="Get started by creating your first segment."
                                action={
                                    <Button
                                        data-tour-id="segments-create-button"
                                        onClick={handleCreate}
                                    >
                                        <PlusIcon className="mr-2 h-4 w-4" />
                                        Create segment
                                    </Button>
                                }
                            />
                        )
                    ) : (
                        segments?.map((segment) => (
                            <TableRow
                                key={segment.id}
                                onClick={() => navigate(segment.id)}
                                className="cursor-pointer"
                            >
                                <TableCell className="font-medium text-foreground">
                                    {segment.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {segment.type === "user" && (
                                            <IconUser className="size-4 text-primary" />
                                        )}
                                        {segment.type === "organization" && (
                                            <IconBuilding className="size-4 text-emerald-500" />
                                        )}
                                        {segment.type === "workspace" && (
                                            <IconBriefcase className="size-4 text-amber-500" />
                                        )}
                                        <span className="capitalize">
                                            {segment.type}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {segment.description || "—"}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {format(
                                        new Date(segment.created_at),
                                        "MMM d, yyyy",
                                    )}
                                </TableCell>
                                <TableCell className="w-10 text-muted-foreground">
                                    <ChevronRightIcon className="size-4" />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
