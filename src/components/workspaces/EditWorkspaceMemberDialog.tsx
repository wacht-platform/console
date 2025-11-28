import { useState, useEffect } from "react";
import { useUpdateWorkspaceMember } from "@/lib/api/hooks/use-workspace-mutations";
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

interface WorkspaceMember {
	id: string;
	first_name: string;
	last_name: string;
	primary_email_address: string;
	public_metadata?: Record<string, any>;
	roles: Array<{
		id: string;
		name: string;
	}>;
}

interface WorkspaceRole {
	id: string;
	name: string;
	permissions: string[];
	is_deployment_level?: boolean;
}

interface EditWorkspaceMemberDialogProps {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
	member: WorkspaceMember;
	availableRoles: WorkspaceRole[];
}

export function EditWorkspaceMemberDialog({
	isOpen,
	onClose,
	workspaceId,
	member,
	availableRoles,
}: EditWorkspaceMemberDialogProps) {
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const [publicMetadata, setPublicMetadata] = useState<string>("");
	const isDarkMode = useDarkMode();

	const updateMember = useUpdateWorkspaceMember();

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

		// Validate JSON before sending request
		let parsedMetadata;
		try {
			parsedMetadata = JSON.parse(publicMetadata);
		} catch (jsonError) {
			alert("Invalid JSON format in metadata. Please check your syntax.");
			return;
		}

		// Send update request
		try {
			await updateMember.mutateAsync({
				workspaceId,
				membershipId: member.id,
				data: {
					role_ids: selectedRoles,
					public_metadata: parsedMetadata,
				},
			});
			onClose();
		} catch (error: any) {
			console.error("Failed to update member:", error);
			const errorMessage = error?.response?.data?.message || error?.message || "Failed to update member. Please try again.";
			alert(errorMessage);
		}
	};

	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogTitle>Edit Workspace Member</DialogTitle>

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
															color="green"
															className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30"
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
											readOnly: false,
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