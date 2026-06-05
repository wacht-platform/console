import { useState, useMemo, useEffect } from "react";
import { useAddOrganizationMember } from "@/lib/api/hooks/use-organization-mutations";
import { useDeploymentUsers } from "@/lib/api/hooks/use-deployment-users";
import { usePostHog } from "@posthog/react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { MultiSelect } from "@/components/ui/multi-select";
import { ModalCombobox } from "@/components/ui/modal-combobox";
import type { OrganizationRoleSimple } from "@/types/organization";
import type { UserWithIdentifiers } from "@/types/user";

interface AddMemberDialogProps {
	isOpen: boolean;
	onClose: () => void;
	organizationId: string;
	availableRoles: OrganizationRoleSimple[];
}

export function AddMemberDialog({
	isOpen,
	onClose,
	organizationId,
	availableRoles,
}: AddMemberDialogProps) {
	const [selectedUser, setSelectedUser] = useState<UserWithIdentifiers | null>(null);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const posthog = usePostHog();

	// Fetch all users when dialog opens
	const { data: users, isLoading: usersLoading } = useDeploymentUsers({
		limit: 100,
		enabled: isOpen,
	});

	const addMember = useAddOrganizationMember();

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
				organizationId,
				data: {
					user_id: selectedUser.id,
					role_ids: selectedRoles,
				},
			});
			posthog?.capture("organization_member_added", {
				organization_id: organizationId,
				role_count: selectedRoles.length,
			});
			onClose();
		} catch (error) {
			console.error("Failed to add member:", error);
			posthog?.captureException(error);
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

	return (<Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
		<DialogContent className="sm:max-w-lg">
			<DialogHeader>
				<DialogTitle>Add Organization Member</DialogTitle>
			</DialogHeader>

			<div className="py-2">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						<Field>
							<Label>Select User</Label>
							<ModalCombobox
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
							<div className="rounded-lg border border-primary dark:border-primary bg-primary dark:bg-primary p-3">
								<div className="text-sm font-medium text-primary dark:text-primary">
									Selected User
								</div>
								<div className="mt-1 text-sm text-primary dark:text-primary">
									{selectedUser.first_name} {selectedUser.last_name}
									{selectedUser.primary_email_address && ` • ${selectedUser.primary_email_address}`}
								</div>
							</div>
						)}

						{availableRoles.length > 0 && (
							<div>
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
							</div>
						)}
					</div>
				</form>
			</div>

			<DialogFooter>
				<Button
					type="button"
					variant="ghost"
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
			</DialogFooter>
		</DialogContent >
	</Dialog >
	);
}