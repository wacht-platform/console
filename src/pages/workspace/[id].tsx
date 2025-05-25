import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { format } from "date-fns";
import { useWorkspaceDetails } from "@/lib/api/hooks/use-workspace-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import Editor from "@monaco-editor/react";

import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UsersIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export default function WorkspaceDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const workspaceId = id;
  const {
    data: workspace,
    isLoading,
    error,
  } = useWorkspaceDetails(workspaceId);

  // Metadata editor states
  const [publicMetadata, setPublicMetadata] = useState<string>("");
  const [privateMetadata, setPrivateMetadata] = useState<string>("");
  const [isEditingPublicMetadata, setIsEditingPublicMetadata] = useState(false);
  const [isEditingPrivateMetadata, setIsEditingPrivateMetadata] =
    useState(false);

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

  const handleBack = () => {
    navigate("/workspaces");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading workspace details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">
            {error.message || "Failed to load workspace details"}
          </p>
          <Button onClick={handleBack} className="mt-4">
            Back to Workspaces
          </Button>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Workspace not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Workspaces
          </Button>
        </div>
      </div>
    );
  }

  const handleSavePublicMetadata = async () => {
    try {
      // TODO: Implement update workspace API call
      setIsEditingPublicMetadata(false);
      console.log("Public metadata updated successfully");
    } catch (error) {
      console.error("Failed to save public metadata:", error);
    }
  };

  const handleSavePrivateMetadata = async () => {
    try {
      // TODO: Implement update workspace API call
      setIsEditingPrivateMetadata(false);
      console.log("Private metadata updated successfully");
    } catch (error) {
      console.error("Failed to save private metadata:", error);
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

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Workspace profile card */}
        <Card className="lg:col-span-1 shadow-sm border-0 overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Workspace Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar
              className="h-24 w-24 mb-4"
              initials={workspace.name.substring(0, 2).toUpperCase()}
            />
            <h2 className="text-xl font-bold mb-1">{workspace.name}</h2>
            <p className="text-sm text-gray-500 mb-2">
              {workspace.description}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
              <BuildingOfficeIcon className="h-4 w-4" />
              <span>{workspace.organization_name}</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Created {format(new Date(workspace.created_at), "MMMM d, yyyy")}
            </p>

            <div className="flex gap-2 w-full">
              <Button
                outline
                className="flex-1 flex items-center justify-center gap-1 text-sm py-2"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Workspace
              </Button>
              <Button
                outline
                className="flex-1 flex items-center justify-center gap-1 text-sm py-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workspace information card */}
        <Card className="lg:col-span-2 shadow-sm border-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Workspace Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Workspace ID
                </p>
                <p className="font-mono text-sm">{workspace.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Organization
                </p>
                <p className="text-sm">{workspace.organization_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Member Count
                </p>
                <p className="text-sm">{workspace.member_count}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Created At
                </p>
                <p className="text-sm">
                  {format(
                    new Date(workspace.created_at),
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
                    new Date(workspace.updated_at),
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
                    <p className="text-base">{workspace.member_count}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Total Roles
                    </h3>
                    <p className="text-base">{workspace.roles.length}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Parent Organization
                    </h3>
                    <p className="text-base">{workspace.organization_name}</p>
                  </div>
                </div>
              </div>
            </Tab>

            <Tab label="Members">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Workspace Members</h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Member
                  </Button>
                </div>

                {!workspace.members || workspace.members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 mx-auto mb-4 text-gray-400">
                      <UsersIcon />
                    </div>
                    <p className="text-gray-500 mb-4">No members added yet</p>
                    <Button outline>Add Member</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workspace.members.map((member) => (
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
                          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600">
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
                  <h3 className="text-lg font-medium">Workspace Roles</h3>
                  <Button
                    outline
                    className="flex items-center gap-1 text-sm py-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create Role
                  </Button>
                </div>

                {!workspace.roles || workspace.roles.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No custom roles created yet
                    </p>
                    <Button outline>Create Role</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workspace.roles.map((role) => (
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
                          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600">
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
    </div>
  );
}
