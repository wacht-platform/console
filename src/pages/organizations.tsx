import {
    MagnifyingGlassIcon,
    BuildingOffice2Icon,
    FunnelIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "../components/ui/input";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { PageHead } from "@/components/ui/page-head";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/app-table";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useDeploymentOrganizations } from "@/lib/api/hooks/use-deployment-organizations";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useNavigate, useParams } from "react-router";
import { CreateOrganizationModal } from "@/components/organizations/CreateOrganizationModal";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function OrganizationsPage() {
    const navigate = useNavigate();
    const params = useParams();
    const [sortKey, setSortKey] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
    const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 500);

    const { data, isLoading } = useDeploymentOrganizations({
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_key: sortKey,
        sort_order: sortOrder,
        search: debouncedSearch,
    });

    const hasNextPage = data?.has_more ?? false;
    const hasPrevPage = page > 1;

    const handleSortChange = (value: string) => {
        const [key, order] = value.split("-");
        setSortKey(key);
        setSortOrder(order);
        setPage(1);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newItemsPerPage = Number.parseInt(value, 10);
        setItemsPerPage(newItemsPerPage);
        setPage(1);
    };

    const handleViewOrganization = (orgId: string) => {
        navigate(
            `/project/${params.projectId}/deployment/${params.deploymentId}/organizations/${orgId}`,
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow="Multi-tenancy"
                title="Organizations"
                sub="Manage organizations, their members, and settings."
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
                                        placeholder="Search organizations…"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="h-8 bg-secondary pl-8 text-[13px]"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="px-1 pb-1 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                        Sort by
                                    </div>
                                    {(
                                        [
                                            ["created_at-desc", "Newest first"],
                                            ["created_at-asc", "Oldest first"],
                                            ["name-asc", "Name (A–Z)"],
                                            ["name-desc", "Name (Z–A)"],
                                        ] as const
                                    ).map(([value, label]) => {
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
                        <Button onClick={() => setCreateOrgModalOpen(true)}>
                            Create organization
                        </Button>
                    </>
                }
            />

            {/* Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading || !data ? (
                        <SkeletonTableRows
                            rows={10}
                            columns={3}
                            withAvatar={false}
                        />
                    ) : data.data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <BuildingOffice2Icon className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {search
                                            ? "No organizations found"
                                            : "No organizations yet"}
                                    </p>
                                    {search && (
                                        <p className="text-xs text-muted-foreground">
                                            Try adjusting your search
                                        </p>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.data.map((org) => (
                            <TableRow
                                key={org.id}
                                className="cursor-pointer"
                                onClick={() => handleViewOrganization(org.id)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={org.image_url}
                                                alt={org.name}
                                            />
                                            <AvatarFallback>
                                                {org.name
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{org.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {org.member_count}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {org.created_at
                                        ? format(
                                              new Date(org.created_at),
                                              "MMM d, yyyy",
                                          )
                                        : "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <CreateOrganizationModal
                isOpen={createOrgModalOpen}
                onClose={() => setCreateOrgModalOpen(false)}
            />

            {/* Pagination */}
            {!isLoading && (data?.data.length ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Show</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={handleItemsPerPageChange}
                        >
                            <SelectTrigger className="w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ITEMS_PER_PAGE_OPTIONS.map((value) => (
                                    <SelectItem
                                        key={value}
                                        value={value.toString()}
                                    >
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasPrevPage}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasNextPage}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
