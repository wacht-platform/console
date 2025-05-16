import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { PaginatedResponse, QueryParams } from "@/types/api";

interface UserWithIdentifiers {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  first_name: string;
  last_name: string;
  username: string | null;
  primary_email_address: string | null;
  primary_phone_number: string | null;
}

async function fetchUsers(
  deploymentId: string,
  params: QueryParams,
): Promise<PaginatedResponse<UserWithIdentifiers>> {
  const { data } = await apiClient.get<PaginatedResponse<UserWithIdentifiers>>(
    `/deployments/${deploymentId}/users`,
    { params },
  );
  return data;
}

export function useDeploymentUsers(params: QueryParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["users", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchUsers(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id,
  });
}
