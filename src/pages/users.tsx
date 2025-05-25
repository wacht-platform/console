import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
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
import { NavigationTabs, type Tab } from "@/components/navigation-tabs";
import {
  useDeploymentInvitedUsers,
  useDeploymentUsers,
  useDeploymentWaitlist,
} from "@/lib/api/hooks/use-deployment-users";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { InviteUserModal } from "@/components/users/InviteUserModal";
import { DeploymentWaitlistUser, UserWithIdentifiers } from "@/types/user";
import { useApproveWaitlistUser } from "@/lib/api/hooks/use-deployment-user-mutations";
import { useNavigate } from "react-router";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function UsersPage() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [tabs, setTabs] = useState<Tab[]>([
    { name: "Active", current: true },
    { name: "Invited", current: false },
    { name: "Waitlist", current: false },
  ]);
  const [selectedTabKey, setSelectedTabKey] = useState<string>("Active");
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const offset = (page - 1) * itemsPerPage;
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);

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
    (selectedTabKey === "Active" && (activeUsers?.has_next ?? false)) ||
    (selectedTabKey === "Invited" && (invitedUsers?.has_next ?? false)) ||
    (selectedTabKey === "Waitlist" && (waitlistUsers?.has_next ?? false));

  const hasPrevPage = page > 1;

  const handleCreateUser = () => {
    if (selectedTabKey === "Active") {
      setCreateUserModalOpen(true);
    } else if (selectedTabKey === "Invited") {
      setInviteUserModalOpen(true);
    }
  };

  const approveWaitlistMutation = useApproveWaitlistUser();

  const handleApproveWaitlist = (waitlistUser: DeploymentWaitlistUser) => {
    if (
      confirm(
        `Are you sure you want to approve ${waitlistUser.first_name} ${waitlistUser.last_name}?`
      )
    ) {
      approveWaitlistMutation.mutate(waitlistUser.id);
    }
  };

  const handleViewUserDetails = (user: UserWithIdentifiers) => {
    navigate(`../user/${user.id}`);
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

  const onTabChange = (tab: Tab) => {
    setTabs(tabs.map((t) => ({ ...t, current: t.name === tab.name })));
    setSelectedTabKey(tab.name);
  };

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
        <NavigationTabs tabs={tabs} onChange={onTabChange} />
      </div>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : selectedTabKey === "Active" &&
              activeUsers?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No active users found
                </TableCell>
              </TableRow>
            ) : selectedTabKey === "Invited" &&
              invitedUsers?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No invited users found
                </TableCell>
              </TableRow>
            ) : selectedTabKey === "Waitlist" &&
              waitlistUsers?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No users in waitlist
                </TableCell>
              </TableRow>
            ) : selectedTabKey === "Active" ? (
              activeUsers?.data.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-zinc-50"
                  onClick={() => handleViewUserDetails(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-5"
                        initials={`${user.first_name[0]}${user.last_name[0]}`}
                      />
                      <span>{`${user.first_name} ${user.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.primary_email_address || (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.username || <span className="text-zinc-400">-</span>}
                  </TableCell>
                  <TableCell>
                    {user.primary_phone_number || (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
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
                        className="size-5"
                        initials={`${invitation.first_name[0]}${invitation.last_name[0]}`}
                      />
                      <span>{`${invitation.first_name} ${invitation.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>{invitation.email_address}</TableCell>
                  <TableCell>
                    {format(new Date(invitation.expiry), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              waitlistUsers?.data.map((waitlistUser) => (
                <TableRow key={waitlistUser.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="size-5"
                        initials={`${waitlistUser.first_name[0]}${waitlistUser.last_name[0]}`}
                      />
                      <span>{`${waitlistUser.first_name} ${waitlistUser.last_name}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>{waitlistUser.email_address}</TableCell>
                  <TableCell>
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
    </div>
  );
}
