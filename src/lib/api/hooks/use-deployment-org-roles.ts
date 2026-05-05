import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface Role {
    id: string;
    name: string;
    description?: string;
}

type ApiRole = Omit<Role, "id"> & {
    id: string | number;
};

const fetchDeploymentOrgRoles = async (
    deploymentId: string,
): Promise<Role[]> => {
    const path = `/deployments/${deploymentId}/settings/b2b/organization-roles`;
    const response = await apiClient.get(path);
    return (response.data.data ?? []).map((role: ApiRole) => ({
        ...role,
        id: String(role.id),
    }));
};

export const useDeploymentOrgRoles = () => {
    const { selectedDeployment } = useProjects();

    return useQuery<Role[], Error>({
        queryKey: ["deploymentOrgRoles", selectedDeployment?.id],
        queryFn: () => fetchDeploymentOrgRoles(selectedDeployment!.id),
        enabled: !!selectedDeployment?.id,
    });
};
