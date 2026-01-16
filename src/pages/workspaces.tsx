import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useDeploymentWorkspaces } from "@/lib/api/hooks/use-deployment-workspaces";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function WorkspacesPage() {
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);

  const { data, isLoading } = useDeploymentWorkspaces({
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-normal tracking-tight">Workspaces</h1>
        <p className="text-sm text-muted-foreground">
          Manage workspaces, their members, and settings.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        <Select value={`${sortKey}-${sortOrder}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest first</SelectItem>
            <SelectItem value="created_at-asc">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonTableRows rows={10} columns={4} withAvatar={true} />
          ) : data?.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <BuildingOffice2Icon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No workspaces found" : "No workspaces yet"}
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
            data?.data.map((workspace) => (
              <TableRow key={workspace.id} className="cursor-pointer" onClick={() => window.location.href = `workspace/${workspace.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={workspace.image_url} alt={workspace.name} />
                      <AvatarFallback>
                        {workspace.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{workspace.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {workspace.organization_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {workspace.member_count}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(workspace.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
                  <SelectItem key={value} value={value.toString()}>
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
