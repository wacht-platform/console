import React, { useState, useEffect } from "react";
import { useUpdateOrganizationRole } from "@/lib/api/hooks/use-organization-mutations";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
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

  const availablePermissions = React.useMemo(() => {
    const orgPermissions =
      deploymentSettings?.b2b_settings?.organization_permissions || [];

    return orgPermissions.map((permission) => ({
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
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Organization Role</DialogTitle>
        </DialogHeader>

        <div className="py-2">
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
                onChange={(permissions) =>
                  setFormData((prev) => ({ ...prev, permissions }))
                }
                placeholder="Select permissions for this role..."
              />
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
