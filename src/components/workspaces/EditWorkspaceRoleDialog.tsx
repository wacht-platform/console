import React, { useState, useEffect } from "react";
import { useUpdateWorkspaceRole } from "@/lib/api/hooks/use-workspace-role-mutations";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/fieldset";
import { MultiSelect } from "@/components/ui/multi-select";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { WorkspaceRole } from "@/types/organization";

interface EditWorkspaceRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  role: WorkspaceRole;
}

export function EditWorkspaceRoleDialog({
  isOpen,
  onClose,
  workspaceId,
  role,
}: EditWorkspaceRoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });

  const updateRole = useUpdateWorkspaceRole();
  const { deploymentSettings } = useCurrentDeployemnt();

  // Get available permissions from deployment B2B settings
  const availablePermissions = React.useMemo(() => {
    const workspacePermissions = deploymentSettings?.b2b_settings?.workspace_permissions || [];

    // Convert to options format - just show the permission string as-is
    return workspacePermissions.map(permission => ({
      id: permission,
      name: permission,
      description: permission,
    }));
  }, [deploymentSettings]);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        permissions: role.permissions,
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      await updateRole.mutateAsync({
        workspaceId,
        roleId: role.id,
        data: {
          name:
            formData.name.trim() !== role.name
              ? formData.name.trim()
              : undefined,
          permissions:
            JSON.stringify(formData.permissions) !==
            JSON.stringify(role.permissions)
              ? formData.permissions
              : undefined,
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Edit Workspace Role</DialogTitle>

      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Field>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter role name"
                required
              />
            </Field>

            <MultiSelect
              label="Permissions"
              options={availablePermissions}
              selectedValues={formData.permissions}
              onChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
              placeholder="Select permissions for this role..."
            />
          </div>
        </form>
      </DialogBody>

      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || updateRole.isPending}
        >
          {updateRole.isPending ? "Updating..." : "Update Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
