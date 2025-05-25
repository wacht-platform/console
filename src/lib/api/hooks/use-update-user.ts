import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { UserDetails } from "@/types/user";

interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  username?: string;
  public_metadata?: any;
  private_metadata?: any;
}

async function updateUser(
  deploymentId: string,
  userId: string,
  data: UpdateUserRequest
): Promise<UserDetails> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/users/${userId}`,
    data
  );
  return response.data.data;
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return updateUser(selectedDeployment.id.toString(), userId, data);
    },
    onSuccess: (updatedUser) => {
      // Invalidate and update the user details query
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
      
      // Optionally update the cache directly
      queryClient.setQueryData(
        ["user-details", selectedDeployment?.id, userId],
        updatedUser
      );
      
      // Also invalidate the users list to reflect any changes
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
