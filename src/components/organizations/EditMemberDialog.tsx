import { useState, useEffect } from "react";
import { useUpdateOrganizationMember } from "@/lib/api/hooks/use-organization-mutations";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/fieldset";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";

interface EditMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    primary_email_address: string | null;
    roles: Array<{ id: string; name: string }>;
  };
  availableRoles: Array<{
    id: string;
    name: string;
  }>;
}

export function EditMemberDialog({
  isOpen,
  onClose,
  organizationId,
  member,
  availableRoles,
}: EditMemberDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const updateMember = useUpdateOrganizationMember();

  useEffect(() => {
    if (member) {
      setSelectedRoles(member.roles.map((role) => role.id));
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMember.mutateAsync({
        organizationId,
        membershipId: member.id,
        data: {
          role_ids: selectedRoles,
        },
      });
      onClose();
    } catch (error) {
      console.error("Failed to update member:", error);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Edit Member Roles</DialogTitle>

      <DialogBody>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium">
              {member.first_name} {member.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {member.primary_email_address}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Assign Roles</Label>
              <div className="space-y-2 mt-2">
                {availableRoles.map((role) => (
                  <CheckboxField key={role.id}>
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                    />
                    <Label className="text-sm">{role.name}</Label>
                  </CheckboxField>
                ))}
              </div>
              {availableRoles.length === 0 && (
                <div className="text-sm text-gray-500 mt-2">
                  No roles available. Create roles first to assign them to
                  members.
                </div>
              )}
            </div>
          </form>
        </div>
      </DialogBody>

      <DialogActions>
        <Button
          type="button"
          outline
          onClick={onClose}
          disabled={updateMember.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={updateMember.isPending}
        >
          {updateMember.isPending ? "Updating..." : "Update Roles"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
