import React, { useState, useEffect } from "react";
import { useUpdateWorkspaceRole } from "@/lib/api/hooks/use-workspace-role-mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const availablePermissions = React.useMemo(() => {
    const workspacePermissions = deploymentSettings?.b2b_settings?.workspace_permissions || [];
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
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Workspace Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
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
            </div>

            <MultiSelect
              label="Permissions"
              options={availablePermissions}
              selectedValues={formData.permissions}
              onChange={(permissions) => setFormData(prev => ({ ...prev, permissions }))}
              placeholder="Select permissions for this role..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || updateRole.isPending}
          >
            {updateRole.isPending ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
