import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { UserDetails } from "@/types/user";

async function fetchUserDetails(
  deploymentId: string,
  userId: string
): Promise<UserDetails> {
  const { data } = await apiClient.get<UserDetails>(
    `/deployments/${deploymentId}/users/${userId}/details`
  );
  return data;
}

export function useUserDetails(userId: string | undefined) {
  const { selectedDeployment } = useProjects();

  return useQuery<UserDetails, Error>({
    queryKey: ["user-details", selectedDeployment?.id, userId],
    queryFn: () => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return fetchUserDetails(selectedDeployment.id.toString(), userId);
    },
    enabled: !!selectedDeployment?.id && !!userId,
  });
}
