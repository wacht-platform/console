import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface UploadResponse {
  profile_picture_url?: string;
  profile_image_url?: string;
}

async function uploadUserProfileImage(
  deploymentId: string,
  userId: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("profile_image", file);

  const response = await apiClient.patch<UploadResponse>(
    `/deployments/${deploymentId}/users/${userId}`,
    formData
  );

  return response.data.profile_picture_url ?? response.data.profile_image_url ?? "";
}

export function useUploadUserImage(userId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }
      return uploadUserProfileImage(selectedDeployment.id, userId, file);
    },
    onSuccess: () => {
      // Invalidate user details query to refresh the profile picture
      queryClient.invalidateQueries({
        queryKey: ["user-details", selectedDeployment?.id, userId],
      });
    },
  });

  return mutation;
}
