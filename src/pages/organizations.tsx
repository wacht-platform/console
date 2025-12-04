import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PlusIcon,
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
import { useDeploymentOrganizations } from "@/lib/api/hooks/use-deployment-organizations";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { CreateOrganizationModal } from "@/components/organizations/CreateOrganizationModal";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function OrganizationsPage() {
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);

  const offset = (page - 1) * itemsPerPage;
  const { data: organizations, isLoading } = useDeploymentOrganizations({
    offset,
    sort_key: sortKey,
    sort_order: sortOrder,
    limit: itemsPerPage,
    search: debouncedSearch,
  });

  const data = {
    data: organizations?.data || [],
    has_next: organizations?.has_more,
  };

  const hasNextPage = data?.has_next ?? false;
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
      <CreateOrganizationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <div className="flex flex-col gap-2 mb-2">
        <Heading>Organizations</Heading>
      </div>
      {/* Show controls if there is data OR if searching (to allow clearing search) */}
      {((data?.data.length ?? 0) > 0 || search) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="sm:flex-1">
            <div className="mt-4 flex max-w-md gap-2">
              <div className="flex-1">
                <InputGroup className="w-64">
                  <MagnifyingGlassIcon className="size-4" />
                  <Input
                    name="search"
                    placeholder="Search organizations..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </InputGroup>
              </div>
              <div className="flex-1">
                <Listbox
                  onChange={(value) => handleSortChange(value)}
                  value={`${sortKey}-${sortOrder}`}
                >
                  <ListboxOption value="created_at-asc">
                    <ListboxLabel>Sort by date (newest)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="created_at-desc">
                    <ListboxLabel>Sort by date (oldest)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="name-asc">
                    <ListboxLabel>Sort by name (A-Z)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="name-desc">
                    <ListboxLabel>Sort by name (Z-A)</ListboxLabel>
                  </ListboxOption>
                </Listbox>
              </div>
            </div>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>
      )}

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Organization</TableHeader>
              <TableHeader>Members</TableHeader>
              <TableHeader>Created</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <SkeletonTableRows rows={10} columns={3} withAvatar={true} />
            ) : data?.data.length === 0 ? null : (
              data?.data.map((org) => (
                <TableRow key={org.id} href={`../organization/${org.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-8"
                        src={org.image_url}
                        initials={org.name.substring(0, 2).toUpperCase()}
                        alt={`${org.name} logo`}
                      />
                      <span>{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{org.member_count}</TableCell>
                  <TableCell>
                    {format(new Date(org.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Empty State - Only show if no data AND no search (if search yields no results, we might want a different empty state, but for now standard empty state or just empty table is fine, though user might be confused. The existing code hides table body if empty. I'll stick to logic: if not loading and empty data... */}
        {!isLoading && (data?.data.length ?? 0) === 0 && (
          <div className="text-center py-12">
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
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
                <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No organizations
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Get started by creating your first organization.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Organization
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

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
