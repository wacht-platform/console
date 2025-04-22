import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { DeploymentWithSettings } from "@/types/deployment";

async function fetchDeploymentSettings(
  deploymentId: string,
): Promise<DeploymentWithSettings> {
  const { data } = await apiClient.get<DeploymentWithSettings>(
    `/deployments/${deploymentId}`,
  );
  return data;
}

export function useCurrentDeployemnt() {
  const { selectedDeployment, isLoading: isLoadingProjects } = useProjects();

  const { data: deploymentSettings, isLoading } = useQuery({
    queryKey: ["deploymentSettings", selectedDeployment?.id],
    queryFn: () => fetchDeploymentSettings(selectedDeployment!.id),
    enabled: !!selectedDeployment,
  });

  return {
    deploymentSettings,
    isLoading: isLoadingProjects || isLoading,
  };
}
