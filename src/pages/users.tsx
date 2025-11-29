import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Heading } from "@/components/ui/heading";
import { Input, InputGroup } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import {
  useDeploymentInvitedUsers,
  useDeploymentUsers,
  useDeploymentWaitlist,
} from "@/lib/api/hooks/use-deployment-users";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { InviteUserModal } from "@/components/users/InviteUserModal";
import type { DeploymentWaitlistUser, UserWithIdentifiers } from "@/types/user";
import { useApproveWaitlistUser, useDeleteInvitation } from "@/lib/api/hooks/use-deployment-user-mutations";
import { useNavigate, useLocation, useParams } from "react-router";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { SkeletonTableRows } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, deploymentId } = useParams();
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);

  // Determine current tab from URL
  const getCurrentTab = () => {
    if (location.pathname.includes("/users/invited")) return "Invited";
    if (location.pathname.includes("/users/waitlist")) return "Waitlist";
    return "Active"; // Default to Active for /users and /users/active
  };

  const [selectedTabKey, setSelectedTabKey] = useState<string>(getCurrentTab());

  // Update selected tab when URL changes
  useEffect(() => {
    setSelectedTabKey(getCurrentTab());
  }, [location.pathname]);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const offset = (page - 1) * itemsPerPage;
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);
  const [confirmApprovalOpen, setConfirmApprovalOpen] = useState(false);
  const [selectedWaitlistUser, setSelectedWaitlistUser] =
    useState<DeploymentWaitlistUser | null>(null);

  const { data: activeUsers, isLoading: activeUsersLoading } =
    useDeploymentUsers({
      offset,
      sort_key: sortKey,
      sort_order: sortOrder,
      limit: itemsPerPage,
      enabled: selectedTabKey === "Active",
    });

  const { data: invitedUsers, isLoading: invitedUsersLoading } =
    useDeploymentInvitedUsers({
      offset,
      sort_key: sortKey,
      sort_order: sortOrder,
      limit: itemsPerPage,
      enabled: selectedTabKey === "Invited",
    });

  const { data: waitlistUsers, isLoading: waitlistUsersLoading } =
    useDeploymentWaitlist({
      offset,
      sort_key: sortKey,
      sort_order: sortOrder,
      limit: itemsPerPage,
      enabled: selectedTabKey === "Waitlist",
    });

  const isLoading =
    activeUsersLoading || invitedUsersLoading || waitlistUsersLoading;

  const hasNextPage =
    (selectedTabKey === "Active" && (activeUsers?.has_more ?? false)) ||
    (selectedTabKey === "Invited" && (invitedUsers?.has_more ?? false)) ||
    (selectedTabKey === "Waitlist" && (waitlistUsers?.has_more ?? false));

  const hasPrevPage = page > 1;

  // Helper function to check if current tab has any users
  const hasUsersInCurrentTab = () => {
    if (isLoading) return false;
    if (selectedTabKey === "Active") return (activeUsers?.data.length ?? 0) > 0;
    if (selectedTabKey === "Invited")
      return (invitedUsers?.data.length ?? 0) > 0;
    if (selectedTabKey === "Waitlist")
      return (waitlistUsers?.data.length ?? 0) > 0;
    return false;
  };

  const handleCreateUser = () => {
    if (selectedTabKey === "Active") {
      setCreateUserModalOpen(true);
    } else if (selectedTabKey === "Invited") {
      setInviteUserModalOpen(true);
    }
  };

  const approveWaitlistMutation = useApproveWaitlistUser();
  const deleteInvitationMutation = useDeleteInvitation();

  const handleApproveWaitlist = (waitlistUser: DeploymentWaitlistUser) => {
    setSelectedWaitlistUser(waitlistUser);
    setConfirmApprovalOpen(true);
  };

  const handleWithdrawInvitation = (invitationId: string) => {
    deleteInvitationMutation.mutate(invitationId);
  };

  const handleConfirmApproval = () => {
    if (selectedWaitlistUser) {
      approveWaitlistMutation.mutate(selectedWaitlistUser.id);
      setConfirmApprovalOpen(false);
      setSelectedWaitlistUser(null);
    }
  };

  const handleViewUserDetails = (user: UserWithIdentifiers) => {
    navigate(
      `/project/${projectId}/deployment/${deploymentId}/user/${user.id}`,
    );
  };

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

  // Remove the onTabChange function since navigation is now handled by routes

  return (
    <div>
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
      />
      <InviteUserModal
        isOpen={inviteUserModalOpen}
        onClose={() => setInviteUserModalOpen(false)}
      />

      <div className="flex flex-col gap-2 mb-2">
        <Heading>Users</Heading>
      </div>
      {hasUsersInCurrentTab() && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="sm:flex-1">
            <div className="mt-4 flex max-w-md gap-2">
              <div className="flex-1">
                <InputGroup className="w-64">
                  <MagnifyingGlassIcon className="size-4" />
                  <Input name="search" placeholder="Search users&hellip;" />
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
                  <ListboxOption value="username-asc">
                    <ListboxLabel>Sort by username (A-Z)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="username-desc">
                    <ListboxLabel>Sort by username (Z-A)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="email-asc">
                    <ListboxLabel>Sort by email (A-Z)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="email-desc">
                    <ListboxLabel>Sort by email (Z-A)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="phone_number-asc">
                    <ListboxLabel>Sort by phone (A-Z)</ListboxLabel>
                  </ListboxOption>
                  <ListboxOption value="phone_number-desc">
                    <ListboxLabel>Sort by phone (Z-A)</ListboxLabel>
                  </ListboxOption>
                </Listbox>
              </div>
            </div>
          </div>
          {selectedTabKey !== "Waitlist" && (
            <Button onClick={handleCreateUser}>
              {selectedTabKey === "Active" && "Create User"}
              {selectedTabKey === "Invited" && "Invite User"}
            </Button>
          )}
        </div>
      )}

      <div className="mt-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>User</TableHeader>
              <TableHeader>Email</TableHeader>
              {selectedTabKey === "Active" && (
                <>
                  <TableHeader>Username</TableHeader>
                  <TableHeader>Phone number</TableHeader>
                </>
              )}
              {selectedTabKey === "Invited" && (
                <TableHeader>Expiry</TableHeader>
              )}
              <TableHeader>
                {selectedTabKey === "Waitlist" ? "Joined" : "Created"}
              </TableHeader>
              {(selectedTabKey === "Waitlist" || selectedTabKey === "Invited") && <TableHeader />}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <SkeletonTableRows
                rows={10}
                columns={
                  selectedTabKey === "Active"
                    ? 5
                    : selectedTabKey === "Waitlist"
                      ? 4
                      : 5
                }
                withAvatar={true}
              />
            ) : selectedTabKey === "Active" &&
              activeUsers?.data.length === 0 ? null : selectedTabKey ===
                "Invited" &&
              invitedUsers?.data.length === 0 ? null : selectedTabKey ===
                "Waitlist" &&
              waitlistUsers?.data.length === 0 ? null : selectedTabKey ===
              "Active" ? (
              activeUsers?.data.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => handleViewUserDetails(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-8"
                        src={user.profile_picture_url || undefined}
                        initials={`${user.first_name[0]}${user.last_name[0]}`}
                      />
                      <span className="font-medium">{`${user.first_name} ${user.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {user.primary_email_address || (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {user.username || (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {user.primary_phone_number || (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            ) : selectedTabKey === "Invited" ? (
              invitedUsers?.data.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-8"
                        initials={`${invitation.first_name[0]}${invitation.last_name[0]}`}
                      />
                      <span className="font-medium">{`${invitation.first_name} ${invitation.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {invitation.email_address}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {format(new Date(invitation.expiry), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {format(new Date(invitation.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWithdrawInvitation(invitation.id);
                      }}
                      disabled={deleteInvitationMutation.isPending}
                    >
                      Withdraw
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              waitlistUsers?.data.map((waitlistUser) => (
                <TableRow key={waitlistUser.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-8"
                        initials={
                          waitlistUser.first_name && waitlistUser.last_name
                            ? `${waitlistUser.first_name[0]}${waitlistUser.last_name[0]}`
                            : waitlistUser.email_address[0].toUpperCase()
                        }
                      />
                      <span className="font-medium">
                        {waitlistUser.first_name && waitlistUser.last_name
                          ? `${waitlistUser.first_name} ${waitlistUser.last_name}`
                          : waitlistUser.email_address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {waitlistUser.email_address}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {format(new Date(waitlistUser.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="text-xs py-1 px-2"
                      onClick={() => handleApproveWaitlist(waitlistUser)}
                    >
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Empty States */}
        {!isLoading && !hasUsersInCurrentTab() && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
            <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedTabKey === "Active" && "No active users"}
              {selectedTabKey === "Invited" && "No invited users"}
              {selectedTabKey === "Waitlist" && "No users in waitlist"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {selectedTabKey === "Active" &&
                "Get started by creating your first user."}
              {selectedTabKey === "Invited" &&
                "Get started by inviting your first user."}
              {selectedTabKey === "Waitlist" &&
                "No users have joined the waitlist yet."}
            </p>
            {selectedTabKey !== "Waitlist" && (
              <div className="mt-6">
                <Button onClick={handleCreateUser}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {selectedTabKey === "Active" && "Create User"}
                  {selectedTabKey === "Invited" && "Invite User"}
                </Button>
              </div>
            )}
          </div>
        )}

        {!isLoading &&
          ((selectedTabKey === "Active" &&
            (activeUsers?.data.length ?? 0) > 0) ||
            (selectedTabKey === "Invited" &&
              (invitedUsers?.data.length ?? 0) > 0) ||
            (selectedTabKey === "Waitlist" &&
              (waitlistUsers?.data.length ?? 0) > 0)) && (
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

      <ConfirmationDialog
        isOpen={confirmApprovalOpen}
        onClose={() => {
          setConfirmApprovalOpen(false);
          setSelectedWaitlistUser(null);
        }}
        onConfirm={handleConfirmApproval}
        title="Approve Waitlist User"
        message={
          selectedWaitlistUser
            ? `Are you sure you want to approve ${
                selectedWaitlistUser.first_name &&
                selectedWaitlistUser.last_name
                  ? `${selectedWaitlistUser.first_name} ${selectedWaitlistUser.last_name}`
                  : selectedWaitlistUser.email_address
              }?`
            : ""
        }
        confirmText="Approve"
        isLoading={approveWaitlistMutation.isPending}
      />
    </div>
  );
}
