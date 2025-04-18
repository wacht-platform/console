import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface B2bSettingsUpdate {
    organizations_enabled?: boolean;
    workspaces_enabled?: boolean;
    ip_allowlist_per_workspace_enabled?: boolean;
    ip_allowlist_per_org_enabled?: boolean;
    max_allowed_org_members?: number;
    max_allowed_workspace_members?: number;
    allow_org_deletion?: boolean;
    allow_workspace_deletion?: boolean;
    custom_org_role_enabled?: boolean;
    custom_workspace_role_enabled?: boolean;
    default_workspace_creator_role_id?: string;
    default_workspace_member_role_id?: string;
    default_org_creator_role_id?: string;
    default_org_member_role_id?: string;
    allow_users_to_create_orgs?: boolean;
    limit_org_creation_per_user?: boolean;
    org_creation_per_user_count?: number;
}

async function updateDeploymentB2bSettings(
    deploymentId: string,
    settings: B2bSettingsUpdate
): Promise<void> {
    await apiClient.patch(
        `/deployments/${deploymentId}/settings/b2b-settings`,
        settings
    );
}

export function useUpdateDeploymentB2bSettings() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    const mutation = useMutation({
        mutationFn: (settings: B2bSettingsUpdate) => {
            if (!selectedDeployment) {
                throw new Error("No deployment selected");
            }
            return updateDeploymentB2bSettings(selectedDeployment.id, settings);
        },
        onSuccess: () => {
            if (selectedDeployment) {
                queryClient.invalidateQueries({
                    queryKey: ["deploymentSettings", selectedDeployment.id],
                });
            }
        },
    });

    return mutation;
} 