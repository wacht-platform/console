import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { DeploymentWithSettings } from "../../../types/deployment";
import { useProjectAndDeployments } from "./use-projects";

async function fetchDeploymentSettings(
  deploymentId: string,
): Promise<DeploymentWithSettings> {
  const { data } = await apiClient.get<DeploymentWithSettings>(
    `/deployment/${deploymentId}/settings`,
  );
  return data;
}

export function useDeploymentSettings() {
  const { selectedDeployment } = useProjectAndDeployments();

  const { data: deploymentSettings, isLoading } = useQuery({
    queryKey: ["deploymentSettings", selectedDeployment?.id],
    queryFn: () => fetchDeploymentSettings(selectedDeployment!.id),
    enabled: !!selectedDeployment,
  });

  return {
    deploymentSettings,
    isLoading,
  };
}
