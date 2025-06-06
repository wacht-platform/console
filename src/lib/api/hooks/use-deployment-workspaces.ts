import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { PaginatedResponse, QueryParams } from "@/types/api";

interface WorkspaceWithOrgName {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  organization_name: string;
}
async function fetchWorkspaces(
  deploymentId: string,
  params: QueryParams
): Promise<PaginatedResponse<WorkspaceWithOrgName>> {
  const { data } = await apiClient.get<PaginatedResponse<WorkspaceWithOrgName>>(
    `/deployments/${deploymentId}/workspaces`,
    { params }
  );
  return data;
}

export function useDeploymentWorkspaces(params: QueryParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["workspaces", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchWorkspaces(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id,
  });
}
