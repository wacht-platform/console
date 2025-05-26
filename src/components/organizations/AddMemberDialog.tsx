import { useState } from "react";
import { useAddOrganizationMember } from "@/lib/api/hooks/use-organization-mutations";
import { useDeploymentUsers } from "@/lib/api/hooks/use-deployment-users";
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
import type { OrganizationRoleSimple } from "@/types/organization";

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
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

	const { data: users, isLoading: usersLoading } = useDeploymentUsers({
		limit: 20,
		enabled: true,
	});
	const addMember = useAddOrganizationMember();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedUserId) {
			return;
		}

		try {
			await addMember.mutateAsync({
				organizationId,
				data: {
					user_id: selectedUserId,
					role_ids: selectedRoles,
				},
			});
			onClose();
			setSelectedUserId("");
			setSelectedRoles([]);
			setSearchTerm("");
		} catch (error) {
			console.error("Failed to add member:", error);
		}
	};

	const handleRoleToggle = (roleId: string) => {
		setSelectedRoles((prev) =>
			prev.includes(roleId)
				? prev.filter((id) => id !== roleId)
				: [...prev, roleId],
		);
	};

	const filteredUsers =
		users?.data?.filter(
			(user) =>
				user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.primary_email_address
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()),
		) || [];

	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle>Add Organization Member</DialogTitle>

			<DialogBody>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						<div>
							<Label htmlFor="search">Search Users</Label>
							<Input
								id="search"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by name or email"
							/>
						</div>

						{searchTerm && (
							<div className="max-h-48 overflow-y-auto border rounded-md">
								{usersLoading ? (
									<div className="p-4 text-center text-gray-500">
										Loading users...
									</div>
								) : filteredUsers.length === 0 ? (
									<div className="p-4 text-center text-gray-500">
										No users found
									</div>
								) : (
									<div className="space-y-1">
										{filteredUsers.map((user) => (
											<div
												key={user.id}
												className={`p-3 cursor-pointer hover:bg-gray-50 ${
													selectedUserId === user.id
														? "bg-blue-50 border-blue-200"
														: ""
												}`}
												onClick={() => setSelectedUserId(user.id)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														setSelectedUserId(user.id);
													}
												}}
												tabIndex={0}
												role="button"
												aria-label={`Select ${user.first_name} ${user.last_name}`}
											>
												<div className="font-medium">
													{user.first_name} {user.last_name}
												</div>
												<div className="text-sm text-gray-500">
													{user.primary_email_address}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{availableRoles.length > 0 && (
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
							</div>
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
					disabled={addMember.isPending || !selectedUserId}
				>
					{addMember.isPending ? "Adding..." : "Add Member"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
