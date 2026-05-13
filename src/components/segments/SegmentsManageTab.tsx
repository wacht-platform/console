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
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { useSegments } from "@/lib/api/hooks/use-segments";
import { CreateSegmentModal } from "@/components/segments/CreateSegmentModal";
import { Segment } from "@/types/segment";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { format } from "date-fns";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
    IconUser,
    IconBuilding,
    IconBriefcase,
    IconSearch,
    IconPlus,
} from "@tabler/icons-react";

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
        <div>
            <CreateSegmentModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                segmentToEdit={segmentToEdit}
            />

            {/* Show controls if there is data OR if searching */}
            {((segments?.length ?? 0) > 0 || search) && (
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="sm:flex-1">
                        <div className="flex max-w-md gap-2">
                            <div className="flex-1">
                                <div className="relative w-64">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/4 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        name="search"
                                        placeholder="Search segments..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <Listbox
                                    onChange={(value) =>
                                        handleSortChange(value)
                                    }
                                    value={`${sortKey}-${sortOrder}`}
                                >
                                    <ListboxOption value="created_at-asc">
                                        <ListboxLabel>
                                            Sort by date (newest)
                                        </ListboxLabel>
                                    </ListboxOption>
                                    <ListboxOption value="created_at-desc">
                                        <ListboxLabel>
                                            Sort by date (oldest)
                                        </ListboxLabel>
                                    </ListboxOption>
                                    <ListboxOption value="name-asc">
                                        <ListboxLabel>
                                            Sort by name (A-Z)
                                        </ListboxLabel>
                                    </ListboxOption>
                                    <ListboxOption value="name-desc">
                                        <ListboxLabel>
                                            Sort by name (Z-A)
                                        </ListboxLabel>
                                    </ListboxOption>
                                </Listbox>
                            </div>
                        </div>
                    </div>
                    <Button
                        data-tour-id="segments-create-button"
                        onClick={handleCreate}
                    >
                        <IconPlus className="mr-2 h-4 w-4" />
                        Create Segment
                    </Button>
                </div>
            )}

            <div className="mt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <SkeletonTableRows rows={5} columns={4} />
                        ) : isError ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center text-red-500"
                                >
                                    Failed to load segments.
                                </TableCell>
                            </TableRow>
                        ) : segments?.length === 0 ? null : ( // Handled by Empty State below
                            segments?.map((segment) => (
                                <TableRow
                                    key={segment.id}
                                    onClick={() => navigate(segment.id)}
                                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {segment.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {segment.type === "user" && (
                                                <IconUser className="size-4 text-blue-500" />
                                            )}
                                            {segment.type ===
                                                "organization" && (
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
                                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                                        {segment.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                                        {format(
                                            new Date(segment.created_at),
                                            "MMM d, yyyy",
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Empty State */}
                {!isLoading && (segments?.length ?? 0) === 0 && (
                    <div className="text-center py-12">
                        {search ? (
                            <>
                                <IconSearch className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                                <h3 className="mt-2 text-sm font-normal text-zinc-900 dark:text-zinc-100">
                                    No results found
                                </h3>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    Try adjusting your search terms.
                                </p>
                            </>
                        ) : (
                            <>
                                <IconBriefcase className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                                <h3 className="mt-2 text-sm font-normal text-zinc-900 dark:text-zinc-100">
                                    No segments
                                </h3>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    Get started by creating your first segment.
                                </p>
                                <div className="mt-6">
                                    <Button
                                        data-tour-id="segments-create-button"
                                        onClick={handleCreate}
                                    >
                                        <IconPlus className="mr-2 h-4 w-4" />
                                        Create Segment
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
