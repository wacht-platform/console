import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface Role {
    id: string;
    name: string;
    description: string;
}

type ApiRole = Omit<Role, "id"> & {
    id: string | number;
};

const fetchDeploymentOrgRoles = async (
    deploymentId: string,
    organizationId: string,
): Promise<Role[]> => {
    const path = `/deployments/${deploymentId}/organizations/${organizationId}/roles`;
    const response = await apiClient.get(path);
    return (response.data.data ?? []).map((role: ApiRole) => ({
        ...role,
        id: String(role.id),
    }));
};

export const useDeploymentOrgRoles = (organizationId?: string) => {
    const { selectedDeployment } = useProjects();
    if (!selectedDeployment) {
        throw new Error("Deployment ID is required");
    }

    return useQuery<Role[], Error>({
        queryKey: ["deploymentOrgRoles", selectedDeployment?.id, organizationId],
        queryFn: () => fetchDeploymentOrgRoles(selectedDeployment!.id, organizationId!),
        enabled: !!selectedDeployment?.id && !!organizationId,
    });
};
