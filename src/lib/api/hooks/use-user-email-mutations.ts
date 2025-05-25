import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { UserEmailAddress } from "@/types/user";

interface AddEmailRequest {
  email: string;
  verified?: boolean;
  is_primary?: boolean;
}

interface UpdateEmailRequest {
  email?: string;
  verified?: boolean;
  is_primary?: boolean;
}

async function addUserEmail(
  deploymentId: string,
  userId: string,
  data: AddEmailRequest
): Promise<UserEmailAddress> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/users/${userId}/emails`,
    data
  );
  return response.data.data;
}

async function updateUserEmail(
  deploymentId: string,
  userId: string,
  emailId: string,
  data: UpdateEmailRequest
): Promise<UserEmailAddress> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/users/${userId}/emails/${emailId}`,
    data
  );
  return response.data.data;
}

async function deleteUserEmail(
  deploymentId: string,
  userId: string,
  emailId: string
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/users/${userId}/emails/${emailId}`
  );
}

export function useAddUserEmail(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: AddEmailRequest) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return addUserEmail(selectedDeployment.id.toString(), userId, data);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the email list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}

export function useUpdateUserEmail(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: ({ emailId, data }: { emailId: string; data: UpdateEmailRequest }) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return updateUserEmail(selectedDeployment.id.toString(), userId, emailId, data);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the email list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}

export function useDeleteUserEmail(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (emailId: string) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return deleteUserEmail(selectedDeployment.id.toString(), userId, emailId);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the email list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}
