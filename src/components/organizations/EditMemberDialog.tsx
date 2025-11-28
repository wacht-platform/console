import { useState, useEffect } from "react";
import { useUpdateOrganizationMember } from "@/lib/api/hooks/use-organization-mutations";
import {
	Dialog,
	DialogTitle,
	DialogBody,
	DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Label } from "@/components/ui/fieldset";
import { useDarkMode } from "@/lib/hooks/use-dark-mode";
import Editor from "@monaco-editor/react";

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
	const [publicMetadata, setPublicMetadata] = useState<string>("");
	const [isEditingMetadata, setIsEditingMetadata] = useState(false);
	const isDarkMode = useDarkMode();

	const updateMember = useUpdateOrganizationMember();

	useEffect(() => {
		if (member) {
			setSelectedRoles(member.roles.map((role) => role.id));
			setPublicMetadata(
				member.public_metadata
					? JSON.stringify(member.public_metadata, null, 2)
					: "{}"
			);
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

	const handleSaveMetadata = async () => {
		try {
			const parsedMetadata = JSON.parse(publicMetadata);
			await updateMember.mutateAsync({
				organizationId,
				membershipId: member.id,
				data: {
					public_metadata: parsedMetadata,
				},
			});
			setIsEditingMetadata(false);
		} catch (error) {
			console.error("Failed to update metadata:", error);
			alert("Invalid JSON format. Please check your syntax.");
		}
	};

	const handleCancelMetadata = () => {
		setPublicMetadata(
			member?.public_metadata
				? JSON.stringify(member.public_metadata, null, 2)
				: "{}"
		);
		setIsEditingMetadata(false);
	};



	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle>Edit Organization Member</DialogTitle>

			<DialogBody>
				<div className="space-y-6">
					{/* Member Info */}
					<div className="text-sm text-gray-600 dark:text-gray-400">
						<strong>{member.first_name} {member.last_name}</strong> • {member.primary_email_address}
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Roles */}
						<Field>
							<Label>Roles</Label>
							{availableRoles.length > 0 ? (
								<div className="space-y-4">
									{/* Selected roles */}
									{selectedRoles.length > 0 && (
										<div>
											<div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
												Assigned roles:
											</div>
											<div className="flex flex-wrap gap-2">
												{selectedRoles.map((roleId) => {
													const role = availableRoles.find(r => r.id === roleId);
													return role ? (
														<Badge
															key={roleId}
															color="blue"
															className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30"
															onClick={() => setSelectedRoles(selectedRoles.filter(id => id !== roleId))}
														>
															{role.is_deployment_level ? `${role.name} (Default)` : role.name}
															<svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
															</svg>
														</Badge>
													) : null;
												})}
											</div>
										</div>
									)}

									{/* Available roles */}
									<div>
										<div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
											Available roles:
										</div>
										<div className="flex flex-wrap gap-2">
											{availableRoles
												.filter(role => !selectedRoles.includes(role.id))
												.map((role) => (
													<Badge
														key={role.id}
														color="zinc"
														className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
														onClick={() => setSelectedRoles([...selectedRoles, role.id])}
													>
														{role.is_deployment_level ? `${role.name} (Default)` : role.name}
														<svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
														</svg>
													</Badge>
												))}
										</div>
										{availableRoles.filter(role => !selectedRoles.includes(role.id)).length === 0 && (
											<div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
												All available roles are already assigned.
											</div>
										)}
									</div>
								</div>
							) : (
								<div className="text-sm text-gray-500 dark:text-gray-400">
									No roles available. Create roles first to assign them to members.
								</div>
							)}
						</Field>

						{/* Public Metadata */}
						<Field>
							<div className="flex justify-between items-center mb-4">
								<Label className="text-base text-zinc-900 dark:text-zinc-100">Public Metadata</Label>
								{!isEditingMetadata ? (
									<Button
										type="button"
										outline
										onClick={() => setIsEditingMetadata(true)}
									>
										Edit
									</Button>
								) : (
									<div className="flex gap-2">
										<Button type="button" outline onClick={handleCancelMetadata}>
											Cancel
										</Button>
										<Button type="button" onClick={handleSaveMetadata}>
											Save
										</Button>
									</div>
								)}
							</div>

							<div className="space-y-3">
								<div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
									<Editor
										height="120px"
										defaultLanguage="json"
										value={publicMetadata}
										onChange={(value) => setPublicMetadata(value || "{}")}
										theme={isDarkMode ? "vs-dark" : "vs"}
										options={{
											readOnly: !isEditingMetadata,
											minimap: { enabled: false },
											fontSize: 13,
											scrollBeyondLastLine: false,
											automaticLayout: true,
											formatOnPaste: true,
											formatOnType: true,
											wordWrap: "on",
											lineNumbers: "off",
											folding: false,
											autoIndent: "full",
											padding: { top: 8, bottom: 8 },
											scrollbar: {
												vertical: "auto",
												horizontal: "hidden",
											},
										}}
									/>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400">
									This metadata will be publicly accessible. Use valid JSON format.
								</p>
							</div>
						</Field>
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
					{updateMember.isPending ? "Updating..." : "Update Member"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
