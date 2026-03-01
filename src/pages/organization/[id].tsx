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
import { Input } from "@/components/ui/input";
import { Listbox, ListboxLabel, ListboxOption } from "@/components/ui/listbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import Editor from "@monaco-editor/react";
import { CreateWorkspaceModal } from "@/components/workspaces/CreateWorkspaceModal";
import { EditWorkspaceDialog } from "@/components/workspaces/EditWorkspaceDialog";
import { EditOrganizationDialog } from "@/components/organizations/EditOrganizationDialog";
import { AddMemberDialog } from "@/components/organizations/AddMemberDialog";
import { EditMemberDialog } from "@/components/organizations/EditMemberDialog";
import { CreateRoleDialog } from "@/components/organizations/CreateRoleDialog";
import { EditRoleDialog } from "@/components/organizations/EditRoleDialog";
import { DeleteConfirmationDialog } from "@/components/organizations/DeleteConfirmationDialog";
import { InlineLoader } from "@/components/ui/loading-screen";
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
    return <InlineLoader />;
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
    <div>
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
          <Avatar className="h-16 w-16">
            <AvatarImage src={organization.image_url} alt={`${organization.name} logo`} />
            <AvatarFallback>{organization.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-normal text-zinc-900 dark:text-zinc-100">
              {organization.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Organization ID: {organization.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOrganizationModalOpen(true)}
            className="h-8 gap-1.5 font-normal"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeleteOrganizationModalOpen(true)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-normal">{organization.member_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-normal">{organization.roles?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-normal">{organization.workspaces?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Workspaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-normal">{organization.roles?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" onValueChange={(value) => {
        const tabIndex = ["overview", "members", "roles", "workspaces", "metadata", "sso"].indexOf(value);
        setActiveTab(tabIndex);
      }}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          {deploymentSettings?.b2b_settings?.enterprise_sso_enabled && (
            <TabsTrigger value="sso">SSO</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="pt-4">
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
          </div>

          {/* Segments Section */}
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
            <h3 className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">
              Segments
            </h3>
            <SegmentManager
              targetId={organization.id}
              targetType="organization"
              currentSegments={organization.segments}
            />
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="pt-4">
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


            {membersLoading ? (
              <InlineLoader />
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
                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="search"
                      placeholder="Search members..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0); // Reset to first page on search
                      }}
                    />
                  </div>
                  <div className="w-full sm:w-64">
                    <Listbox
                      className="w-full"
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersData.data.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {member.first_name} {member.last_name}
                            </div>
                            {member.username && (
                              <div className="text-xs text-muted-foreground">
                                @{member.username}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.primary_email_address}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.roles && member.roles.length > 0
                            ? member.roles.map((role) => role.name).join(", ")
                            : "No roles"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    Showing {page * pageSize + 1} to{" "}
                    {Math.min(
                      (page + 1) * pageSize,
                      page * pageSize + membersData.data.length
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="p-2"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
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
        </TabsContent>

        <TabsContent value="roles">
          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{role.name}</span>
                          {role.is_deployment_level && (
                            <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-normal text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                              Default
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {role.permissions.length} permissions
                        {role.is_deployment_level && " • Cannot be edited or deleted"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!role.is_deployment_level && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditRole(role)}
                              >
                                <PencilIcon className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteRole(role)}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="workspaces">
          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Segments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.workspaces.map((workspace) => (
                    <TableRow
                      key={workspace.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`../workspace/${workspace.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={workspace.image_url} alt={`${workspace.name} logo`} />
                            <AvatarFallback>{workspace.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                {workspace.name}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {workspace.member_count} members
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {workspace.segments?.map((s) => (
                            <Badge
                              key={s.id}
                              variant="secondary"
                              className="text-xs px-1 py-0 h-5"
                            >
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWorkspace(workspace);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {deploymentSettings?.b2b_settings?.enterprise_sso_enabled && (
          <TabsContent value="sso">
            <EnterpriseSSO organizationId={organization.id} />
          </TabsContent>
        )}

        <TabsContent value="metadata">
          <div className="pt-4 space-y-8">
            {/* Public Metadata */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base text-zinc-900 dark:text-zinc-100">
                  Public Metadata
                </h3>
                {!isEditingPublicMetadata ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingPublicMetadata(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelPublicMetadata}>
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
                    variant="outline"
                    onClick={() => setIsEditingPrivateMetadata(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelPrivateMetadata}>
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
        </TabsContent>
      </Tabs>

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

      {
        selectedMember && (
          <EditMemberDialog
            isOpen={editMemberModalOpen}
            onClose={() => setEditMemberModalOpen(false)}
            organizationId={organization?.id || ""}
            member={selectedMember}
            availableRoles={convertToSimpleRoles(organization?.roles || [])}
          />
        )
      }

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

      {
        selectedRole && (
          <EditRoleDialog
            isOpen={editRoleModalOpen}
            onClose={() => setEditMemberModalOpen(false)}
            organizationId={organization?.id || ""}
            role={selectedRole}
          />
        )
      }

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
    </div >
  );
}
