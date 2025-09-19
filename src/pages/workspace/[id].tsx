import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { format } from "date-fns";
import { useWorkspaceDetails } from "@/lib/api/hooks/use-workspace-details";
import { useWorkspaceMembers } from "@/lib/api/hooks/use-workspace-members";
import { useDeleteWorkspace, useUpdateWorkspace } from "@/lib/api/hooks/use-workspace-mutations";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import Editor from "@monaco-editor/react";
import { DeleteConfirmationDialog } from "@/components/organizations/DeleteConfirmationDialog";
import { EditWorkspaceDialog } from "@/components/workspaces/EditWorkspaceDialog";
import { CreateWorkspaceRoleDialog } from "@/components/workspaces/CreateWorkspaceRoleDialog";
import { EditWorkspaceRoleDialog } from "@/components/workspaces/EditWorkspaceRoleDialog";
import { AddWorkspaceMemberDialog } from "@/components/workspaces/AddWorkspaceMemberDialog";
import { EditWorkspaceMemberDialog } from "@/components/workspaces/EditWorkspaceMemberDialog";
import { useDeleteWorkspaceRole } from "@/lib/api/hooks/use-workspace-role-mutations";
import { useRemoveWorkspaceMember } from "@/lib/api/hooks/use-workspace-mutations";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { WorkspaceRole } from "@/types/organization";
import { toast } from "sonner";

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function WorkspaceDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const workspaceId = id;
  const isDarkMode = useDarkMode();
  
  // Tab state - needs to be declared before use
  const [activeTab, setActiveTab] = useState(0);
  
  const {
    data: workspace,
    isLoading,
    error,
  } = useWorkspaceDetails(workspaceId);

  const deleteWorkspace = useDeleteWorkspace();
  const removeMember = useRemoveWorkspaceMember();
  const deleteWorkspaceRole = useDeleteWorkspaceRole();
  const updateWorkspace = useUpdateWorkspace();

  // Fetch members only when Members tab is active (tab index 1)
  const {
    data: membersData,
    isLoading: membersLoading,
  } = useWorkspaceMembers(workspaceId, 0, 100, activeTab === 1);

  // Metadata editor states
  const [publicMetadata, setPublicMetadata] = useState<string>("");
  const [privateMetadata, setPrivateMetadata] = useState<string>("");
  const [isEditingPublicMetadata, setIsEditingPublicMetadata] = useState(false);
  const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
    useState(false);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Role management states
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [deleteRoleModalOpen, setDeleteRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);
  
  // Member management states
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Initialize metadata when workspace data loads
  useEffect(() => {
    if (workspace) {
      setPublicMetadata(
        workspace.public_metadata
          ? JSON.stringify(workspace.public_metadata, null, 2)
          : "{}"
      );
      setPrivateMetadata(
        workspace.private_metadata
          ? JSON.stringify(workspace.private_metadata, null, 2)
          : "{}"
      );
    }
  }, [workspace]);



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Loading workspace details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">
            {error.message || "Failed to load workspace details"}
          </p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Workspace not found</p>
        </div>
      </div>
    );
  }

  const handleSavePublicMetadata = async () => {
    try {
      // Parse the JSON to validate it
      const parsedMetadata = JSON.parse(publicMetadata);
      
      // Create FormData with the updated public metadata
      const formData = new FormData();
      formData.append("public_metadata", JSON.stringify(parsedMetadata));
      
      await updateWorkspace.mutateAsync({
        workspaceId: workspaceId!,
        data: formData,
      });
      
      setIsEditingPublicMetadata(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format in public metadata");
      } else {
        console.error("Failed to save public metadata:", error);
      }
    }
  };

  const handleSavePrivateMetadata = async () => {
    try {
      // Parse the JSON to validate it
      const parsedMetadata = JSON.parse(privateMetadata);
      
      // Create FormData with the updated private metadata
      const formData = new FormData();
      formData.append("private_metadata", JSON.stringify(parsedMetadata));
      
      await updateWorkspace.mutateAsync({
        workspaceId: workspaceId!,
        data: formData,
      });
      
      setIsEditingPrivateMetadata(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format in private metadata");
      } else {
        console.error("Failed to save private metadata:", error);
      }
    }
  };

  // Role management handlers
  const handleEditRole = (role: WorkspaceRole) => {
    setSelectedRole(role);
    setEditRoleModalOpen(true);
  };

  const handleDeleteRole = (role: WorkspaceRole) => {
    setSelectedRole(role);
    setDeleteRoleModalOpen(true);
  };

  const handleConfirmDeleteRole = async () => {
    if (!selectedRole || !workspaceId) return;

    try {
      await deleteWorkspaceRole.mutateAsync({
        workspaceId,
        roleId: selectedRole.id,
      });
      setDeleteRoleModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  const handleCancelPublicMetadata = () => {
    setPublicMetadata(
      workspace?.public_metadata
        ? JSON.stringify(workspace.public_metadata, null, 2)
        : "{}"
    );
    setIsEditingPublicMetadata(false);
  };

  const handleCancelPrivateMetadata = () => {
    setPrivateMetadata(
      workspace?.private_metadata
        ? JSON.stringify(workspace.private_metadata, null, 2)
        : "{}"
    );
    setIsEditingPrivateMetadata(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace) return;

    try {
      await deleteWorkspace.mutateAsync(workspace.id);
      navigate("../organizations");
    } catch (error) {
      console.error("Failed to delete workspace:", error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg text-gray-900 dark:text-gray-100">
              {workspace.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Workspace ID: {workspace.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            outline
            className="p-2"
            onClick={() => setEditModalOpen(true)}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit Workspace</span>
          </Button>
          <Button
            color="red"
            className="p-2"
            onClick={() => setDeleteModalOpen(true)}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete Workspace</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 lg:border-r lg:border-gray-200 dark:lg:border-zinc-800 lg:pr-8">
          <div className="py-6">
            {/* Workspace Avatar */}
            <div className="flex flex-col items-center mb-6">
              <Avatar
                className="size-24 mb-4"
                src={workspace.image_url}
                initials={workspace.name.substring(0, 2).toUpperCase()}
                alt={`${workspace.name} logo`}
              />
              <h2 className="text-lg text-gray-900 dark:text-gray-100 text-center mb-2">
                {workspace.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Created {format(new Date(workspace.created_at), "MMM d, yyyy")}
              </p>

              {/* Quick Stats */}
              <div className="w-full space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {workspace.member_count ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Roles</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {workspace.roles ? workspace.roles.length : 0}
                  </span>
                </div>
              </div>

              {/* Workspace Details */}
              <div className="w-full space-y-3">
                {workspace.description && (
                  <div className="py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{workspace.description}</p>
                  </div>
                )}
                <div className="py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Organization</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{workspace.organization_name}</p>
                </div>
                <div className="py-2 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {format(new Date(workspace.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {format(new Date(workspace.updated_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <SimpleTabs defaultTab={0} onChange={setActiveTab}>
              <Tab label="Overview">
                <div className="px-4 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400">
                        Total Members
                      </h3>
                      <p className="text-base text-gray-900 dark:text-gray-100">
                        {workspace.member_count}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400">
                        Total Roles
                      </h3>
                      <p className="text-base text-gray-900 dark:text-gray-100">
                        {workspace.roles.length}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400">
                        Parent Organization
                      </h3>
                      <p className="text-base text-gray-900 dark:text-gray-100">
                        {workspace.organization_name}
                      </p>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab label="Members">
                <div className="px-4 py-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-gray-900 dark:text-gray-100">Workspace Members</h3>
                    <Button
                      onClick={() => setAddMemberModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Member
                    </Button>
                  </div>
                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : membersData?.data && membersData.data.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {membersData.data.map((member) => (
                        <div key={member.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                className="size-10"
                                initials={`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                                alt={`${member.first_name} ${member.last_name}`}
                              />
                              <div>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {member.first_name} {member.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {member.roles.length > 0 ? member.roles[0].name : 'No role'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                outline
                                onClick={() => {
                                  setSelectedMember(member);
                                  setEditMemberModalOpen(true);
                                }}
                                className="p-1.5"
                              >
                                <PencilIcon className="h-3.5 w-3.5" />
                                <span className="sr-only">Edit Member</span>
                              </Button>
                              <Button
                                outline
                                onClick={() => {
                                  setSelectedMember(member);
                                  setDeleteMemberModalOpen(true);
                                }}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                <span className="sr-only">Remove Member</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No members found"
                      description="This workspace doesn't have any members yet."
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
                  )}
                </div>
              </Tab>

              <Tab label="Roles">
                <div className="px-4 py-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base text-gray-900 dark:text-gray-100">Workspace Roles</h3>
                    {workspace.roles && workspace.roles.length > 0 && (
                      <Button
                        onClick={() => setCreateRoleModalOpen(true)}
                      >
                        Create Role
                      </Button>
                    )}
                  </div>
                  {!workspace.roles || workspace.roles.length === 0 ? (
                    <EmptyState
                      title="No custom roles created yet"
                      description="Create custom roles to manage permissions within your workspace."
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
                      {workspace.roles.map((role) => (
                        <div
                          key={role.id}
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {role.name}
                                </span>
                                {role.is_deployment_level && (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {role.permissions.length} permissions
                                {role.is_deployment_level && " • Cannot be edited or deleted"}
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

              <Tab label="Metadata">
                 <div className="px-4 py-6 space-y-8">
                   {/* Public Metadata */}
                   <div>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-base text-gray-900 dark:text-gray-100">Public Metadata</h3>
                       <div className="flex gap-2">
                         {isEditingPublicMetadata ? (
                           <>
                             <Button
                               outline
                               onClick={handleCancelPublicMetadata}
                             >
                               Cancel
                             </Button>
                             <Button
                               onClick={handleSavePublicMetadata}
                             >
                               Save
                             </Button>
                           </>
                         ) : (
                           <Button
                             outline
                             className="p-2"
                             onClick={() => setIsEditingPublicMetadata(true)}
                           >
                             <PencilIcon className="h-4 w-4" />
                             <span className="sr-only">Edit Public Metadata</span>
                           </Button>
                         )}
                       </div>
                     </div>
                     <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                       <Editor
                         height="200px"
                         language="json"
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
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg text-gray-900 dark:text-gray-100">Private Metadata</h3>
                       <div className="flex gap-2">
                         {isEditingPrivateMetadata ? (
                           <>
                             <Button
                               outline
                               onClick={handleCancelPrivateMetadata}
                             >
                               Cancel
                             </Button>
                             <Button
                               onClick={handleSavePrivateMetadata}
                             >
                               Save
                             </Button>
                           </>
                         ) : (
                           <Button
                             outline
                             className="p-2"
                             onClick={() => setIsEditingPrivateMetadata(true)}
                           >
                             <PencilIcon className="h-4 w-4" />
                             <span className="sr-only">Edit Private Metadata</span>
                           </Button>
                         )}
                       </div>
                     </div>
                     <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                       <Editor
                         height="200px"
                         language="json"
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

      {/* Edit Workspace Dialog */}
      <EditWorkspaceDialog
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        workspace={workspace}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${workspace?.name}"? This action cannot be undone and will remove all associated data including members and roles.`}
        confirmText="Delete Workspace"
        isLoading={deleteWorkspace.isPending}
      />

      {/* Create Workspace Role Dialog */}
      {workspaceId && (
        <CreateWorkspaceRoleDialog
          isOpen={createRoleModalOpen}
          onClose={() => setCreateRoleModalOpen(false)}
          workspaceId={workspaceId}
        />
      )}

      {/* Edit Workspace Role Dialog */}
      {workspaceId && selectedRole && (
        <EditWorkspaceRoleDialog
          isOpen={editRoleModalOpen}
          onClose={() => setEditRoleModalOpen(false)}
          workspaceId={workspaceId}
          role={selectedRole}
        />
      )}

      {/* Delete Role Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteRoleModalOpen}
        onClose={() => setDeleteRoleModalOpen(false)}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
        confirmText="Delete Role"
        isLoading={deleteWorkspaceRole.isPending}
      />
      
      {/* Add Workspace Member Dialog */}
      {workspaceId && (
        <AddWorkspaceMemberDialog
          isOpen={addMemberModalOpen}
          onClose={() => setAddMemberModalOpen(false)}
          workspaceId={workspaceId}
          availableRoles={workspace?.roles || []}
        />
      )}

      {/* Edit Workspace Member Dialog */}
      {workspaceId && selectedMember && (
        <EditWorkspaceMemberDialog
          isOpen={editMemberModalOpen}
          onClose={() => {
            setEditMemberModalOpen(false);
            setSelectedMember(null);
          }}
          workspaceId={workspaceId}
          member={selectedMember}
          availableRoles={workspace?.roles || []}
        />
      )}

      {/* Delete Member Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteMemberModalOpen}
        onClose={() => {
          setDeleteMemberModalOpen(false);
          setSelectedMember(null);
        }}
        onConfirm={async () => {
          if (selectedMember && workspaceId) {
            try {
              await removeMember.mutateAsync({
                workspaceId,
                membershipId: selectedMember.id,
              });
              setDeleteMemberModalOpen(false);
              setSelectedMember(null);
            } catch (error) {
              console.error("Failed to remove member:", error);
            }
          }
        }}
        title="Remove Member"
        description={`Are you sure you want to remove ${selectedMember?.first_name} ${selectedMember?.last_name} from this workspace? This action cannot be undone.`}
        confirmText="Remove Member"
        isLoading={removeMember.isPending}
      />
    </div>
  );
}
