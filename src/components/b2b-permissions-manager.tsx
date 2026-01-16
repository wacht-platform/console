import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentB2bSettings } from "@/lib/api/hooks/use-update-deployment-b2b-settings";
import { toast } from "sonner";

export function B2bPermissionsManager() {
  const { deploymentSettings, isLoading } = useCurrentDeployemnt();
  const updateB2bSettings = useUpdateDeploymentB2bSettings();

  const [workspacePermissions, setWorkspacePermissions] = useState<string[]>([]);
  const [organizationPermissions, setOrganizationPermissions] = useState<string[]>([]);
  const [newWorkspacePermission, setNewWorkspacePermission] = useState("");
  const [newOrganizationPermission, setNewOrganizationPermission] = useState("");

  useEffect(() => {
    if (deploymentSettings?.b2b_settings) {
      setWorkspacePermissions(
        deploymentSettings.b2b_settings.workspace_permissions || []
      );
      setOrganizationPermissions(
        deploymentSettings.b2b_settings.organization_permissions || []
      );
    }
  }, [deploymentSettings]);

  const handleAddWorkspacePermission = () => {
    const permission = newWorkspacePermission.trim();
    if (permission && !workspacePermissions.includes(permission)) {
      setWorkspacePermissions([...workspacePermissions, permission]);
      setNewWorkspacePermission("");
    }
  };

  const handleAddOrganizationPermission = () => {
    const permission = newOrganizationPermission.trim();
    if (permission && !organizationPermissions.includes(permission)) {
      setOrganizationPermissions([...organizationPermissions, permission]);
      setNewOrganizationPermission("");
    }
  };

  const handleRemoveWorkspacePermission = (permission: string) => {
    setWorkspacePermissions(workspacePermissions.filter(p => p !== permission));
  };

  const handleRemoveOrganizationPermission = (permission: string) => {
    setOrganizationPermissions(organizationPermissions.filter(p => p !== permission));
  };

  const handleSave = async () => {
    try {
      await updateB2bSettings.mutateAsync({
        workspace_permissions: workspacePermissions,
        organization_permissions: organizationPermissions
      });
      toast.success("Permissions updated successfully");
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Organization Permissions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Organization Permissions
        </h4>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., organization:billing"
            value={newOrganizationPermission}
            onChange={(e) => setNewOrganizationPermission(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddOrganizationPermission()}
            className="flex-1"
          />
          <Button onClick={handleAddOrganizationPermission} variant="outline">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {organizationPermissions.length === 0 ? (
            <span className="text-sm text-gray-500 dark:text-gray-400 italic">
              No permissions configured
            </span>
          ) : (
            organizationPermissions.map((permission) => (
              <Badge
                key={permission}
                color="blue"
                className="flex items-center gap-1"
              >
                {permission}
                <button
                  onClick={() => handleRemoveOrganizationPermission(permission)}
                  className="ml-1 hover:text-red-500"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Workspace Permissions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Workspace Permissions
        </h4>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., workspace:deploy"
            value={newWorkspacePermission}
            onChange={(e) => setNewWorkspacePermission(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddWorkspacePermission()}
            className="flex-1"
          />
          <Button onClick={handleAddWorkspacePermission} variant="outline">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {workspacePermissions.length === 0 ? (
            <span className="text-sm text-gray-500 dark:text-gray-400 italic">
              No permissions configured
            </span>
          ) : (
            workspacePermissions.map((permission) => (
              <Badge
                key={permission}
                color="green"
                className="flex items-center gap-1"
              >
                {permission}
                <button
                  onClick={() => handleRemoveWorkspacePermission(permission)}
                  className="ml-1 hover:text-red-500"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateB2bSettings.isPending}
        >
          {updateB2bSettings.isPending ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}