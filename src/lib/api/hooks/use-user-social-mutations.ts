import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

async function deleteUserSocialConnection(
  deploymentId: string,
  userId: string,
  connectionId: string
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/users/${userId}/social-connections/${connectionId}`
  );
}

export function useDeleteUserSocialConnection(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (connectionId: string) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return deleteUserSocialConnection(selectedDeployment.id.toString(), userId, connectionId);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the social connections list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}
