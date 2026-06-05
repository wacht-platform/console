import {
    UserGroupIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useOutletContext } from "react-router";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { useDeploymentWaitlist } from "@/lib/api/hooks/use-deployment-users";
import type { DeploymentWaitlistUser } from "@/types/user";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useApproveWaitlistUser } from "@/lib/api/hooks/use-deployment-user-mutations";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import type { UsersListContext } from "./layout";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function WaitlistUsersPage() {
    const { search, sortKey, sortOrder } = useOutletContext<UsersListContext>();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
    const [waitlistUserToApprove, setWaitlistUserToApprove] =
        useState<DeploymentWaitlistUser | null>(null);

    useEffect(() => {
        setPage(1);
    }, [search, sortKey, sortOrder]);

    const { data, isLoading } = useDeploymentWaitlist({
        offset: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_key: sortKey,
        sort_order: sortOrder,
        search,
        enabled: true,
    });

    const approveWaitlist = useApproveWaitlistUser();

    const hasNextPage = data?.has_more ?? false;
    const hasPrevPage = page > 1;

    const handleApproveWaitlist = async (user: DeploymentWaitlistUser) => {
        await approveWaitlist.mutateAsync(user.id);
        setWaitlistUserToApprove(null);
    };

    return (
        <div className="flex flex-col gap-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
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
                                    <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {search
                                            ? "No waitlist entries found"
                                            : "No waitlist entries"}
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
                        data.data.map((user: DeploymentWaitlistUser) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email_address}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {user.created_at
                                        ? format(
                                              new Date(user.created_at),
                                              "MMM d, yyyy",
                                          )
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setWaitlistUserToApprove(user)
                                        }
                                    >
                                        Approve
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {!isLoading && (data?.data.length ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Show</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                                setItemsPerPage(Number.parseInt(value, 10));
                                setPage(1);
                            }}
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

            {waitlistUserToApprove && (
                <ConfirmationDialog
                    isOpen={!!waitlistUserToApprove}
                    onClose={() => setWaitlistUserToApprove(null)}
                    onConfirm={() =>
                        handleApproveWaitlist(waitlistUserToApprove)
                    }
                    title="Approve Waitlist User"
                    message={`Are you sure you want to approve ${waitlistUserToApprove.email_address}?`}
                    confirmText="Approve"
                />
            )}
        </div>
    );
}
