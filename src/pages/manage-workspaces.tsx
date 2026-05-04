import { useState, useEffect, useCallback } from "react";
import { Divider } from "@/components/ui/divider";
import { Heading, Subheading } from "@/components/ui/heading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
import { Strong, Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxField } from "@/components/ui/app-checkbox";
import { Label } from "@/components/ui/fieldset";
import { Radio, RadioField, RadioGroup } from "@/components/ui/radio";
import { toast } from "sonner";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentB2bSettings } from "@/lib/api/hooks/use-update-deployment-b2b-settings";
import { useDeploymentWorkspaceRoles } from "@/lib/api/hooks/use-deployment-workspace-roles";
import { InlineLoader } from "@/components/ui/loading-screen";
import SavePopup from "@/components/save-popup";
import { DeploymentB2bSettings, DeploymentPermissionCatalogEntry } from "@/types/deployment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArchiveBoxIcon, ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/24/outline";

interface WorkspaceSettingsState {
  workspaces_enabled: boolean;
  allow_workspace_deletion: boolean;
  membership_limit_type: "unlimited" | "limited";
  max_allowed_workspace_members: number | string;
  default_workspace_member_role_id: string;
  creation_limit_type: "unlimited" | "limited";
  workspaces_per_org_count: number | string;
  allow_domain_verification: boolean;
  ip_allowlist_per_workspace_enabled: boolean;
  custom_workspace_role_enabled: boolean;
  default_workspace_creator_role_id: string;
  enforce_mfa_per_workspace_enabled: boolean;
  workspace_permission_catalog: DeploymentPermissionCatalogEntry[];
}

const initialSettingsState: WorkspaceSettingsState = {
  workspaces_enabled: false,
  allow_workspace_deletion: true,
  membership_limit_type: "unlimited",
  max_allowed_workspace_members: "",
  default_workspace_member_role_id: "",
  creation_limit_type: "unlimited",
  workspaces_per_org_count: "",
  allow_domain_verification: true,
  ip_allowlist_per_workspace_enabled: false,
  custom_workspace_role_enabled: false,
  default_workspace_creator_role_id: "",
  enforce_mfa_per_workspace_enabled: false,
  workspace_permission_catalog: [],
};

const idToSelectValue = (id: string | number | null | undefined) =>
  id == null ? "" : String(id);

export default function ManageWorkspacesPage() {
  const { deploymentSettings, isLoading: isLoadingSettings } =
    useCurrentDeployemnt();
  const updateB2bSettings = useUpdateDeploymentB2bSettings();
  const roleScopeWorkspaceId =
    idToSelectValue(
      deploymentSettings?.b2b_settings?.default_workspace_member_role?.workspace_id ??
      deploymentSettings?.b2b_settings?.default_workspace_creator_role?.workspace_id
    ) || undefined;
  const {
    data: workspaceRoles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useDeploymentWorkspaceRoles(roleScopeWorkspaceId);

  const [settingsState, setSettingsState] =
    useState<WorkspaceSettingsState>(initialSettingsState);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPermission, setNewPermission] = useState("");

  // Populate state from API data
  const populateSettings = useCallback((b2bSettings: DeploymentB2bSettings) => {
    // Limit type is 'limited' only if limiting is explicitly on
    const creationLimitType = b2bSettings.limit_workspace_creation_per_org
      ? "limited"
      : "unlimited";

    setSettingsState({
      workspaces_enabled: b2bSettings.workspaces_enabled ?? false,
      allow_workspace_deletion: b2bSettings.allow_workspace_deletion ?? true,
      membership_limit_type:
        b2bSettings.max_allowed_workspace_members === 0 ||
          b2bSettings.max_allowed_workspace_members == null
          ? "unlimited"
          : "limited",
      max_allowed_workspace_members:
        b2bSettings.max_allowed_workspace_members === 0 ||
          b2bSettings.max_allowed_workspace_members == null
          ? ""
          : b2bSettings.max_allowed_workspace_members,
      default_workspace_member_role_id:
        idToSelectValue(b2bSettings.default_workspace_member_role?.id),
      creation_limit_type: creationLimitType,
      workspaces_per_org_count:
        creationLimitType === "limited"
          ? b2bSettings.workspaces_per_org_count ?? ""
          : "",
      allow_domain_verification: true,
      ip_allowlist_per_workspace_enabled:
        b2bSettings.ip_allowlist_per_workspace_enabled ?? false,
      custom_workspace_role_enabled:
        b2bSettings.custom_workspace_role_enabled ?? false,
      default_workspace_creator_role_id:
        idToSelectValue(b2bSettings.default_workspace_creator_role?.id),
      enforce_mfa_per_workspace_enabled:
        b2bSettings.enforce_mfa_per_workspace_enabled ?? false,
      workspace_permission_catalog:
        b2bSettings.workspace_permission_catalog ??
        (b2bSettings.workspace_permissions ?? []).map((key) => ({
          key,
          archived: false,
        })),
    });
  }, []);

  useEffect(() => {
    // console.log("deploymentSettings", deploymentSettings?.b2b_settings);
    if (deploymentSettings?.b2b_settings) {
      populateSettings(deploymentSettings.b2b_settings);
      setIsDirty(false);
    }
  }, [deploymentSettings, populateSettings]);

  // Handle changes to any setting
  const handleSettingChange = useCallback(
    <K extends keyof WorkspaceSettingsState>(
      key: K,
      value:
        | WorkspaceSettingsState[K]
        | string
        | number
        | boolean
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setSettingsState((prevState) => {
        let finalValue: unknown;
        let newState = { ...prevState };

        if (typeof value === "object" && value !== null && "target" in value) {
          const target = value.target as HTMLInputElement | HTMLSelectElement;
          if (target.type === "checkbox") {
            finalValue = (target as HTMLInputElement).checked;
          } else if (target.type === "number") {
            const numVal =
              target.value === "" ? "" : parseInt(target.value, 10);
            finalValue =
              numVal === "" || (!isNaN(numVal) && numVal >= 0)
                ? numVal
                : prevState[key];
          } else {
            finalValue = target.value;
          }
        } else {
          finalValue = value;
        }

        newState = { ...newState, [key]: finalValue };

        if (key === "membership_limit_type") {
          if (finalValue === "unlimited") {
            newState.max_allowed_workspace_members = "";
          } else if (
            finalValue === "limited" &&
            newState.max_allowed_workspace_members === ""
          ) {
            newState.max_allowed_workspace_members = 1;
          }
        } else if (key === "creation_limit_type") {
          if (finalValue === "unlimited") {
            newState.workspaces_per_org_count = "";
          } else if (
            finalValue === "limited" &&
            newState.workspaces_per_org_count === ""
          ) {
            newState.workspaces_per_org_count = 1;
          }
        }

        return newState;
      });
      setIsDirty(true);
    },
    []
  );

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const payload = {
        workspaces_enabled: settingsState.workspaces_enabled,
        allow_workspace_deletion: settingsState.allow_workspace_deletion,
        default_workspace_member_role_id:
          settingsState.default_workspace_member_role_id || undefined,
        default_workspace_creator_role_id:
          settingsState.default_workspace_creator_role_id || undefined,
        workspace_permission_catalog: settingsState.workspace_permission_catalog,
        max_allowed_workspace_members:
          settingsState.membership_limit_type === "unlimited"
            ? 0
            : Number(settingsState.max_allowed_workspace_members || 0),
        limit_workspace_creation_per_org:
          settingsState.creation_limit_type === "limited",
        workspaces_per_org_count:
          settingsState.creation_limit_type === "limited"
            ? Number(settingsState.workspaces_per_org_count || 0)
            : 0,
        ip_allowlist_per_workspace_enabled:
          settingsState.ip_allowlist_per_workspace_enabled,
        custom_workspace_role_enabled:
          settingsState.custom_workspace_role_enabled,
        enforce_mfa_per_workspace_enabled:
          settingsState.enforce_mfa_per_workspace_enabled,
      };

      await updateB2bSettings.mutateAsync(payload);

      toast.success("Workspace settings updated successfully");
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update workspace settings");
    } finally {
      setIsSaving(false);
    }
  };

  const workspaceActivePermissions =
    settingsState.workspace_permission_catalog.filter((entry) => !entry.archived);
  const workspaceArchivedPermissions =
    settingsState.workspace_permission_catalog.filter((entry) => entry.archived);

  const upsertWorkspacePermission = (rawPermission: string) => {
    const permission = rawPermission.trim();
    if (!permission) return;
    const existing = settingsState.workspace_permission_catalog.find(
      (entry) => entry.key === permission
    );
    if (existing && !existing.archived) return;

    if (existing && existing.archived) {
      handleSettingChange(
        "workspace_permission_catalog",
        settingsState.workspace_permission_catalog.map((entry) =>
          entry.key === permission ? { ...entry, archived: false } : entry
        )
      );
      return;
    }

    handleSettingChange("workspace_permission_catalog", [
      ...settingsState.workspace_permission_catalog,
      { key: permission, archived: false },
    ]);
  };

  const setWorkspacePermissionArchived = (permission: string, archived: boolean) => {
    handleSettingChange(
      "workspace_permission_catalog",
      settingsState.workspace_permission_catalog.map((entry) =>
        entry.key === permission ? { ...entry, archived } : entry
      )
    );
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
    return <InlineLoader />;
  }

  return (
    <div className="flex flex-col gap-2 mb-2">
      <Heading className="mb-4">Manage Workspaces</Heading>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium">Enable workspaces</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Intended for collaborative environments, this feature allows users
            to create Workspaces, invite their team, and assign roles.
          </p>
        </div>
        <Switch
          name="workspace_enabled"
          checked={settingsState.workspaces_enabled}
          onCheckedChange={(checked) =>
            handleSettingChange("workspaces_enabled", checked)
          }
        />
      </div>

      {!settingsState.workspaces_enabled && <div className="h-[80svh]"></div>}

      {settingsState.workspaces_enabled && (
        <div className="my-10">
          <div className="space-y-28">
            <div className="space-y-6">
              <div className="space-y-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-medium">
                      Enable custom roles
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Allow organization to create custom roles by themselves.
                    </p>
                  </div>
                  <Switch
                    name="custom_workspace_role_enabled"
                    checked={settingsState.custom_workspace_role_enabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "custom_workspace_role_enabled",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-medium">
                      Enforce MFA for Workspaces
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Require all workspace members to have Multi-Factor Authentication enabled.
                    </p>
                  </div>
                  <Switch
                    name="enforce_mfa_per_workspace_enabled"
                    checked={settingsState.enforce_mfa_per_workspace_enabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "enforce_mfa_per_workspace_enabled",
                        checked
                      )
                    }
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-medium">
                      Enable IP allowlist
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Allow workspaces to create IP allowlists for their members.
                    </p>
                  </div>
                  <Switch
                    name="ip_allowlist_per_workspace_enabled"
                    checked={settingsState.ip_allowlist_per_workspace_enabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "ip_allowlist_per_workspace_enabled",
                        checked
                      )
                    }
                  />
                </div>

                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Subheading>
                      <Strong>Default role for members</Strong>
                    </Subheading>
                    <Text>
                      Choose the role that users are initially assigned as a new
                      workspace member.
                    </Text>
                  </div>
                  <div>
                    <Select
                      name="roles"
                      value={settingsState.default_workspace_member_role_id}
                      onValueChange={(value) =>
                        handleSettingChange(
                          "default_workspace_member_role_id",
                          value
                        )
                      }
                      disabled={isLoadingRoles || !!rolesError || !roleScopeWorkspaceId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a role"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!isLoadingRoles &&
                          !rolesError &&
                          workspaceRoles?.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Subheading>
                      <Strong>Creator's initial role</Strong>
                    </Subheading>
                    <Text>
                      Choose the role that users are initially assigned after
                      creating a workspace.
                    </Text>
                  </div>
                  <div>
                    <Select
                      name="creator_role"
                      value={settingsState.default_workspace_creator_role_id}
                      onValueChange={(value) =>
                        handleSettingChange(
                          "default_workspace_creator_role_id",
                          value
                        )
                      }
                      disabled={isLoadingRoles || !!rolesError || !roleScopeWorkspaceId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingRoles ? "Loading role..." : "Select a role"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!isLoadingRoles &&
                          !rolesError &&
                          workspaceRoles?.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                  <div className="space-y-1">
                    <Subheading>
                      <Strong>Available Permissions</Strong>
                    </Subheading>
                    <Text>
                      Define the permissions that can be assigned to workspace roles.
                      These permissions will be available when creating custom roles.
                    </Text>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g., workspace:deploy"
                        value={newPermission}
                        onChange={(e) => setNewPermission(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            upsertWorkspacePermission(newPermission);
                            setNewPermission("");
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          upsertWorkspacePermission(newPermission);
                          setNewPermission("");
                        }}
                        variant="outline"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workspaceActivePermissions.length === 0 ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No permissions configured
                        </span>
                      ) : (
                        workspaceActivePermissions.map((entry) => (
                          <Badge
                            key={entry.key}
                            color="green"
                            className="flex items-center gap-1"
                          >
                            {entry.key}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWorkspacePermissionArchived(entry.key, true);
                                  }}
                                  className="ml-1 hover:text-red-500"
                                  aria-label="Archive permission"
                                >
                                  <ArchiveBoxIcon className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Archive permission</TooltipContent>
                            </Tooltip>
                          </Badge>
                        ))
                      )}
                    </div>
                    {workspaceArchivedPermissions.length > 0 && (
                      <div className="space-y-2">
                        <Text>Archived</Text>
                        <div className="flex flex-wrap gap-2">
                          {workspaceArchivedPermissions.map((entry) => (
                            <Badge
                              key={entry.key}
                              color="zinc"
                              className="flex items-center gap-1"
                            >
                              {entry.key}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWorkspacePermissionArchived(entry.key, false)
                                    }
                                    className="ml-1 hover:text-green-600"
                                    aria-label="Unarchive permission"
                                  >
                                    <ArrowUturnLeftIcon className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Unarchive permission</TooltipContent>
                              </Tooltip>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <Divider className="my-10" soft />

              <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Subheading>
                    <Strong>Default membership limit</Strong>
                  </Subheading>
                  <Text>
                    Set the default number of users allowed in a workspace.
                  </Text>
                </div>
                <div className="space-y-4">
                  <RadioGroup
                    className="space-y-4"
                    value={settingsState.membership_limit_type}
                    onValueChange={(value) =>
                      handleSettingChange("membership_limit_type", value)
                    }
                  >
                    <RadioField>
                      <Radio value="unlimited" />
                      <Label>Unlimited membership</Label>
                    </RadioField>
                    <Text>
                      Workspaces can have an unlimited number of members and
                      pending invitations.
                    </Text>
                    <RadioField>
                      <Radio value="limited" />
                      <Label>Limited membership</Label>
                    </RadioField>
                    <Text>
                      Workspaces are limited to the following number of members,
                      including pending invitations.
                    </Text>
                    <Input
                      type="number"
                      value={settingsState.max_allowed_workspace_members}
                      onChange={(e) =>
                        handleSettingChange("max_allowed_workspace_members", e)
                      }
                      placeholder="Enter limit"
                      size={7}
                      min="1"
                      disabled={
                        settingsState.membership_limit_type === "unlimited"
                      }
                    />
                  </RadioGroup>
                </div>
              </section>

              <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Subheading>
                    <Strong>Default ability to delete</Strong>
                  </Subheading>
                  <Text>
                    If workspaces are deletable, any member with the{" "}
                    <Strong>"Delete workspace"</Strong> permission can
                    self-serve delete the workspace.
                  </Text>
                </div>
                <CheckboxField>
                  <Checkbox
                    name="deletable"
                    checked={settingsState.allow_workspace_deletion}
                    onCheckedChange={(checked: boolean) =>
                      handleSettingChange("allow_workspace_deletion", checked)
                    }
                  />
                  <Label>
                    Upon creation, workspaces are deletable by any member with
                    the <Strong>"Delete workspace"</Strong> permission
                  </Label>
                </CheckboxField>
              </section>

              <Divider className="my-10" soft />

              <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <Subheading>
                    <Strong>Limit number of workspaces per organization</Strong>
                  </Subheading>
                  <Text>
                    Configure how many workspaces a user can create per
                    organization.
                  </Text>
                </div>
                <div className="space-y-4">
                  <RadioGroup
                    className="space-y-4"
                    value={settingsState.creation_limit_type}
                    onValueChange={(value: "unlimited" | "limited") =>
                      handleSettingChange("creation_limit_type", value)
                    }
                  >
                    <RadioField>
                      <Radio value="unlimited" />
                      <Label className="font-normal">
                        Organizations can have unlimited workspaces
                      </Label>
                    </RadioField>
                    <RadioField>
                      <Radio value="limited" />
                      <Label>
                        Organizations can have a limited number of workspaces
                      </Label>
                    </RadioField>
                  </RadioGroup>

                  <Input
                    type="number"
                    placeholder="Number of workspaces"
                    size={19}
                    min="1"
                    disabled={settingsState.creation_limit_type !== "limited"}
                    value={settingsState.workspaces_per_org_count}
                    onChange={(e) =>
                      handleSettingChange("workspaces_per_org_count", e)
                    }
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
