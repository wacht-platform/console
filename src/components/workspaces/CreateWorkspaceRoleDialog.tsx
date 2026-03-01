import React, { useState } from "react";
import { useCreateWorkspaceRole } from "@/lib/api/hooks/use-workspace-role-mutations";
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
  const availablePermissions = React.useMemo(() => {
    const workspacePermissions = deploymentSettings?.b2b_settings?.workspace_permissions || [];
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
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workspace Role</DialogTitle>
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
            disabled={!formData.name.trim() || createRole.isPending}
          >
            {createRole.isPending ? "Creating..." : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
