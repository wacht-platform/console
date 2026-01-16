import React, { useState } from "react";
import { useCreateOrganizationRole } from "@/lib/api/hooks/use-organization-mutations";
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

interface CreateRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

export function CreateRoleDialog({
  isOpen,
  onClose,
  organizationId,
}: CreateRoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });

  const createRole = useCreateOrganizationRole();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      await createRole.mutateAsync({
        organizationId,
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
          <DialogTitle>Create Organization Role</DialogTitle>
        </DialogHeader>

        <div className="py-4">
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
            disabled={createRole.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={createRole.isPending || !formData.name.trim()}
          >
            {createRole.isPending ? "Creating..." : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
