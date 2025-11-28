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
import { Label } from "@/components/ui/fieldset";
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
			let parsedMetadata;
			if (isEditingMetadata && publicMetadata.trim()) {
				try {
					parsedMetadata = JSON.parse(publicMetadata);
				} catch (error) {
					throw new Error("Invalid JSON format in public metadata");
				}
			}

			await updateMember.mutateAsync({
				workspaceId,
				membershipId: member.id,
				data: {
					role_ids: selectedRoles,
					...(parsedMetadata && { public_metadata: parsedMetadata }),
				},
			});
			onClose();
		} catch (error) {
			console.error("Failed to update member:", error);
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
		<Dialog open={isOpen} onClose={onClose} className="max-w-2xl">
			<DialogTitle className="flex items-center gap-3">
				<div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full">
					<svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				</div>
				Edit Workspace Member
			</DialogTitle>

			<DialogBody>
				<div className="space-y-8">
					{/* Member Info Card */}
					<div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
						<div className="flex items-center gap-4">
							<div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full">
								<span className="text-lg font-semibold text-green-700 dark:text-green-300">
									{member.first_name?.[0]}{member.last_name?.[0]}
								</span>
							</div>
							<div>
								<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
									{member.first_name} {member.last_name}
								</h3>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{member.primary_email_address}
								</p>
							</div>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-8">
						{/* Roles Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<h4 className="text-base font-medium text-gray-900 dark:text-gray-100">Roles & Permissions</h4>
							</div>

							{availableRoles.length > 0 ? (
								<div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
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
										modal={true}
									/>
								</div>
							) : (
								<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
									<div className="flex items-center gap-2">
										<svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
										</svg>
										<p className="text-sm text-yellow-800 dark:text-yellow-200">
											No roles available. Create roles first to assign them to members.
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Metadata Section */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<h4 className="text-base font-medium text-gray-900 dark:text-gray-100">Public Metadata</h4>
								</div>
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
										<Button
											type="button"
											outline
											onClick={handleCancelMetadata}
										>
											Cancel
										</Button>
									</div>
								)}
							</div>

							<div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
								{isEditingMetadata ? (
									<div className="space-y-3">
										<Label className="text-sm text-gray-700 dark:text-gray-300">
											JSON metadata for this member
										</Label>
										<div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
								) : (
									<div className="space-y-2">
										<pre className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded border font-mono whitespace-pre-wrap">
											{publicMetadata}
										</pre>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Click "Edit" to modify the public metadata for this member.
										</p>
									</div>
								)}
							</div>
						</div>
					</form>
				</div>
			</DialogBody>

			<DialogActions className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between w-full">
					<div className="text-sm text-gray-500 dark:text-gray-400">
						Changes will be saved immediately
					</div>
					<div className="flex gap-3">
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
							className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
						>
							{updateMember.isPending ? (
								<>
									<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Updating...
								</>
							) : (
								<>
									<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
									Update Member
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogActions>
		</Dialog>
	);
}