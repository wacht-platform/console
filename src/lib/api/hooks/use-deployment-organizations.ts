import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { PaginatedResponse, QueryParams } from "@/types/api";

interface Organization {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
}

async function fetchOrganizations(
  deploymentId: string,
  params: QueryParams,
): Promise<PaginatedResponse<Organization>> {
  const { data } = await apiClient.get<PaginatedResponse<Organization>>(
    `/deployments/${deploymentId}/organizations`,
    { params },
  );
  return data;
}

export function useDeploymentOrganizations(params: QueryParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["organizations", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchOrganizations(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id,
  });
}
