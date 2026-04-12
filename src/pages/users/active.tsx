import {
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/app-table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDeploymentUsers } from "@/lib/api/hooks/use-deployment-users";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function ActiveUsersPage() {
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  const { projectId, deploymentId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useDeploymentUsers({
    offset: (page - 1) * itemsPerPage,
    limit: itemsPerPage,
    sort_key: sortKey,
    sort_order: sortOrder,
    search: debouncedSearch,
    enabled: true
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
    setItemsPerPage(Number.parseInt(value, 10));
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <h1 className="text-xl font-normal tracking-tight">Active Users</h1>

      {/* Filters and Action Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select value={`${sortKey}-${sortOrder}`} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest first</SelectItem>
            <SelectItem value="created_at-asc">Oldest first</SelectItem>
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreateUserModalOpen(true)} className="ml-auto">
          Create User
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading || !data ? (
            <SkeletonTableRows rows={10} columns={5} withAvatar={false} />
          ) : data.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No users found" : "No active users yet"}
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
            data.data.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  navigate(
                    `/project/${projectId}/deployment/${deploymentId}/users/${user.id}`
                  )
                }
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_picture_url} alt={user.first_name || user.last_name || user.username || ''} />
                      <AvatarFallback>
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.primary_email_address}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.primary_email_address || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.username || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.primary_phone_number || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.created_at
                    ? format(new Date(user.created_at), "MMM d, yyyy")
                    : "-"}
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

      {/* Modal */}
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
      />
    </div>
  );
}