import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface Role {
    id: string;
    name: string;
    description: string;
}

const fetchDeploymentOrgRoles = async (deploymentId: string): Promise<Role[]> => {
    const response = await apiClient.get(`/deployments/${deploymentId}/organization-roles`);
    return response.data.data;
};

export const useDeploymentOrgRoles = () => {
    const { selectedDeployment } = useProjects();
    if (!selectedDeployment) {
        throw new Error("Deployment ID is required");
    }

    return useQuery<Role[], Error>({
        queryKey: ["deploymentOrgRoles", selectedDeployment!.id],
        queryFn: () => fetchDeploymentOrgRoles(selectedDeployment!.id),
        enabled: !!selectedDeployment?.id,
    });
}; 