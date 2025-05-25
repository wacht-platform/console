import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { UserPhoneNumber } from "@/types/user";

interface AddPhoneRequest {
  phone_number: string;
  verified?: boolean;
  is_primary?: boolean;
}

interface UpdatePhoneRequest {
  phone_number?: string;
  verified?: boolean;
  is_primary?: boolean;
}

async function addUserPhone(
  deploymentId: string,
  userId: string,
  data: AddPhoneRequest
): Promise<UserPhoneNumber> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/users/${userId}/phones`,
    data
  );
  return response.data.data;
}

async function updateUserPhone(
  deploymentId: string,
  userId: string,
  phoneId: string,
  data: UpdatePhoneRequest
): Promise<UserPhoneNumber> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/users/${userId}/phones/${phoneId}`,
    data
  );
  return response.data.data;
}

async function deleteUserPhone(
  deploymentId: string,
  userId: string,
  phoneId: string
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/users/${userId}/phones/${phoneId}`
  );
}

export function useAddUserPhone(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: AddPhoneRequest) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return addUserPhone(selectedDeployment.id.toString(), userId, data);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the phone list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}

export function useUpdateUserPhone(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: ({ phoneId, data }: { phoneId: string; data: UpdatePhoneRequest }) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return updateUserPhone(selectedDeployment.id.toString(), userId, phoneId, data);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the phone list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}

export function useDeleteUserPhone(userId: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (phoneId: string) => {
      if (!selectedDeployment?.id || !userId) {
        throw new Error("No deployment or user selected");
      }
      return deleteUserPhone(selectedDeployment.id.toString(), userId, phoneId);
    },
    onSuccess: () => {
      // Invalidate user details to refresh the phone list
      queryClient.invalidateQueries({ 
        queryKey: ["user-details", selectedDeployment?.id, userId] 
      });
    },
  });
}
