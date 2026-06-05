import { useParams, useNavigate } from "react-router";
import {
    useSegments,
    useAnalyzeSegments,
    useDeleteSegment,
} from "@/lib/api/hooks/use-segments";
import { Button } from "@/components/ui/button";
import {
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import { IconUser, IconBuilding, IconBriefcase } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { useState, useEffect } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { AnalyzedEntity } from "@/types/segment";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreateSegmentModal } from "@/components/segments/CreateSegmentModal";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { useTour } from "@/lib/tour";

export default function SegmentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: segments, isLoading: isLoadingSegments } = useSegments();
    const analyzeMutation = useAnalyzeSegments();
    const deleteSegmentMutation = useDeleteSegment();

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 500);
    const [entities, setEntities] = useState<AnalyzedEntity[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

    const segment = segments?.find((s) => s.id === id);
    useTour("first-segment-details", !!segment);

    useEffect(() => {
        if (segment) {
            fetchMembers();
        }
    }, [segment, debouncedSearch]);

    const fetchMembers = async () => {
        if (!segment) return;

        setIsAnalyzing(true);
        try {
            // Build filters object matching backend SegmentDataFilters structure
            const filters: {
                segment_id: string;
                user?: { name?: string };
                organization?: { name?: string };
                workspace?: { name?: string };
            } = {
                segment_id: segment.id,
            };

            // Add search filter based on target type
            if (debouncedSearch) {
                if (segment.type === "user") {
                    filters.user = { name: debouncedSearch };
                } else if (segment.type === "organization") {
                    filters.organization = { name: debouncedSearch };
                } else if (segment.type === "workspace") {
                    filters.workspace = { name: debouncedSearch };
                }
            }

            const response = await analyzeMutation.mutateAsync({
                target_type: segment.type,
                filters: filters,
            });
            setEntities(response.data || []);
        } catch (e) {
            console.error("Failed to fetch segment members", e);
            toast.error("Failed to load segment members");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDelete = async () => {
        if (!segment) return;
        try {
            await deleteSegmentMutation.mutateAsync(segment.id);
            toast.success("Segment deleted");
            navigate("..");
        } catch (error) {
            toast.error("Failed to delete segment");
        }
    };

    if (isLoadingSegments) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <Skeleton className="w-24 h-4" />
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-48 h-8" />
                                <Skeleton className="size-6 rounded-md" />
                            </div>
                            <Skeleton className="w-96 h-4" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="w-20 h-9 rounded-md" />
                            <Skeleton className="w-20 h-9 rounded-md" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Skeleton className="w-full max-w-lg h-10 rounded-md" />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Last Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SkeletonTableRows rows={5} columns={3} />
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!segment) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Segment not found.</p>
                <Button
                    className="mt-4"
                    onClick={() => navigate("..")}
                    variant="ghost"
                >
                    Back to Segments
                </Button>
            </div>
        );
    }

    return (
        <>
            <CreateSegmentModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                segmentToEdit={segment}
            />

            <ConfirmationDialog
                isOpen={deleteConfirmationOpen}
                onClose={() => setDeleteConfirmationOpen(false)}
                onConfirm={handleDelete}
                title="Delete Segment"
                message="Are you sure you want to delete this segment? This action cannot be undone."
                confirmText="Delete Segment"
                isDestructive={true}
                isLoading={deleteSegmentMutation.isPending}
            />

            <div className="space-y-6">
                {/* Header */}
                <div
                    className="flex flex-col gap-4 pt-1 sm:pt-2"
                    data-tour-id="segment-header"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                                Segment
                            </div>
                            <div className="mt-1 flex items-center gap-3">
                                <h1 className="text-xl font-medium tracking-tight text-foreground">{segment.name}</h1>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-secondary text-xs font-medium capitalize">
                                    {segment.type === "user" && (
                                        <IconUser className="size-3 text-primary" />
                                    )}
                                    {segment.type === "organization" && (
                                        <IconBuilding className="size-3 text-emerald-500" />
                                    )}
                                    {segment.type === "workspace" && (
                                        <IconBriefcase className="size-3 text-amber-500" />
                                    )}
                                    {segment.type}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground text-muted-foreground mt-2 max-w-2xl">
                                {segment.description ||
                                    "No description provided."}
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                                Created{" "}
                                {format(
                                    new Date(segment.created_at),
                                    "MMM d, yyyy",
                                )}
                            </div>
                        </div>
                        <div
                            className="flex items-center gap-2"
                            data-tour-id="segment-actions"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCreateModalOpen(true)}
                                className="h-8 gap-1.5 font-normal"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteConfirmationOpen(true)}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-medium text-foreground">
                            Members{" "}
                            <span className="text-muted-foreground">
                                ({entities.length})
                            </span>
                        </h3>
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
                            <PopoverContent align="end" className="w-64 p-3">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={`Search ${segment.type}s…`}
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="h-8 bg-secondary pl-8 text-[13px]"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Table data-tour-id="segment-members-table">
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                {segment.type === "user" ? (
                                    <>
                                        <TableHead>First Name</TableHead>
                                        <TableHead>Last Name</TableHead>
                                    </>
                                ) : (
                                    <TableHead>Name</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isAnalyzing ? (
                                <SkeletonTableRows
                                    rows={5}
                                    columns={segment.type === "user" ? 3 : 2}
                                />
                            ) : entities.length === 0 ? (
                                <TableEmptyRow
                                    colSpan={segment.type === "user" ? 3 : 2}
                                    icon={
                                        <UsersIcon className="h-8 w-8 text-muted-foreground/50" />
                                    }
                                    title="No members found"
                                    description={
                                        search
                                            ? "Try adjusting your search."
                                            : "No entities match this segment yet."
                                    }
                                />
                            ) : (
                                entities.map((entity) => (
                                    <TableRow key={entity.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {entity.id}
                                        </TableCell>
                                        {segment.type === "user" ? (
                                            <>
                                                <TableCell>
                                                    {entity.first_name || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {entity.last_name || "-"}
                                                </TableCell>
                                            </>
                                        ) : (
                                            <TableCell className="font-medium">
                                                {entity.name || "-"}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
