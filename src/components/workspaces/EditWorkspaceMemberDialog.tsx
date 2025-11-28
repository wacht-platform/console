import { useState, useEffect } from "react";
import { useUpdateWorkspaceMember } from "@/lib/api/hooks/use-workspace-mutations";
import {
	Dialog,
	DialogTitle,
	DialogBody,
	DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
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
	const [isEditingMetadata, setIsEditingMetadata] = useState(false);
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

		try {
			await updateMember.mutateAsync({
				workspaceId,
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
				workspaceId,
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
								<MultiSelect
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