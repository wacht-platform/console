import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import { useOrganizationDetails } from "@/lib/api/hooks/use-organization-details";
import { useOrganizationMembers } from "@/lib/api/hooks/use-organization-members";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  useUpdateOrganization,
  useDeleteOrganization,
  useRemoveOrganizationMember,
  useDeleteOrganizationRole,
} from "@/lib/api/hooks/use-organization-mutations";
import { useDeleteWorkspace } from "@/lib/api/hooks/use-workspace-mutations";
import { SegmentManager } from "@/components/segments/SegmentManager";
import { Button } from "@/components/ui/button";
import { Input, InputGroup } from "@/components/ui/input";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";

import { Avatar } from "@/components/ui/avatar";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import Editor from "@monaco-editor/react";
import { CreateWorkspaceModal } from "@/components/workspaces/CreateWorkspaceModal";
import { EditWorkspaceDialog } from "@/components/workspaces/EditWorkspaceDialog";
import { EditOrganizationDialog } from "@/components/organizations/EditOrganizationDialog";
import { AddMemberDialog } from "@/components/organizations/AddMemberDialog";
import { EditMemberDialog } from "@/components/organizations/EditMemberDialog";
import { CreateRoleDialog } from "@/components/organizations/CreateRoleDialog";
import { EditRoleDialog } from "@/components/organizations/EditRoleDialog";
import { DeleteConfirmationDialog } from "@/components/organizations/DeleteConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  OrganizationMemberDetails,
  OrganizationRole,
  OrganizationRoleSimple,
  Workspace,
} from "@/types/organization";
import { EnterpriseSSO } from "@/components/organizations/EnterpriseSSO";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";

import {
  PencilIcon,
  TrashIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";

// Helper function to convert OrganizationRole to OrganizationRoleSimple
const convertToSimpleRoles = (
  roles: OrganizationRole[],
): OrganizationRoleSimple[] => {
  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    is_deployment_level: role.is_deployment_level,
  }));
};

export default function OrganizationDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const organizationId = id;
  const isDarkMode = useDarkMode();
  const { deploymentSettings } = useCurrentDeployemnt();

  // Tab state - needs to be declared before use
  const [activeTab, setActiveTab] = useState(0);

  // Member search and sort state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const [sortKey, setSortKey] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const {
    data: organization,
    isLoading,
    error,
  } = useOrganizationDetails(organizationId);

  const { data: membersData, isLoading: membersLoading } =
    useOrganizationMembers(
      organizationId,
      page * pageSize,
      pageSize,
      debouncedSearch,
      sortKey,
      sortOrder,
      activeTab === 1,
    );

  const [publicMetadata, setPublicMetadata] = useState<string>("");
  const [privateMetadata, setPrivateMetadata] = useState<string>("");
  const [isEditingPublicMetadata, setIsEditingPublicMetadata] = useState(false);
  const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
    useState(false);

  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] =
    useState(false);
  const [editWorkspaceModalOpen, setEditWorkspaceModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );

  const [editOrganizationModalOpen, setEditOrganizationModalOpen] =
    useState(false);
  const [deleteOrganizationModalOpen, setDeleteOrganizationModalOpen] =
    useState(false);

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<OrganizationMemberDetails | null>(null);
  const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);

  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(
    null,
  );
  const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);

  const [deleteWorkspaceModalOpen, setDeleteWorkspaceModalOpen] =
    useState(false);

  const updateOrganization = useUpdateOrganization();
  const deleteOrganization = useDeleteOrganization();
  const removeMember = useRemoveOrganizationMember();
  const deleteRole = useDeleteOrganizationRole();
  const deleteWorkspace = useDeleteWorkspace();

  useEffect(() => {
    if (organization) {
      setPublicMetadata(
        organization.public_metadata
          ? JSON.stringify(organization.public_metadata, null, 2)
          : "{}",
      );
      setPrivateMetadata(
        organization.private_metadata
          ? JSON.stringify(organization.private_metadata, null, 2)
          : "{}",
      );
    }
  }, [organization]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading organization details...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">
            {error.message || "Failed to load organization details"}
          </p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Organization not found</p>
        </div>
      </div>
    );
  }

  const handleSavePublicMetadata = async () => {
    try {
      await updateOrganization.mutateAsync({
        organizationId: organization.id,
        data: {
          public_metadata: JSON.parse(publicMetadata),
        },
      });
      setIsEditingPublicMetadata(false);
      toast.success("Public metadata updated successfully");
    } catch (error) {
      console.error("Failed to save public metadata:", error);
      toast.error(
        "Failed to update public metadata. Please check the JSON format.",
      );
    }
  };

  const handleSavePrivateMetadata = async () => {
    try {
      await updateOrganization.mutateAsync({
        organizationId: organization.id,
        data: {
          private_metadata: JSON.parse(privateMetadata),
        },
      });
      setIsEditingPrivateMetadata(false);
      toast.success("Private metadata updated successfully");
    } catch (error) {
      console.error("Failed to save private metadata:", error);
      toast.error(
        "Failed to update private metadata. Please check the JSON format.",
      );
    }
  };

  const handleCancelPublicMetadata = () => {
    setPublicMetadata(
      organization?.public_metadata
        ? JSON.stringify(organization.public_metadata, null, 2)
        : "{}",
    );
    setIsEditingPublicMetadata(false);
  };

  const handleCancelPrivateMetadata = () => {
    setPrivateMetadata(
      organization?.private_metadata
        ? JSON.stringify(organization.private_metadata, null, 2)
        : "{}",
    );
    setIsEditingPrivateMetadata(false);
  };

  // Organization handlers
  const handleDeleteOrganization = async () => {
    try {
      await deleteOrganization.mutateAsync(organization.id);
      navigate("../organizations");
    } catch (error) {
      console.error("Failed to delete organization:", error);
    }
  };

  // Member handlers
  const handleEditMember = (member: OrganizationMemberDetails) => {
    setSelectedMember(member);
    setEditMemberModalOpen(true);
  };

  const handleDeleteMember = (member: OrganizationMemberDetails) => {
    setSelectedMember(member);
    setDeleteMemberModalOpen(true);
  };

  const handleConfirmDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      await removeMember.mutateAsync({
        organizationId: organization.id,
        membershipId: selectedMember.id,
      });
      setDeleteMemberModalOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Role handlers
  const handleEditRole = (role: OrganizationRole) => {
    setSelectedRole(role);
    setEditRoleModalOpen(true);
  };

  const handleDeleteRole = (role: OrganizationRole) => {
    setSelectedRole(role);
    setDeleteRoleModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await deleteRole.mutateAsync({
        organizationId: organization.id,
        roleId: selectedRole.id,
      });
      setDeleteRoleModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  // Workspace handlers
  const handleEditWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditWorkspaceModalOpen(true);
  };

  const handleDeleteWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setDeleteWorkspaceModalOpen(true);
  };

  const handleConfirmDeleteWorkspace = async () => {
    if (!selectedWorkspace) return;

    try {
      await deleteWorkspace.mutateAsync(selectedWorkspace.id);
      setDeleteWorkspaceModalOpen(false);
      setSelectedWorkspace(null);
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    }
  };

  return (
    <div className="container mx-auto">
      <CreateWorkspaceModal
        isOpen={createWorkspaceModalOpen}
        onClose={() => setCreateWorkspaceModalOpen(false)}
        organizationId={organization.id}
        organizationName={organization.name}
      />

      {selectedWorkspace && (
        <EditWorkspaceDialog
          isOpen={editWorkspaceModalOpen}
          onClose={() => {
            setEditWorkspaceModalOpen(false);
            setSelectedWorkspace(null);
          }}
          workspace={selectedWorkspace}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg text-zinc-900 dark:text-zinc-100">
              {organization.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Organization ID: {organization.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            outline
            className="p-2"
            onClick={() => setEditOrganizationModalOpen(true)}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit Organization</span>
          </Button>
          <Button
            color="red"
            className="p-2"
            onClick={() => setDeleteOrganizationModalOpen(true)}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete Organization</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 lg:border-r lg:border-gray-200 dark:lg:border-zinc-800 lg:pr-8">
          <div className="py-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <Avatar
                className="h-24 w-24 mb-4"
                src={organization.image_url}
                initials={organization.name.substring(0, 2).toUpperCase()}
                alt={`${organization.name} logo`}
              />
              <h2 className="text-lg text-zinc-900 dark:text-zinc-100 text-center mb-2">
                {organization.name}
              </h2>
              {organization.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 text-center">
                  {organization.description}
                </p>
              )}
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Created{" "}
                {format(new Date(organization.created_at), "MMM d, yyyy")}
              </p>

              {/* Quick Stats */}
              <div className="w-full space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Members
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {organization.member_count}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Roles
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {organization.roles?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Workspaces
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    {organization.workspaces?.length || 0}
                  </span>
                </div>

                <div className="py-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Segments
                    </span>
                  </div>

                  <SegmentManager
                    targetId={organization.id}
                    targetType="organization"
                    currentSegments={organization.segments}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div>
            <SimpleTabs defaultTab={0} onChange={setActiveTab}>
              <Tab label="Overview">
                <div className="pt-6">
                  <div className="mb-8">
                    <h3 className="text-base text-zinc-900 dark:text-zinc-100 mb-4">
                      Organization Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Organization ID
                        </p>
                        <p className="text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                          {organization.id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Created
                        </p>
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">
                          {format(
                            new Date(organization.created_at),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Last Updated
                        </p>
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">
                          {format(
                            new Date(organization.updated_at),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="space-y-2">
                      <h3 className="text-xs text-zinc-500 dark:text-zinc-400">
                        Total Members
                      </h3>
                      <p className="text-base text-zinc-900 dark:text-zinc-100">
                        {organization.member_count}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-zinc-500 dark:text-zinc-400">
                        Total Roles
                      </h3>
                      <p className="text-base text-zinc-900 dark:text-zinc-100">
                        {organization.roles?.length || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-zinc-500 dark:text-zinc-400">
                        Total Workspaces
                      </h3>
                      <p className="text-base text-zinc-900 dark:text-zinc-100">
                        {organization.workspaces?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab label="Members">
                <div className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-zinc-900 dark:text-zinc-100">
                      Organization Members
                    </h3>
                    {membersData?.data && (
                      <Button onClick={() => setAddMemberModalOpen(true)}>
                        Add Member
                      </Button>
                    )}
                  </div>

                  {/* Search and Sort Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <InputGroup>
                        <MagnifyingGlassIcon />
                        <Input
                          name="search"
                          placeholder="Search members..."
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0); // Reset to first page on search
                          }}
                        />
                      </InputGroup>
                    </div>
                    <div className="w-full sm:w-64">
                      <Listbox
                        value={`${sortKey}-${sortOrder}`}
                        onChange={(value) => {
                          const [key, order] = value.split("-");
                          setSortKey(key);
                          setSortOrder(order);
                        }}
                      >
                        <ListboxOption value="created_at-desc">
                          <ListboxLabel>Date Joined (Newest)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="created_at-asc">
                          <ListboxLabel>Date Joined (Oldest)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="first_name-asc">
                          <ListboxLabel>First Name (A-Z)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="first_name-desc">
                          <ListboxLabel>First Name (Z-A)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="last_name-asc">
                          <ListboxLabel>Last Name (A-Z)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="last_name-desc">
                          <ListboxLabel>Last Name (Z-A)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="email-asc">
                          <ListboxLabel>Email (A-Z)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="email-desc">
                          <ListboxLabel>Email (Z-A)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="username-asc">
                          <ListboxLabel>Username (A-Z)</ListboxLabel>
                        </ListboxOption>
                        <ListboxOption value="username-desc">
                          <ListboxLabel>Username (Z-A)</ListboxLabel>
                        </ListboxOption>
                      </Listbox>
                    </div>
                  </div>

                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : !membersData?.data || membersData.data.length === 0 ? (
                    <EmptyState
                      title={
                        search ? "No members found" : "No members added yet"
                      }
                      description={
                        search
                          ? "Try adjusting your search terms."
                          : "Get started by adding your first organization member."
                      }
                      actionLabel={search ? undefined : "Add Member"}
                      onAction={
                        search ? undefined : () => setAddMemberModalOpen(true)
                      }
                      icon={<UsersIcon />}
                    />
                  ) : (
                    <>
                      <div className="divide-y divide-gray-200 dark:divide-zinc-800">
                        {membersData.data.map((member) => (
                          <div
                            key={member.id}
                            className="py-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                    {member.first_name} {member.last_name}
                                  </span>
                                  {member.username && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                      @{member.username}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {member.primary_email_address}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  {member.roles && member.roles.length > 0
                                    ? member.roles
                                      .map((role) => role.name)
                                      .join(", ")
                                    : "No roles assigned"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  onClick={() => handleEditMember(member)}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  onClick={() => handleDeleteMember(member)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Showing {page * pageSize + 1} to{" "}
                          {Math.min(
                            (page + 1) * pageSize,
                            page * pageSize + membersData.data.length,
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            outline
                            disabled={page === 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            className="p-2"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            outline
                            disabled={!membersData.has_more}
                            onClick={() => setPage((p) => p + 1)}
                            className="p-2"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Tab>

              <Tab label="Roles">
                <div className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-zinc-900 dark:text-zinc-100">
                      Organization Roles
                    </h3>
                    {organization.roles && organization.roles.length > 0 && (
                      <Button onClick={() => setCreateRoleModalOpen(true)}>
                        Create Role
                      </Button>
                    )}
                  </div>

                  {!organization.roles || organization.roles.length === 0 ? (
                    <EmptyState
                      title="No custom roles created yet"
                      description="Create custom roles to manage permissions within your organization."
                      actionLabel="Create Role"
                      onAction={() => setCreateRoleModalOpen(true)}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                          />
                        </svg>
                      }
                    />
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-zinc-800">
                      {organization.roles.map((role) => (
                        <div
                          key={role.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                  {role.name}
                                </span>
                                {role.is_deployment_level && (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {role.permissions.length} permissions
                                {role.is_deployment_level &&
                                  " • Cannot be edited or deleted"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!role.is_deployment_level && (
                                <>
                                  <button
                                    type="button"
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    onClick={() => handleEditRole(role)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    onClick={() => handleDeleteRole(role)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

              <Tab label="Workspaces">
                <div className="pt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-zinc-900 dark:text-zinc-100">
                      Organization Workspaces
                    </h3>
                    <div className="flex gap-2">
                      {organization.workspaces &&
                        organization.workspaces.length > 0 && (
                          <Button
                            onClick={() => setCreateWorkspaceModalOpen(true)}
                          >
                            Create Workspace
                          </Button>
                        )}
                    </div>
                  </div>

                  {!organization.workspaces ||
                    organization.workspaces.length === 0 ? (
                    <EmptyState
                      title="No workspaces created yet"
                      description="Create workspaces to organize your projects and teams."
                      actionLabel="Create Workspace"
                      onAction={() => setCreateWorkspaceModalOpen(true)}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                          />
                        </svg>
                      }
                    />
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-zinc-800">
                      {organization.workspaces.map((workspace) => (
                        <div
                          key={workspace.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              className="flex-1 text-left"
                              onClick={() =>
                                navigate(`../workspace/${workspace.id}`)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  navigate(`../workspace/${workspace.id}`);
                                }
                              }}
                              tabIndex={0}
                              type="button"
                              aria-label={`Navigate to ${workspace.name} workspace`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar
                                  className="size-8"
                                  src={workspace.image_url}
                                  initials={workspace.name
                                    .substring(0, 2)
                                    .toUpperCase()}
                                  alt={`${workspace.name} logo`}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                      {workspace.name}
                                    </span>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                      • {workspace.member_count} members
                                    </span>
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {workspace.segments?.map((s) => (
                                      <Badge
                                        key={s.id}
                                        color="zinc"
                                        className="text-[10px] px-1 py-0"
                                      >
                                        {s.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditWorkspace(workspace);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorkspace(workspace);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

              {deploymentSettings?.b2b_settings?.enterprise_sso_enabled && (
                <Tab label="Single Sign-On">
                  <EnterpriseSSO organizationId={organization.id} />
                </Tab>
              )}

              <Tab label="Metadata">
                <div className="pt-6 space-y-8">
                  {/* Public Metadata */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base text-zinc-900 dark:text-zinc-100">
                        Public Metadata
                      </h3>
                      {!isEditingPublicMetadata ? (
                        <Button
                          outline
                          onClick={() => setIsEditingPublicMetadata(true)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button outline onClick={handleCancelPublicMetadata}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePublicMetadata}>
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                      <Editor
                        height="120px"
                        defaultLanguage="json"
                        value={publicMetadata}
                        onChange={(value) => setPublicMetadata(value || "{}")}
                        theme={isDarkMode ? "vs-dark" : "vs"}
                        options={{
                          readOnly: !isEditingPublicMetadata,
                          minimap: { enabled: false },
                          fontSize: 13,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          formatOnPaste: true,
                          formatOnType: true,
                          wordWrap: "on",
                          lineNumbers: "off",
                          folding: false,
                          autoIndent: "full",
                          padding: { top: 8, bottom: 8 },
                          scrollbar: {
                            vertical: "auto",
                            horizontal: "hidden",
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Private Metadata */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base text-zinc-900 dark:text-zinc-100">
                        Private Metadata
                      </h3>
                      {!isEditingPrivateMetadata ? (
                        <Button
                          outline
                          onClick={() => setIsEditingPrivateMetadata(true)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button outline onClick={handleCancelPrivateMetadata}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePrivateMetadata}>
                            Save
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                      <Editor
                        height="120px"
                        defaultLanguage="json"
                        value={privateMetadata}
                        onChange={(value) => setPrivateMetadata(value || "{}")}
                        theme={isDarkMode ? "vs-dark" : "vs"}
                        options={{
                          readOnly: !isEditingPrivateMetadata,
                          minimap: { enabled: false },
                          fontSize: 13,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          formatOnPaste: true,
                          formatOnType: true,
                          wordWrap: "on",
                          lineNumbers: "off",
                          folding: false,
                          autoIndent: "full",
                          padding: { top: 8, bottom: 8 },
                          scrollbar: {
                            vertical: "auto",
                            horizontal: "hidden",
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Tab>
            </SimpleTabs>
          </div>
        </div>
      </div>

      {/* All Modals */}
      <EditOrganizationDialog
        isOpen={editOrganizationModalOpen}
        onClose={() => setEditOrganizationModalOpen(false)}
        organization={organization}
      />

      <DeleteConfirmationDialog
        isOpen={deleteOrganizationModalOpen}
        onClose={() => setDeleteOrganizationModalOpen(false)}
        onConfirm={handleDeleteOrganization}
        title="Delete Organization"
        description={`Are you sure you want to delete "${organization?.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Organization"
        isLoading={deleteOrganization.isPending}
      />

      <AddMemberDialog
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        organizationId={organization?.id || ""}
        availableRoles={convertToSimpleRoles(organization?.roles || [])}
      />

      {selectedMember && (
        <EditMemberDialog
          isOpen={editMemberModalOpen}
          onClose={() => setEditMemberModalOpen(false)}
          organizationId={organization?.id || ""}
          member={selectedMember}
          availableRoles={convertToSimpleRoles(organization?.roles || [])}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={deleteMemberModalOpen}
        onClose={() => setDeleteMemberModalOpen(false)}
        onConfirm={handleConfirmDeleteMember}
        title="Remove Member"
        description={`Are you sure you want to remove ${selectedMember?.first_name} ${selectedMember?.last_name} from this organization?`}
        confirmText="Remove Member"
        isLoading={removeMember.isPending}
      />

      <CreateRoleDialog
        isOpen={createRoleModalOpen}
        onClose={() => setCreateRoleModalOpen(false)}
        organizationId={organization?.id || ""}
      />

      {selectedRole && (
        <EditRoleDialog
          isOpen={editRoleModalOpen}
          onClose={() => setEditRoleModalOpen(false)}
          organizationId={organization?.id || ""}
          role={selectedRole}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={deleteRoleModalOpen}
        onClose={() => setDeleteRoleModalOpen(false)}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Role"
        description={`Are you sure you want to delete the "${selectedRole?.name}" role? This action cannot be undone.`}
        confirmText="Delete Role"
        isLoading={deleteRole.isPending}
      />

      <DeleteConfirmationDialog
        isOpen={deleteWorkspaceModalOpen}
        onClose={() => setDeleteWorkspaceModalOpen(false)}
        onConfirm={handleConfirmDeleteWorkspace}
        title="Delete Workspace"
        description={`Are you sure you want to delete the "${selectedWorkspace?.name}" workspace? This action cannot be undone and will remove all associated data including members and roles.`}
        confirmText="Delete Workspace"
        isLoading={deleteWorkspace.isPending}
      />
    </div>
  );
}
