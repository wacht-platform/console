import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface Role {
    id: string;
    name: string;
    description: string;
}

const fetchDeploymentWorkspaceRoles = async (deploymentId: string): Promise<Role[]> => {
    const response = await apiClient.get(`/deployments/${deploymentId}/workspace-roles`);
    return response.data.data;
};

export const useDeploymentWorkspaceRoles = () => {
    const { selectedDeployment } = useProjects();

    return useQuery<Role[], Error>({
        queryKey: ["deploymentWorkspaceRoles", selectedDeployment!.id],
        queryFn: () => fetchDeploymentWorkspaceRoles(selectedDeployment!.id),
        enabled: !!selectedDeployment?.id,
    });
}; 