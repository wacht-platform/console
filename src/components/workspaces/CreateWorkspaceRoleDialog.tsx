import React, { useState } from "react";
import { useCreateWorkspaceRole } from "@/lib/api/hooks/use-workspace-role-mutations";
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

interface CreateWorkspaceRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateWorkspaceRoleDialog({
  isOpen,
  onClose,
  workspaceId,
}: CreateWorkspaceRoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });

  const createRole = useCreateWorkspaceRole();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      await createRole.mutateAsync({
        workspaceId,
        data: {
          name: formData.name.trim(),
          permissions: formData.permissions,
        },
      });
      onClose();
      setFormData({ name: "", permissions: [] });
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Create Workspace Role</DialogTitle>

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
        <Button outline onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || createRole.isPending}
        >
          {createRole.isPending ? "Creating..." : "Create Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
