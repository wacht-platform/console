import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { DeploymentAuthSettingsUpdates } from "@/types/project";

async function updateDeploymentAuthSettings(
  deploymentId: string,
  settings: DeploymentAuthSettingsUpdates
): Promise<void> {
  await apiClient.patch(
    `/deployments/${deploymentId}/settings/auth-settings`,
    settings
  );
}

export function useUpdateDeploymentAuthSettings() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  const mutation = useMutation({
    mutationFn: (settings: DeploymentAuthSettingsUpdates) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }
      return updateDeploymentAuthSettings(selectedDeployment.id, settings);
    },
    onSuccess: () => {
      // Invalidate deployment settings query to refresh data
      if (selectedDeployment) {
        queryClient.invalidateQueries({
          queryKey: ["deploymentSettings", selectedDeployment.id],
        });
      }
    },
  });

  return mutation;
}
