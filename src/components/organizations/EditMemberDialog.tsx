import { useState, useEffect } from "react";
import { useUpdateOrganizationMember } from "@/lib/api/hooks/use-organization-mutations";
import {
	Dialog,
	DialogTitle,
	DialogBody,
	DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

import type {
	OrganizationMemberDetails,
	OrganizationRoleSimple,
} from "@/types/organization";

interface EditMemberDialogProps {
	isOpen: boolean;
	onClose: () => void;
	organizationId: string;
	member: OrganizationMemberDetails;
	availableRoles: OrganizationRoleSimple[];
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
						{availableRoles.length > 0 ? (
							<MultiSelect
								label="Assign Roles"
								options={availableRoles.map(role => ({
									id: role.id,
									name: role.is_deployment_level ? `${role.name} (Default)` : role.name,
									description: role.is_deployment_level
										? `Default deployment role • ${role.permissions.length} permission${role.permissions.length !== 1 ? 's' : ''}`
										: `${role.permissions.length} permission${role.permissions.length !== 1 ? 's' : ''}`
								}))}
								selectedValues={selectedRoles}
								onChange={setSelectedRoles}
								placeholder="Select roles to assign..."
							/>
						) : (
							<div className="text-sm text-gray-500 mt-2">
								No roles available. Create roles first to assign them to
								members.
							</div>
						)}
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
