import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useDeploymentInvitedUsers } from "@/lib/api/hooks/use-deployment-users";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useDeleteInvitation } from "@/lib/api/hooks/use-deployment-user-mutations";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import type { UsersListContext } from "./layout";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function InvitedUsersPage() {
    const { search, sortKey, sortOrder } = useOutletContext<UsersListContext>();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
    const [invitationToDelete, setInvitationToDelete] = useState<string | null>(
        null,
    );

    useEffect(() => {
        setPage(1);
    }, [search, sortKey, sortOrder]);

    const { data, isLoading } = useDeploymentInvitedUsers({
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_key: sortKey,
        sort_order: sortOrder,
        search,
        enabled: true,
    });

    const deleteInvitation = useDeleteInvitation();

    const hasNextPage = data?.has_more ?? false;

    const handleDeleteInvitation = async (id: string) => {
        await deleteInvitation.mutateAsync(id);
        setInvitationToDelete(null);
    };

    return (
        <div className="flex flex-col gap-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Invited</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading || !data ? (
                        <SkeletonTableRows
                            rows={10}
                            columns={4}
                            withAvatar={false}
                        />
                    ) : data.data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {search
                                            ? "No invitations found"
                                            : "No pending invitations"}
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
                        data.data.map((invitation) => (
                            <TableRow key={invitation.id}>
                                <TableCell>
                                    {invitation.email_address}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {invitation.created_at
                                        ? format(
                                              new Date(invitation.created_at),
                                              "MMM d, yyyy",
                                          )
                                        : "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {invitation.expiry
                                        ? format(
                                              new Date(invitation.expiry),
                                              "MMM d, yyyy",
                                          )
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() =>
                                            setInvitationToDelete(invitation.id)
                                        }
                                    >
                                        Delete
                                    </Button>
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

            {invitationToDelete && (
                <ConfirmationDialog
                    isOpen={!!invitationToDelete}
                    onClose={() => setInvitationToDelete(null)}
                    onConfirm={() => handleDeleteInvitation(invitationToDelete)}
                    title="Delete Invitation"
                    message="Are you sure you want to delete this invitation?"
                    confirmText="Delete"
                    isDestructive={true}
                />
            )}
        </div>
    );
}
