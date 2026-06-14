import { UserGroupIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNavigate, useOutletContext, useParams } from "react-router";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDeploymentUsers } from "@/lib/api/hooks/use-deployment-users";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import type { UsersListContext } from "./layout";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function ActiveUsersPage() {
    const { search, sortKey, sortOrder } = useOutletContext<UsersListContext>();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);

    const { projectId, deploymentId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setPage(1);
    }, [search, sortKey, sortOrder]);

    const { data, isLoading } = useDeploymentUsers({
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_key: sortKey,
        sort_order: sortOrder,
        search,
        enabled: true,
    });

    const hasNextPage = data?.has_more ?? false;

    return (
        <div className="flex flex-col gap-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading || !data ? (
                        <SkeletonTableRows
                            rows={10}
                            columns={6}
                            withAvatar={false}
                        />
                    ) : data.data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {search
                                            ? "No users found"
                                            : "No active users yet"}
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
                                className="cursor-pointer hover:bg-accent"
                                onClick={() =>
                                    navigate(
                                        `/project/${projectId}/deployment/${deploymentId}/users/${user.id}`,
                                    )
                                }
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={user.profile_picture_url}
                                                alt={
                                                    user.first_name ||
                                                    user.last_name ||
                                                    user.username ||
                                                    ""
                                                }
                                            />
                                            <AvatarFallback>
                                                {user.first_name?.[0]}
                                                {user.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground">
                                                {user.first_name}{" "}
                                                {user.last_name}
                                            </div>
                                            <div className="truncate font-mono text-[11px] text-muted-foreground">
                                                {user.id}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-secondary-foreground">
                                    {user.primary_email_address || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {user.username || "—"}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {user.primary_phone_number || "—"}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {user.created_at
                                        ? format(
                                              new Date(user.created_at),
                                              "MMM d, yyyy",
                                          )
                                        : "—"}
                                </TableCell>
                                <TableCell className="w-10 text-muted-foreground">
                                    <ChevronRightIcon className="size-4" />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {!isLoading && (data?.data.length ?? 0) > 0 && (
                <TablePagination
                    page={page}
                    onPageChange={setPage}
                    hasMore={hasNextPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => {
                        setItemsPerPage(value);
                        setPage(1);
                    }}
                    perPageOptions={ITEMS_PER_PAGE_OPTIONS}
                />
            )}
        </div>
    );
}
