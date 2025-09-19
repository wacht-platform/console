import { useState, useMemo, useEffect } from "react";
import { useAddWorkspaceMember } from "@/lib/api/hooks/use-workspace-mutations";
import { useDeploymentUsers } from "@/lib/api/hooks/use-deployment-users";
import {
	Dialog,
	DialogTitle,
	DialogBody,
	DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { MultiSelect } from "@/components/ui/multi-select";
import { ModalCombobox } from "@/components/ui/modal-combobox";
import type { WorkspaceRole } from "@/types/organization";
import type { UserWithIdentifiers } from "@/types/user";

interface AddWorkspaceMemberDialogProps {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
	availableRoles: WorkspaceRole[];
}

export function AddWorkspaceMemberDialog({
	isOpen,
	onClose,
	workspaceId,
	availableRoles,
}: AddWorkspaceMemberDialogProps) {
	const [selectedUser, setSelectedUser] = useState<UserWithIdentifiers | null>(null);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

	// Fetch all users when dialog opens
	const { data: users, isLoading: usersLoading } = useDeploymentUsers({
		limit: 100,
		enabled: isOpen,
	});

	const addMember = useAddWorkspaceMember();

	// Reset state when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setSelectedUser(null);
			setSelectedRoles([]);
		}
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedUser) {
			return;
		}

		try {
			await addMember.mutateAsync({
				workspaceId,
				data: {
					user_id: selectedUser.id,
					role_ids: selectedRoles,
				},
			});
			onClose();
		} catch (error) {
			console.error("Failed to add member:", error);
		}
	};

	const userOptions = useMemo(() => {
		return users?.data || [];
	}, [users?.data]);

	// Display value function for the combobox
	const displayUserValue = (user: UserWithIdentifiers | null) => {
		if (!user) return "";
		const name = `${user.first_name} ${user.last_name}`;
		if (user.username && user.username.trim()) {
			return `${name} (@${user.username})`;
		}
		if (user.primary_email_address) {
			return `${name} (${user.primary_email_address})`;
		}
		return name;
	};

	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle>Add Workspace Member</DialogTitle>

			<DialogBody>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						<Field>
							<Label>Select User</Label>
							<ModalCombobox
								className="mt-2"
								options={userOptions}
								value={selectedUser}
								onChange={setSelectedUser}
								displayValue={displayUserValue}
								filterFunction={(user: UserWithIdentifiers, query: string) => {
									const searchTerm = query.toLowerCase();
									const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
									const username = user.username?.toLowerCase() || "";
									const email = user.primary_email_address?.toLowerCase() || "";
									
									return fullName.includes(searchTerm) || 
									       username.includes(searchTerm) ||
									       email.includes(searchTerm);
								}}
								placeholder={usersLoading ? "Loading users..." : "Search for a user by name, username or email..."}
								disabled={usersLoading}
							/>
						</Field>

						{selectedUser && (
							<div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
								<div className="text-sm font-medium text-blue-900 dark:text-blue-100">
									Selected User
								</div>
								<div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
									{selectedUser.first_name} {selectedUser.last_name} 
									{selectedUser.primary_email_address && ` • ${selectedUser.primary_email_address}`}
								</div>
							</div>
						)}

						{availableRoles.length > 0 && (
							<MultiSelect
								label="Assign Roles (Optional)"
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
								modal={true}
							/>
						)}
					</div>
				</form>
			</DialogBody>

			<DialogActions>
				<Button
					type="button"
					outline
					onClick={onClose}
					disabled={addMember.isPending}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					onClick={handleSubmit}
					disabled={addMember.isPending || !selectedUser}
				>
					{addMember.isPending ? "Adding..." : "Add Member"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}