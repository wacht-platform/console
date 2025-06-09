import React, { useState, useEffect } from "react";
import { useUpdateOrganizationRole } from "@/lib/api/hooks/use-organization-mutations";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
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

interface EditRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  role: {
    id: string;
    name: string;
    permissions: Array<string>;
  };
}

export function EditRoleDialog({
  isOpen,
  onClose,
  organizationId,
  role,
}: EditRoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });

  const updateRole = useUpdateOrganizationRole();
  const { deploymentSettings } = useCurrentDeployemnt();

  // Get available permissions from deployment B2B settings
  const availablePermissions = React.useMemo(() => {
    const orgPermissions = deploymentSettings?.b2b_settings?.organization_permissions || [];

    // Convert to options format - just show the permission string as-is
    return orgPermissions.map(permission => ({
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
        organizationId,
        roleId: role.id,
        data: {
          name:
            formData.name.trim() !== role.name
              ? formData.name.trim()
              : undefined,
          permissions:
            JSON.stringify(formData.permissions) !==
            JSON.stringify(role.permissions.map((p) => p))
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
      <DialogTitle>Edit Organization Role</DialogTitle>

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
        <Button
          type="button"
          outline
          onClick={onClose}
          disabled={updateRole.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={updateRole.isPending || !formData.name.trim()}
        >
          {updateRole.isPending ? "Updating..." : "Update Role"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
