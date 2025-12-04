import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/avatar";
import { Heading } from "../components/ui/heading";
import { Input, InputGroup } from "../components/ui/input";
import { Select } from "../components/ui/select";
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
    <div>
      <div className="flex flex-col gap-2 mb-2">
        <Heading>Workspaces</Heading>
      </div>
      {((data?.data.length ?? 0) > 0 || search) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="sm:flex-1">
            <div className="mt-4 flex max-w-md gap-2">
              <div className="flex-1">
                <InputGroup className="w-64">
                  <MagnifyingGlassIcon className="size-4" />
                  <Input
                    name="search"
                    placeholder="Search workspaces..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </InputGroup>
              </div>
              <div className="flex-1">
                <Select
                  name="sort_by"
                  onChange={(e) => handleSortChange(e.target.value)}
                  value={`${sortKey}-${sortOrder}`}
                >
                  <option value="created_at-desc">Sort by date (newest)</option>
                  <option value="created_at-asc">Sort by date (oldest)</option>
                  <option value="name-asc">Sort by name (A-Z)</option>
                  <option value="name-desc">Sort by name (Z-A)</option>
                  <option value="organization-asc">
                    Sort by organization (A-Z)
                  </option>
                  <option value="organization-desc">
                    Sort by organization (Z-A)
                  </option>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Workspace</TableHeader>
              <TableHeader>Organization</TableHeader>
              <TableHeader>Members</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <SkeletonTableRows rows={10} columns={4} withAvatar={true} />
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  {search ? (
                    <>
                      <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                      <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        No results found
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Try adjusting your search terms.
                      </p>
                    </>
                  ) : (
                    <>
                      <BuildingOffice2Icon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                      <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        No workspaces found
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Workspaces will appear here once they're created.
                      </p>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((workspace) => (
                <TableRow key={workspace.id} href={`workspace/${workspace.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-8"
                        src={workspace.image_url}
                        initials={workspace.name.substring(0, 2).toUpperCase()}
                        alt={`${workspace.name} logo`}
                      />
                      <span>{workspace.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{workspace.organization_name}</TableCell>
                  <TableCell>{workspace.member_count}</TableCell>
                  <TableCell>
                    {format(new Date(workspace.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!isLoading && (data?.data.length ?? 0) > 0 && (
          <div className="flex items-center justify-between text-xs mt-3">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 flex-1">
              <span>Show</span>
              <Select
                name="items_per_page"
                value={itemsPerPage.toString()}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="max-w-18"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((value) => (
                  <option key={value} value={value.toString()}>
                    {value}
                  </option>
                ))}
              </Select>
              <span>Per page</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                outline
                disabled={!hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1"
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
              <Button
                outline
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="p-1"
              >
                <ChevronRightIcon className="size-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
