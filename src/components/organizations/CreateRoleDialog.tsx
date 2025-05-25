import { useState } from "react";
import { useCreateOrganizationRole } from "@/lib/api/hooks/use-organization-mutations";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/fieldset";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";

interface CreateRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: "read", name: "Read", description: "View organization data" },
  {
    id: "write",
    name: "Write",
    description: "Create and edit organization data",
  },
  { id: "delete", name: "Delete", description: "Delete organization data" },
  {
    id: "manage_members",
    name: "Manage Members",
    description: "Add and remove organization members",
  },
  {
    id: "manage_roles",
    name: "Manage Roles",
    description: "Create and edit organization roles",
  },
  { id: "admin", name: "Admin", description: "Full administrative access" },
];

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

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Create Organization Role</DialogTitle>

      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
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

            <div>
              <Label>Permissions</Label>
              <div className="space-y-3 mt-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <CheckboxField key={permission.id}>
                    <Checkbox
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {permission.name}
                      </Label>
                      <div className="text-xs text-gray-500 mt-1">
                        {permission.description}
                      </div>
                    </div>
                  </CheckboxField>
                ))}
              </div>
            </div>
          </div>
        </form>
      </DialogBody>

      <DialogActions>
        <Button
          type="button"
          outline
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
      </DialogActions>
    </Dialog>
  );
}
