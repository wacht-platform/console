import { useState, useEffect, useCallback } from "react";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/fieldset";
import { Radio, RadioField, RadioGroup } from "@/components/ui/radio";
import { useDeploymentSettings } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentB2bSettings } from "@/lib/api/hooks/use-update-deployment-b2b-settings";
import { useDeploymentOrgRoles } from "@/lib/api/hooks/use-deployment-org-roles";
import SavePopup from "@/components/save-popup";
import { DeploymentB2bSettings } from "@/types/deployment";

interface B2BSettingsState {
	organizations_enabled: boolean;
	allow_org_deletion: boolean;
	membership_limit_type: "unlimited" | "limited";
	max_allowed_org_members: number | string;
	default_org_member_role_id: string;
	default_org_creator_role_id: string;
	allow_users_to_create_orgs: boolean;
	creation_limit_type: "unlimited" | "limited";
	org_creation_per_user_count: number | string;
	custom_org_role_enabled: boolean;
	ip_allowlist_per_org_enabled: boolean;
}

const initialSettingsState: B2BSettingsState = {
	organizations_enabled: false,
	allow_org_deletion: true,
	membership_limit_type: "unlimited",
	max_allowed_org_members: "",
	default_org_member_role_id: "",
	default_org_creator_role_id: "",
	allow_users_to_create_orgs: true,
	creation_limit_type: "unlimited",
	org_creation_per_user_count: "",
	custom_org_role_enabled: false,
	ip_allowlist_per_org_enabled: false,
};

export default function ManageOrganizationsPage() {
	const { deploymentSettings, isLoading: isLoadingSettings } = useDeploymentSettings();
	const updateB2bSettings = useUpdateDeploymentB2bSettings();
	const { data: orgRoles, isLoading: isLoadingRoles, error: rolesError } = useDeploymentOrgRoles();

	const [settingsState, setSettingsState] = useState<B2BSettingsState>(initialSettingsState);
	const [isDirty, setIsDirty] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const populateSettings = useCallback((b2bSettings: DeploymentB2bSettings) => {
		setSettingsState({
			organizations_enabled: b2bSettings.organizations_enabled ?? false,
			allow_org_deletion: b2bSettings.allow_org_deletion ?? true,
			membership_limit_type: b2bSettings.max_allowed_org_members === 0 || b2bSettings.max_allowed_org_members == null ? "unlimited" : "limited",
			max_allowed_org_members: b2bSettings.max_allowed_org_members === 0 || b2bSettings.max_allowed_org_members == null ? "" : b2bSettings.max_allowed_org_members,
			default_org_member_role_id: b2bSettings.default_org_member_role?.id ?? "",
			default_org_creator_role_id: b2bSettings.default_org_creator_role?.id ?? "",
			allow_users_to_create_orgs: b2bSettings.allow_users_to_create_orgs ?? true,
			creation_limit_type: b2bSettings.limit_org_creation_per_user ? "limited" : "unlimited",
			org_creation_per_user_count: b2bSettings.limit_org_creation_per_user ? b2bSettings.org_creation_per_user_count ?? "" : "",
			custom_org_role_enabled: b2bSettings.custom_org_role_enabled ?? false,
			ip_allowlist_per_org_enabled: b2bSettings.ip_allowlist_per_org_enabled ?? false,
		});
	}, []);

	useEffect(() => {
		if (deploymentSettings?.b2b_settings) {
			populateSettings(deploymentSettings.b2b_settings);
			setIsDirty(false);
		}
	}, [deploymentSettings, populateSettings]);

	const handleSettingChange = useCallback(<K extends keyof B2BSettingsState>(
		key: K,
		value: B2BSettingsState[K] | string | number | boolean | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		setSettingsState(prevState => {
			let finalValue: any;
			if (typeof value === 'object' && value !== null && 'target' in value) {
				const target = value.target as HTMLInputElement | HTMLSelectElement;
				if (target.type === 'checkbox') {
					finalValue = (target as HTMLInputElement).checked;
				} else if (target.type === 'number') {
					const num = parseInt(target.value, 10);
					finalValue = isNaN(num) ? "" : num;
				} else {
					finalValue = target.value;
				}
			} else if (key === "membership_limit_type") {
				finalValue = value;
				const newState = { ...prevState, [key]: finalValue };
				if (value === "unlimited") {
					newState.max_allowed_org_members = "";
				}
				return newState;
			} else if (key === "creation_limit_type") {
				finalValue = value;
				const newState = { ...prevState, [key]: finalValue };
				if (value === "unlimited") {
					newState.org_creation_per_user_count = "";
				}
				return newState;
			}
			else {
				finalValue = value;
			}

			return {
				...prevState,
				[key]: finalValue,
			};
		});
		setIsDirty(true);
	}, []);

	const handleSaveChanges = async () => {
		try {
			setIsSaving(true);
			const payload = {
				...settingsState,
				max_allowed_org_members: settingsState.membership_limit_type === "unlimited" ? 0 : Number(settingsState.max_allowed_org_members || 0),
				limit_org_creation_per_user: settingsState.creation_limit_type === "limited",
				org_creation_per_user_count: settingsState.creation_limit_type === "limited" ? Number(settingsState.org_creation_per_user_count || 0) : 0,
				default_org_member_role_id: settingsState.default_org_member_role_id || undefined,
				default_org_creator_role_id: settingsState.default_org_creator_role_id || undefined,
				allow_users_to_create_orgs: settingsState.allow_users_to_create_orgs,
				ip_allowlist_per_org_enabled: settingsState.ip_allowlist_per_org_enabled,
			};

			await updateB2bSettings.mutateAsync(payload);

			alert("Organization settings updated successfully");
			setIsDirty(false);
		} catch (error) {
			console.error("Failed to update settings:", error);
			alert("Failed to update organization settings");
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = () => {
		if (deploymentSettings?.b2b_settings) {
			populateSettings(deploymentSettings.b2b_settings);
		} else {
			setSettingsState(initialSettingsState);
		}
		setIsDirty(false);
	};

	if (isLoadingSettings) {
		return <div>Loading settings...</div>;
	}

	return (
		<div className="flex flex-col gap-2 mb-2">
			<Heading className="mb-8">Manage Organizations</Heading>

			<div className="flex items-start justify-between">
				<div>
					<h2 className="text-base font-medium">Enable organizations</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						Intended for B2B SaaS products, this feature allows users to create Organizations, invite their team, and assign roles.
					</p>
				</div>
				<Switch
					name="organization_enabled"
					checked={settingsState.organizations_enabled}
					onChange={(checked) => handleSettingChange('organizations_enabled', checked)}
				/>
			</div>

			{!settingsState.organizations_enabled && (
				<div className="h-[80svh]">
				</div>
			)}

			{settingsState.organizations_enabled && (
				<div className="my-10">

					<div className="space-y-28">
						<div className="space-y-6">

							<div className="space-y-10">
								<div className="flex items-start justify-between">
									<div>
										<h2 className="text-base font-medium">Enable custom roles</h2>
										<p className="text-sm text-zinc-500 dark:text-zinc-400">
											Allow organization to create custom roles by themselves.
										</p>
									</div>
									<Switch
										name="custom_org_role_enabled"
										checked={settingsState.custom_org_role_enabled}
										onChange={(checked) => handleSettingChange('custom_org_role_enabled', checked)}
									/>
								</div>

								<div className="flex items-start justify-between">
									<div>
										<h2 className="text-base font-medium">Enable IP allowlist</h2>
										<p className="text-sm text-zinc-500 dark:text-zinc-400">
											Allow organizations to create ip allowlists for their members.
										</p>
									</div>
									<Switch
										name="ip_allowlist_per_org_enabled"
										checked={settingsState.ip_allowlist_per_org_enabled}
										onChange={(checked) => handleSettingChange('ip_allowlist_per_org_enabled', checked)}
									/>
								</div>
							</div>

							<Divider className="my-10" soft />

							<div className="space-y-10">
								<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
									<div className="space-y-1">
										<Subheading><Strong>Default role for members</Strong></Subheading>
										<Text>Choose the role that users are initially assigned as a new organization member.</Text>
									</div>
									<div>
										<Select
											aria-label="Roles"
											name="roles"
											value={settingsState.default_org_member_role_id}
											onChange={(e) => handleSettingChange('default_org_member_role_id', e)}
											disabled={isLoadingRoles || !!rolesError}
										>
											{isLoadingRoles && <option>Loading roles...</option>}
											{rolesError && <option>Error loading roles</option>}
											{!isLoadingRoles && !rolesError && (
												orgRoles?.map((role) => (
													<option key={role.id} value={role.id}>
														{role.name}
													</option>
												))
											)}
										</Select>
									</div>
								</section>

								<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-center">
									<div className="space-y-1">
										<Subheading><Strong>Creator's initial role</Strong></Subheading>
										<Text>Choose the role that users are initially assigned after creating an organization.</Text>
									</div>
									<div>
										<Select aria-label="Roles" name="roles"
											value={settingsState.default_org_creator_role_id}
											onChange={(e) => handleSettingChange('default_org_creator_role_id', e)}
											disabled={isLoadingRoles || !!rolesError}
										>
											{isLoadingRoles && <option>Loading roles...</option>}
											{rolesError && <option>Error loading roles</option>}
											{!isLoadingRoles && !rolesError && (
												orgRoles?.map((role) => (
													<option key={role.id} value={role.id}>
														{role.name}
													</option>
												))
											)}
										</Select>
									</div>
								</section>
							</div>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Default membership limit</Strong></Subheading>
									<Text>Set the default number of users allowed in an organization.</Text>
								</div>
								<div className="space-y-4">
									<RadioGroup name="membership" value={settingsState.membership_limit_type} onChange={(value) => handleSettingChange('membership_limit_type', value)}>
										<RadioField>
											<Radio value="unlimited" />
											<Label>Unlimited membership</Label>
										</RadioField>
										<Text>Organizations can have an unlimited number of members and pending invitations.</Text>
										<RadioField>
											<Radio value="limited" />
											<Label>Limited membership</Label>
										</RadioField>
										<Text>Organizations are limited to the following number of members, including pending invitations.</Text>
										<Input
											type="number"
											value={settingsState.max_allowed_org_members}
											onChange={(e) => handleSettingChange('max_allowed_org_members', e)}
											placeholder="Enter limit"
											size={7}
											disabled={settingsState.membership_limit_type === "unlimited"}
										/>
									</RadioGroup>
								</div>
							</section>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Default ability to delete</Strong></Subheading>
									<Text>If organizations are deletable, any member with the <Strong>"Delete organization"</Strong> permission can self-serve delete the organization.</Text>
								</div>

								<CheckboxField>
									<Checkbox
										name="deletable"
										checked={settingsState.allow_org_deletion}
										onChange={(checked) => handleSettingChange('allow_org_deletion', checked)}
									/>
									<Label>Upon creation, organizations are deletable by any member with the <Strong>"Delete organization"</Strong> permission</Label>
								</CheckboxField>
							</section>

							<Divider className="my-10" soft />

							<section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
								<div className="space-y-1">
									<Subheading><Strong>Limit creation</Strong></Subheading>
									<Text>Configure whether new users are able to create new organizations.</Text>
								</div>
								<div className="space-y-4">
									<CheckboxField>
										<Checkbox name="allow_creation_org" checked={settingsState.allow_users_to_create_orgs} onChange={(checked) => handleSettingChange('allow_users_to_create_orgs', checked)} />
										<Label>Allow users to create organizations</Label>
									</CheckboxField>

									<RadioGroup value={settingsState.creation_limit_type} onChange={(value) => handleSettingChange('creation_limit_type', value)}>
										<RadioField>
											<Radio value="unlimited" disabled={!settingsState.allow_users_to_create_orgs} />
											<Label className="font-semibold">Users can create unlimited organizations</Label>
										</RadioField>
										<RadioField>
											<Radio value="limited" disabled={!settingsState.allow_users_to_create_orgs} />
											<Label>Users can create a limited number of organizations</Label>
										</RadioField>
									</RadioGroup>

									<Input
										type="number"
										placeholder="Number of organizations"
										size={19}
										disabled={!settingsState.allow_users_to_create_orgs || settingsState.creation_limit_type !== "limited"}
										value={settingsState.org_creation_per_user_count}
										onChange={(e) => handleSettingChange('org_creation_per_user_count', e)}
									/>
								</div>
							</section>
						</div>
					</div>
				</div>
			)}

			<SavePopup
				isDirty={isDirty}
				isSaving={isSaving}
				onSave={handleSaveChanges}
				onCancel={handleReset}
			/>
		</div>
	);
}