import { useState, useEffect, useCallback, useRef } from "react";
import { useTourController } from "@/lib/tour";
import { SectionLabel } from "@/components/ui/section-label";
import { Pill } from "@/components/ui/pill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCurrentDeployemnt } from "@/lib/api/hooks/use-deployment-settings";
import { useUpdateDeploymentB2bSettings } from "@/lib/api/hooks/use-update-deployment-b2b-settings";
import { useDeploymentOrgRoles } from "@/lib/api/hooks/use-deployment-org-roles";
import { InlineLoader } from "@/components/ui/loading-screen";
import SavePopup from "@/components/save-popup";
import { DeploymentB2bSettings, DeploymentPermissionCatalogEntry } from "@/types/deployment";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArchiveBoxIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

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
  enforce_mfa_per_org_enabled: boolean;
  enterprise_sso_enabled: boolean;
  organization_permission_catalog: DeploymentPermissionCatalogEntry[];
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
  enforce_mfa_per_org_enabled: false,
  enterprise_sso_enabled: false,
  organization_permission_catalog: [],
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

export default function ManageOrganizationsPage() {
  const { deploymentSettings, isLoading: isLoadingSettings } =
    useCurrentDeployemnt();
  const updateB2bSettings = useUpdateDeploymentB2bSettings();
  const {
    data: orgRoles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useDeploymentOrgRoles();

  const [settingsState, setSettingsState] =
    useState<B2BSettingsState>(initialSettingsState);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPermission, setNewPermission] = useState("");

  const populateSettings = useCallback((b2bSettings: DeploymentB2bSettings) => {
    setSettingsState({
      organizations_enabled: b2bSettings.organizations_enabled ?? false,
      allow_org_deletion: b2bSettings.allow_org_deletion ?? true,
      membership_limit_type:
        b2bSettings.max_allowed_org_members === 0 ||
          b2bSettings.max_allowed_org_members == null
          ? "unlimited"
          : "limited",
      max_allowed_org_members:
        b2bSettings.max_allowed_org_members === 0 ||
          b2bSettings.max_allowed_org_members == null
          ? ""
          : b2bSettings.max_allowed_org_members,
      default_org_member_role_id: idToSelectValue(
        b2bSettings.default_org_member_role?.id
      ),
      default_org_creator_role_id:
        idToSelectValue(b2bSettings.default_org_creator_role?.id),
      allow_users_to_create_orgs:
        b2bSettings.allow_users_to_create_orgs ?? true,
      creation_limit_type: b2bSettings.limit_org_creation_per_user
        ? "limited"
        : "unlimited",
      org_creation_per_user_count: b2bSettings.limit_org_creation_per_user
        ? b2bSettings.org_creation_per_user_count ?? ""
        : "",
      custom_org_role_enabled: b2bSettings.custom_org_role_enabled ?? false,
      ip_allowlist_per_org_enabled:
        b2bSettings.ip_allowlist_per_org_enabled ?? false,
      enforce_mfa_per_org_enabled:
        b2bSettings.enforce_mfa_per_org_enabled ?? false,
      enterprise_sso_enabled: b2bSettings.enterprise_sso_enabled ?? false,
      organization_permission_catalog:
        b2bSettings.organization_permission_catalog ??
        (b2bSettings.organization_permissions ?? []).map((key) => ({
          key,
          archived: false,
        })),
    });
  }, []);

  const { start: startTour } = useTourController();
  const prevOrgsEnabledRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (deploymentSettings?.b2b_settings) {
      populateSettings(deploymentSettings.b2b_settings);
      setIsDirty(false);
      // Seed the ref with the server value so we don't false-trigger the
      // tour on initial page load when orgs are already enabled.
      if (prevOrgsEnabledRef.current === null) {
        prevOrgsEnabledRef.current =
          deploymentSettings.b2b_settings.organizations_enabled ?? false;
      }
    }
  }, [deploymentSettings, populateSettings]);

  useEffect(() => {
    if (prevOrgsEnabledRef.current === null) return;
    const current = settingsState.organizations_enabled;
    const prev = prevOrgsEnabledRef.current;
    prevOrgsEnabledRef.current = current;
    if (prev === false && current === true) {
      startTour("first-orgs-enabled");
    }
  }, [settingsState.organizations_enabled, startTour]);

  const handleSettingChange = useCallback(
    <K extends keyof B2BSettingsState>(
      key: K,
      value:
        | B2BSettingsState[K]
        | string
        | number
        | boolean
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      setSettingsState((prevState) => {
        let finalValue: unknown; // Changed 'any' to 'unknown'
        if (typeof value === "object" && value !== null && "target" in value) {
          const target = value.target as HTMLInputElement | HTMLSelectElement;
          if (target.type === "checkbox") {
            finalValue = (target as HTMLInputElement).checked;
          } else if (target.type === "number") {
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
        } else {
          finalValue = value;
        }

        return {
          ...prevState,
          [key]: finalValue,
        };
      });
      setIsDirty(true);
    },
    []
  );

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const payload = {
        organizations_enabled: settingsState.organizations_enabled,
        allow_org_deletion: settingsState.allow_org_deletion,
        custom_org_role_enabled: settingsState.custom_org_role_enabled,
        ip_allowlist_per_org_enabled:
          settingsState.ip_allowlist_per_org_enabled,
        enforce_mfa_per_org_enabled:
          settingsState.enforce_mfa_per_org_enabled,
        enterprise_sso_enabled:
          settingsState.enterprise_sso_enabled,
        organization_permission_catalog: settingsState.organization_permission_catalog,
        max_allowed_org_members:
          settingsState.membership_limit_type === "unlimited"
            ? 0
            : Number(settingsState.max_allowed_org_members || 0),
        limit_org_creation_per_user:
          settingsState.creation_limit_type === "limited",
        org_creation_per_user_count:
          settingsState.creation_limit_type === "limited"
            ? Number(settingsState.org_creation_per_user_count || 0)
            : 0,
        default_org_member_role_id:
          settingsState.default_org_member_role_id || undefined,
        default_org_creator_role_id:
          settingsState.default_org_creator_role_id || undefined,
        allow_users_to_create_orgs: settingsState.allow_users_to_create_orgs,
      };

      await updateB2bSettings.mutateAsync(payload);

      toast.success("Organization settings updated successfully");
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update organization settings");
    } finally {
      setIsSaving(false);
    }
  };

  const organizationActivePermissions =
    settingsState.organization_permission_catalog.filter((entry) => !entry.archived);
  const organizationArchivedPermissions =
    settingsState.organization_permission_catalog.filter((entry) => entry.archived);

  const upsertOrganizationPermission = (rawPermission: string) => {
    const permission = rawPermission.trim();
    if (!permission) return;
    const existing = settingsState.organization_permission_catalog.find(
      (entry) => entry.key === permission
    );
    if (existing && !existing.archived) return;

    if (existing && existing.archived) {
      handleSettingChange(
        "organization_permission_catalog",
        settingsState.organization_permission_catalog.map((entry) =>
          entry.key === permission ? { ...entry, archived: false } : entry
        )
      );
      return;
    }

    handleSettingChange("organization_permission_catalog", [
      ...settingsState.organization_permission_catalog,
      { key: permission, archived: false },
    ]);
  };

  const setOrganizationPermissionArchived = (permission: string, archived: boolean) => {
    handleSettingChange(
      "organization_permission_catalog",
      settingsState.organization_permission_catalog.map((entry) =>
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
      <div
        className="flex items-start justify-between gap-4 pr-[17px]"
        data-tour-id="b2b-enable-orgs"
      >
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">
            Enable organizations
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Intended for B2B SaaS products — users can create organizations,
            invite their team, and assign roles.
          </p>
        </div>
        <Switch
          name="organization_enabled"
          checked={settingsState.organizations_enabled}
          onCheckedChange={(checked) =>
            handleSettingChange("organizations_enabled", checked)
          }
          className="shrink-0"
        />
      </div>

      <fieldset
        disabled={!settingsState.organizations_enabled}
        className={cn(
          "m-0 flex min-w-0 flex-col gap-6 border-0 p-0 transition-opacity",
          !settingsState.organizations_enabled && "opacity-55",
        )}
      >
          <section className="flex flex-col gap-4">
            <SectionLabel>Features</SectionLabel>
            <div
              className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card"
              data-tour-id="b2b-feature-toggles"
            >
              <ToggleRow
                title="Custom roles"
                description="Allow organizations to create custom roles themselves."
                enabled={settingsState.custom_org_role_enabled}
                onToggle={(checked) =>
                  handleSettingChange("custom_org_role_enabled", checked)
                }
              />
              <ToggleRow
                title="IP allowlist"
                description="Allow organizations to create IP allowlists for their members."
                enabled={settingsState.ip_allowlist_per_org_enabled}
                onToggle={(checked) =>
                  handleSettingChange("ip_allowlist_per_org_enabled", checked)
                }
              />
              <ToggleRow
                title="Enforce MFA"
                description="Require all organization members to have multi-factor authentication enabled."
                enabled={settingsState.enforce_mfa_per_org_enabled}
                onToggle={(checked) =>
                  handleSettingChange("enforce_mfa_per_org_enabled", checked)
                }
              />
              <ToggleRow
                title="Enterprise SSO"
                description="Allow organizations to configure SAML and OIDC connections for single sign-on."
                enabled={settingsState.enterprise_sso_enabled}
                onToggle={(checked) =>
                  handleSettingChange("enterprise_sso_enabled", checked)
                }
              />
            </div>
          </section>

          <section
            className="flex flex-col gap-4"
            data-tour-id="b2b-roles-permissions"
          >
            <SectionLabel>Roles &amp; permissions</SectionLabel>
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 sm:max-w-md">
                  <div className="text-sm font-medium text-foreground">
                    Default role for members
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Role assigned to users when they join an organization.
                  </p>
                </div>
                <Select
                  name="roles"
                  value={settingsState.default_org_member_role_id}
                  onValueChange={(value) =>
                    handleSettingChange("default_org_member_role_id", value)
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
                      orgRoles?.map((role) => (
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
                    Role assigned to a user after they create an organization.
                  </p>
                </div>
                <Select
                  name="roles"
                  value={settingsState.default_org_creator_role_id}
                  onValueChange={(value) =>
                    handleSettingChange("default_org_creator_role_id", value)
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
                      orgRoles?.map((role) => (
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
                        upsertOrganizationPermission(newPermission);
                        setNewPermission("");
                      }
                    }}
                    className="w-full sm:w-64"
                  />
                </div>
                {organizationActivePermissions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {organizationActivePermissions.map((entry) => (
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
                                setOrganizationPermissionArchived(
                                  entry.key,
                                  true,
                                )
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
                {organizationArchivedPermissions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      Archived
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {organizationArchivedPermissions.map((entry) => (
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
                                  setOrganizationPermissionArchived(
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
                        Limit members per organization
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
                      Cap how many members (including pending invites) an
                      organization can have.
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
                    value={settingsState.max_allowed_org_members}
                    onChange={(e) =>
                      handleSettingChange("max_allowed_org_members", e)
                    }
                    placeholder="Maximum members per organization"
                    className="w-full"
                  />
                )}
              </div>

              <ToggleRow
                title="Self-service deletion"
                description='Members with the "Delete organization" permission can delete the organization.'
                enabled={settingsState.allow_org_deletion}
                onToggle={(checked) =>
                  handleSettingChange("allow_org_deletion", checked)
                }
              />

              <ToggleRow
                title="Allow organization creation"
                description="Let users create their own organizations."
                enabled={settingsState.allow_users_to_create_orgs}
                onToggle={(checked) =>
                  handleSettingChange("allow_users_to_create_orgs", checked)
                }
              />

              <div className="flex flex-col gap-3 px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Limit organizations per user
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
                      Cap how many organizations each user can create.
                    </p>
                  </div>
                  <Switch
                    checked={settingsState.creation_limit_type === "limited"}
                    disabled={!settingsState.allow_users_to_create_orgs}
                    onCheckedChange={(checked) =>
                      handleSettingChange(
                        "creation_limit_type",
                        checked ? "limited" : "unlimited",
                      )
                    }
                    className="shrink-0"
                  />
                </div>
                {settingsState.creation_limit_type === "limited" &&
                  settingsState.allow_users_to_create_orgs && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Maximum organizations per user"
                      className="w-full"
                      value={settingsState.org_creation_per_user_count}
                      onChange={(e) =>
                        handleSettingChange("org_creation_per_user_count", e)
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
