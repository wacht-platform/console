import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { useOrganizationDetails } from "@/lib/api/hooks/use-organization-details";
import {
  useUpdateOrganization,
  useDeleteOrganization,
  useRemoveOrganizationMember,
  useDeleteOrganizationRole,
} from "@/lib/api/hooks/use-organization-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import Editor from "@monaco-editor/react";
import { CreateWorkspaceModal } from "@/components/workspaces/CreateWorkspaceModal";
import { EditOrganizationDialog } from "@/components/organizations/EditOrganizationDialog";
import { AddMemberDialog } from "@/components/organizations/AddMemberDialog";
import { EditMemberDialog } from "@/components/organizations/EditMemberDialog";
import { CreateRoleDialog } from "@/components/organizations/CreateRoleDialog";
import { EditRoleDialog } from "@/components/organizations/EditRoleDialog";
import { DeleteConfirmationDialog } from "@/components/organizations/DeleteConfirmationDialog";

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export default function OrganizationDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const organizationId = id;
  const {
    data: organization,
    isLoading,
    error,
  } = useOrganizationDetails(organizationId);

  // Metadata editor states
  const [publicMetadata, setPublicMetadata] = useState<string>("");
  const [privateMetadata, setPrivateMetadata] = useState<string>("");
  const [isEditingPublicMetadata, setIsEditingPublicMetadata] = useState(false);
  const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
    useState(false);

  // Workspace creation modal state
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] =
    useState(false);

  // Organization management modal states
  const [editOrganizationModalOpen, setEditOrganizationModalOpen] =
    useState(false);
  const [deleteOrganizationModalOpen, setDeleteOrganizationModalOpen] =
    useState(false);

  // Member management modal states
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);

  // Role management modal states
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);

  // Mutations
  const updateOrganization = useUpdateOrganization();
  const deleteOrganization = useDeleteOrganization();
  const removeMember = useRemoveOrganizationMember();
  const deleteRole = useDeleteOrganizationRole();

  // Initialize metadata when organization data loads
  useEffect(() => {
    if (organization) {
      setPublicMetadata(
        organization.public_metadata
          ? JSON.stringify(organization.public_metadata, null, 2)
          : "{}"
      );
      setPrivateMetadata(
        organization.private_metadata
          ? JSON.stringify(organization.private_metadata, null, 2)
          : "{}"
      );
    }
  }, [organization]);

  const handleBack = () => {
    navigate("/organizations");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading organization details...</p>
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
          <Button onClick={handleBack} className="mt-4">
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Organization not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Organizations
          </Button>
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
    } catch (error) {
      console.error("Failed to save public metadata:", error);
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
    } catch (error) {
      console.error("Failed to save private metadata:", error);
    }
  };

  const handleCancelPublicMetadata = () => {
    setPublicMetadata(
      organization?.public_metadata
        ? JSON.stringify(organization.public_metadata, null, 2)
        : "{}"
    );
    setIsEditingPublicMetadata(false);
  };

  const handleCancelPrivateMetadata = () => {
    setPrivateMetadata(
      organization?.private_metadata
        ? JSON.stringify(organization.private_metadata, null, 2)
        : "{}"
    );
    setIsEditingPrivateMetadata(false);
  };

  // Organization handlers
  const handleDeleteOrganization = async () => {
    try {
      await deleteOrganization.mutateAsync(organization.id);
      navigate("/organizations");
    } catch (error) {
      console.error("Failed to delete organization:", error);
    }
  };

  // Member handlers
  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setEditMemberModalOpen(true);
  };

  const handleDeleteMember = (member: any) => {
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
  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setEditRoleModalOpen(true);
  };

  const handleDeleteRole = (role: any) => {
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

  return (
    <div className="container mx-auto">
      <CreateWorkspaceModal
        isOpen={createWorkspaceModalOpen}
        onClose={() => setCreateWorkspaceModalOpen(false)}
        organizationId={organization.id}
        organizationName={organization.name}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Organization profile card */}
        <Card className="lg:col-span-1 shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Organization Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar
              className="h-24 w-24 mb-4"
              initials={organization.name.substring(0, 2).toUpperCase()}
            />
            <h2 className="text-xl font-bold mb-1">{organization.name}</h2>
            <p className="text-sm text-gray-500 mb-2">
              {organization.description}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Created{" "}
              {format(new Date(organization.created_at), "MMMM d, yyyy")}
            </p>

            <div className="flex gap-2 w-full">
              <Button
                outline
                className="flex-1 flex items-center justify-center gap-1 text-sm py-2"
                onClick={() => setEditOrganizationModalOpen(true)}
              >
                <PencilIcon className="h-4 w-4" />
                Edit Organization
              </Button>
              <Button
                outline
                className="flex-1 flex items-center justify-center gap-1 text-sm py-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setDeleteOrganizationModalOpen(true)}
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Organization information card */}
        <Card className="lg:col-span-2 shadow-sm border-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Organization ID
                </p>
                <p className="font-mono text-sm">{organization.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Member Count
                </p>
                <p className="text-sm">{organization.member_count}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Created At
                </p>
                <p className="text-sm">
                  {format(
                    new Date(organization.created_at),
                    "MMM d, yyyy, h:mm:ss a"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Last Updated
                </p>
                <p className="text-sm">
                  {format(
                    new Date(organization.updated_at),
                    "MMM d, yyyy, h:mm:ss a"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="shadow-sm border-0 overflow-hidden">
        <div className="p-0">
          <SimpleTabs defaultTab={0}>
            <Tab label="Overview">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Members
                    </h3>
                    <p className="text-base">{organization.member_count}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Roles
                    </h3>
                    <p className="text-base">{organization.roles.length}</p>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab label="Members">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Organization Members</h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                    onClick={() => setAddMemberModalOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Member
                  </Button>
                </div>

                {!organization.members || organization.members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
                      <UsersIcon />
                    </div>
                    <p className="text-gray-500 mb-4">No members added yet</p>
                    <Button outline onClick={() => setAddMemberModalOpen(true)}>
                      Add Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organization.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </span>
                            {member.username && (
                              <span className="text-sm text-gray-500">
                                @{member.username}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.primary_email_address}
                            {member.primary_phone_number && (
                              <span> • {member.primary_phone_number}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined{" "}
                            {format(new Date(member.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            onClick={() => handleEditMember(member)}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600"
                            onClick={() => handleDeleteMember(member)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab label="Roles">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Organization Roles</h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                    onClick={() => setCreateRoleModalOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create Role
                  </Button>
                </div>

                {!organization.roles || organization.roles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No custom roles created yet
                    </p>
                    <Button
                      outline
                      onClick={() => setCreateRoleModalOpen(true)}
                    >
                      Create Role
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organization.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {role.name}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {role.permissions.length} permissions
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            onClick={() => handleEditRole(role)}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600"
                            onClick={() => handleDeleteRole(role)}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab label="Workspaces">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Organization Workspaces
                  </h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                    onClick={() => setCreateWorkspaceModalOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create Workspace
                  </Button>
                </div>

                {!organization.workspaces ||
                organization.workspaces.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No workspaces created yet
                    </p>
                    <Button
                      outline
                      onClick={() => setCreateWorkspaceModalOpen(true)}
                    >
                      Create Workspace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organization.workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 rounded-lg px-4"
                        onClick={() => navigate(`../workspace/${workspace.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">
                              {workspace.name}
                            </span>
                          </div>
                          {workspace.description && (
                            <div className="text-sm text-gray-500 mb-2">
                              {workspace.description}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {workspace.member_count} members • Created{" "}
                            {format(
                              new Date(workspace.created_at),
                              "MMM d, yyyy"
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add edit workspace functionality
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add delete workspace functionality
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab>

            <Tab label="Metadata">
              <div className="p-6 space-y-8">
                {/* Public Metadata */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Public Metadata</h3>
                    {!isEditingPublicMetadata ? (
                      <Button
                        outline
                        className="flex items-center gap-1 text-sm py-2"
                        onClick={() => setIsEditingPublicMetadata(true)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          outline
                          className="text-sm py-2"
                          onClick={handleCancelPublicMetadata}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="text-sm py-2"
                          onClick={handleSavePublicMetadata}
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                    <Editor
                      height="120px"
                      defaultLanguage="json"
                      value={publicMetadata}
                      onChange={(value) => setPublicMetadata(value || "{}")}
                      theme="vs"
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
                    <h3 className="text-lg font-medium">Private Metadata</h3>
                    {!isEditingPrivateMetadata ? (
                      <Button
                        outline
                        className="flex items-center gap-1 text-sm py-2"
                        onClick={() => setIsEditingPrivateMetadata(true)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          outline
                          className="text-sm py-2"
                          onClick={handleCancelPrivateMetadata}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="text-sm py-2"
                          onClick={handleSavePrivateMetadata}
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                    <Editor
                      height="120px"
                      defaultLanguage="json"
                      value={privateMetadata}
                      onChange={(value) => setPrivateMetadata(value || "{}")}
                      theme="vs"
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
      </Card>

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
        availableRoles={organization?.roles || []}
      />

      {selectedMember && (
        <EditMemberDialog
          isOpen={editMemberModalOpen}
          onClose={() => setEditMemberModalOpen(false)}
          organizationId={organization?.id || ""}
          member={selectedMember}
          availableRoles={organization?.roles || []}
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
    </div>
  );
}
