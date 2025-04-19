import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { LightModeSettings, DarkModeSettings } from "@/types/deployment";

export interface DeploymentDisplaySettingsUpdates {
  app_name?: string;
  tos_page_url?: string;
  sign_in_page_url?: string;
  sign_up_page_url?: string;
  after_sign_out_one_page_url?: string;
  after_sign_out_all_page_url?: string;
  after_sign_up_page_url?: string;
  after_sign_in_page_url?: string;
  favicon_image_url?: string;
  logo_image_url?: string;
  privacy_policy_url?: string;
  signup_terms_statement?: string;
  signup_terms_statement_shown?: boolean;
  light_mode_settings?: LightModeSettings;
  dark_mode_settings?: DarkModeSettings;
  after_logo_click_url?: string;
  organization_profile_url?: string;
  create_organization_url?: string;
  default_user_profile_image_url?: string;
  default_organization_profile_image_url?: string;
  use_initials_for_user_profile_image?: boolean;
  use_initials_for_organization_profile_image?: boolean;
  after_signup_redirect_url?: string;
  after_signin_redirect_url?: string;
  user_profile_url?: string;
  after_create_organization_redirect_url?: string;
}

async function updateDeploymentDisplaySettings(
  deploymentId: string,
  settings: DeploymentDisplaySettingsUpdates
): Promise<void> {
  await apiClient.patch(
    `/deployments/${deploymentId}/settings/display-settings`,
    settings
  );
}

export function useUpdateDeploymentDisplaySettings() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  const mutation = useMutation({
    mutationFn: (settings: DeploymentDisplaySettingsUpdates) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }
      return updateDeploymentDisplaySettings(selectedDeployment.id, settings);
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
