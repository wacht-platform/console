import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { useNavigate } from "react-router";

interface DeleteDeploymentRequest {
  projectId: string;
  deploymentId: string;
}

async function deleteDeployment(request: DeleteDeploymentRequest): Promise<void> {
  await apiClient.delete(`/project/${request.projectId}/deployment/${request.deploymentId}`);
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { projects, setSelectedProject, setSelectedDeployment } = useProjects();

  return useMutation({
    mutationFn: deleteDeployment,
    onSuccess: (_, variables) => {
      // Invalidate projects query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Handle navigation after successful deletion
      const project = projects?.find(p => p.id === variables.projectId);
      if (project) {
        // Find remaining deployments after deletion
        const remainingDeployments = project.deployments.filter(
          d => d.id !== variables.deploymentId
        );

        if (remainingDeployments.length > 0) {
          // Navigate to the first remaining deployment
          const firstDeployment = remainingDeployments[0];
          setSelectedProject(project, false); // Don't navigate yet
          setSelectedDeployment(firstDeployment, false); // Don't navigate yet
          navigate(`/project/${project.id}/deployment/${firstDeployment.id}`);
        } else {
          // No deployments left, navigate to projects page
          navigate("/");
        }
      } else {
        // Project not found, navigate to projects page
        navigate("/");
      }
    },
    onError: (error) => {
      console.error("Failed to delete deployment:", error);
    },
  });
}
