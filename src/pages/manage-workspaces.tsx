import { useState, useEffect, useCallback } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { Pill } from "@/components/ui/pill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentB2bSettings } from "@/lib/api/hooks/use-update-deployment-b2b-settings";
import { useDeploymentWorkspaceRoles } from "@/lib/api/hooks/use-deployment-workspace-roles";
import { InlineLoader } from "@/components/ui/loading-screen";
import SavePopup from "@/components/save-popup";
import { DeploymentB2bSettings, DeploymentPermissionCatalogEntry } from "@/types/deployment";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArchiveBoxIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

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

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled?: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <Pill tone={enabled ? "ok" : "mute"}>{enabled ? "on" : "off"}</Pill>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
    </div>
  );
}

export default function ManageWorkspacesPage() {
  const { deploymentSettings, isLoading: isLoadingSettings } =
    useCurrentDeployemnt();
  const updateB2bSettings = useUpdateDeploymentB2bSettings();
  const {
    data: workspaceRoles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useDeploymentWorkspaceRoles();

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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 pr-[17px]">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">
            Enable workspaces
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Intended for collaborative environments — users can create
            workspaces, invite their team, and assign roles.
          </p>
        </div>
        <Switch
          name="workspace_enabled"
          checked={settingsState.workspaces_enabled}
          onCheckedChange={(checked) =>
            handleSettingChange("workspaces_enabled", checked)
          }
          className="shrink-0"
        />
      </div>

      <fieldset
        disabled={!settingsState.workspaces_enabled}
        className={cn(
          "m-0 flex min-w-0 flex-col gap-6 border-0 p-0 transition-opacity",
          !settingsState.workspaces_enabled && "opacity-55",
        )}
      >
          <section className="flex flex-col gap-4">
            <SectionLabel>Features</SectionLabel>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              <ToggleRow
                title="Custom roles"
                description="Allow workspaces to create custom roles themselves."
                enabled={settingsState.custom_workspace_role_enabled}
                onToggle={(checked) =>
                  handleSettingChange("custom_workspace_role_enabled", checked)
                }
              />
              <ToggleRow
                title="Enforce MFA"
                description="Require all workspace members to have multi-factor authentication enabled."
                enabled={settingsState.enforce_mfa_per_workspace_enabled}
                onToggle={(checked) =>
                  handleSettingChange(
                    "enforce_mfa_per_workspace_enabled",
                    checked,
                  )
                }
              />
              <ToggleRow
                title="IP allowlist"
                description="Allow workspaces to create IP allowlists for their members."
                enabled={settingsState.ip_allowlist_per_workspace_enabled}
                onToggle={(checked) =>
                  handleSettingChange(
                    "ip_allowlist_per_workspace_enabled",
                    checked,
                  )
                }
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionLabel>Roles &amp; permissions</SectionLabel>
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 sm:max-w-md">
                  <div className="text-sm font-medium text-foreground">
                    Default role for members
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Role assigned to users when they join a workspace.
                  </p>
                </div>
                <Select
                  name="roles"
                  value={settingsState.default_workspace_member_role_id}
                  onValueChange={(value) =>
                    handleSettingChange(
                      "default_workspace_member_role_id",
                      value,
                    )
                  }
                  disabled={isLoadingRoles || !!rolesError}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue
                      placeholder={
                        isLoadingRoles ? "Loading roles..." : "Select a role"
                      }
                    />
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

              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 sm:max-w-md">
                  <div className="text-sm font-medium text-foreground">
                    Creator's initial role
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Role assigned to a user after they create a workspace.
                  </p>
                </div>
                <Select
                  name="creator_role"
                  value={settingsState.default_workspace_creator_role_id}
                  onValueChange={(value) =>
                    handleSettingChange(
                      "default_workspace_creator_role_id",
                      value,
                    )
                  }
                  disabled={isLoadingRoles || !!rolesError}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue
                      placeholder={
                        isLoadingRoles ? "Loading role..." : "Select a role"
                      }
                    />
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

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 sm:max-w-sm">
                    <div className="text-sm font-medium text-foreground">
                      Available permissions
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Permissions that can be assigned when creating custom
                      roles.
                    </p>
                  </div>
                  <Input
                    type="text"
                    placeholder="Add a permission, then press Enter"
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        upsertWorkspacePermission(newPermission);
                        setNewPermission("");
                      }
                    }}
                    className="w-full sm:w-64"
                  />
                </div>
                {workspaceActivePermissions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {workspaceActivePermissions.map((entry) => (
                      <span
                        key={entry.key}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-secondary-foreground"
                      >
                        {entry.key}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                setWorkspacePermissionArchived(entry.key, true)
                              }
                              className="text-muted-foreground transition-colors hover:text-destructive"
                              aria-label="Archive permission"
                            >
                              <ArchiveBoxIcon className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Archive permission</TooltipContent>
                        </Tooltip>
                      </span>
                    ))}
                  </div>
                )}
                {workspaceArchivedPermissions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Archived
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workspaceArchivedPermissions.map((entry) => (
                        <span
                          key={entry.key}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px] text-muted-foreground"
                        >
                          {entry.key}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  setWorkspacePermissionArchived(
                                    entry.key,
                                    false,
                                  )
                                }
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Unarchive permission"
                              >
                                <ArrowUturnLeftIcon className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Unarchive permission
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionLabel>Membership &amp; creation</SectionLabel>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-3 px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Limit members per workspace
                      </span>
                      <Pill
                        tone={
                          settingsState.membership_limit_type === "limited"
                            ? "ok"
                            : "mute"
                        }
                      >
                        {settingsState.membership_limit_type === "limited"
                          ? "on"
                          : "off"}
                      </Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Cap how many members (including pending invites) a
                      workspace can have.
                    </p>
                  </div>
                  <Switch
                    checked={settingsState.membership_limit_type === "limited"}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "membership_limit_type",
                        checked ? "limited" : "unlimited",
                      )
                    }
                    className="shrink-0"
                  />
                </div>
                {settingsState.membership_limit_type === "limited" && (
                  <Input
                    type="number"
                    min="1"
                    value={settingsState.max_allowed_workspace_members}
                    onChange={(e) =>
                      handleSettingChange("max_allowed_workspace_members", e)
                    }
                    placeholder="Maximum members per workspace"
                    className="w-full"
                  />
                )}
              </div>

              <ToggleRow
                title="Self-service deletion"
                description='Members with the "Delete workspace" permission can delete the workspace.'
                enabled={settingsState.allow_workspace_deletion}
                onToggle={(checked) =>
                  handleSettingChange("allow_workspace_deletion", checked)
                }
              />

              <div className="flex flex-col gap-3 px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Limit workspaces per organization
                      </span>
                      <Pill
                        tone={
                          settingsState.creation_limit_type === "limited"
                            ? "ok"
                            : "mute"
                        }
                      >
                        {settingsState.creation_limit_type === "limited"
                          ? "on"
                          : "off"}
                      </Pill>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Cap how many workspaces each organization can have.
                    </p>
                  </div>
                  <Switch
                    checked={settingsState.creation_limit_type === "limited"}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "creation_limit_type",
                        checked ? "limited" : "unlimited",
                      )
                    }
                    className="shrink-0"
                  />
                </div>
                {settingsState.creation_limit_type === "limited" && (
                  <Input
                    type="number"
                    min="1"
                    placeholder="Maximum workspaces per organization"
                    className="w-full"
                    value={settingsState.workspaces_per_org_count}
                    onChange={(e) =>
                      handleSettingChange("workspaces_per_org_count", e)
                    }
                  />
                )}
              </div>
            </div>
          </section>
      </fieldset>

      <SavePopup
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSaveChanges}
        onCancel={handleReset}
      />
    </div>
  );
}
