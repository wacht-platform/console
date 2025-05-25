import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { PaginatedResponse, QueryParams } from "@/types/api";
import {
  UserWithIdentifiers,
  DeploymentInvitation,
  DeploymentWaitlistUser,
} from "@/types/user";

async function fetchUsers(
  deploymentId: string,
  params: QueryParams
): Promise<PaginatedResponse<UserWithIdentifiers>> {
  const { data } = await apiClient.get<PaginatedResponse<UserWithIdentifiers>>(
    `/deployments/${deploymentId}/users`,
    { params }
  );
  return data;
}

async function fetchInvitedUsers(
  deploymentId: string,
  params: QueryParams
): Promise<PaginatedResponse<DeploymentInvitation>> {
  const { data } = await apiClient.get<PaginatedResponse<DeploymentInvitation>>(
    `/deployments/${deploymentId}/invited-users`,
    { params }
  );
  return data;
}

async function fetchUserWaitlist(
  deploymentId: string,
  params: QueryParams
): Promise<PaginatedResponse<DeploymentWaitlistUser>> {
  const { data } = await apiClient.get<
    PaginatedResponse<DeploymentWaitlistUser>
  >(`/deployments/${deploymentId}/user-waitlist`, { params });
  return data;
}

type ExtendedHookParams = QueryParams & {
  enabled: boolean;
};

export function useDeploymentUsers(
  params: ExtendedHookParams = { enabled: true }
) {
  const { selectedDeployment } = useProjects();

  return useQuery<PaginatedResponse<UserWithIdentifiers>, Error>({
    queryKey: ["users", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchUsers(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id && params.enabled,
  });
}

export function useDeploymentInvitedUsers(params: ExtendedHookParams) {
  const { selectedDeployment } = useProjects();
  return useQuery<PaginatedResponse<DeploymentInvitation>, Error>({
    queryKey: ["invited-users", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchInvitedUsers(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id && params.enabled,
  });
}

export function useDeploymentWaitlist(params: ExtendedHookParams) {
  const { selectedDeployment } = useProjects();
  return useQuery<PaginatedResponse<DeploymentWaitlistUser>, Error>({
    queryKey: ["user-waitlist", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchUserWaitlist(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id && params.enabled,
  });
}
