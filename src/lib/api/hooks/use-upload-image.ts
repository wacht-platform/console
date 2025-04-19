import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

type ImageType = "logo" | "favicon" | "user-profile" | "org-profile";

interface UploadResponse {
  url: string;
}

async function uploadImage(
  deploymentId: string,
  imageType: ImageType,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.post<UploadResponse>(
    `/deployments/${deploymentId}/upload/${imageType}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.url;
}

export function useUploadImage() {
  const { selectedDeployment } = useProjects();

  const mutation = useMutation({
    mutationFn: ({
      imageType,
      file,
    }: {
      imageType: ImageType;
      file: File;
    }) => {
      if (!selectedDeployment) {
        throw new Error("No deployment selected");
      }
      return uploadImage(selectedDeployment.id, imageType, file);
    },
  });

  return mutation;
}
