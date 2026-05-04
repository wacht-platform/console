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

const fetchDeploymentWorkspaceRoles = async (
    deploymentId: string,
    workspaceId: string,
): Promise<Role[]> => {
    const path = `/deployments/${deploymentId}/workspaces/${workspaceId}/roles`;
    const response = await apiClient.get(path);
    return (response.data.data ?? []).map((role: ApiRole) => ({
        ...role,
        id: String(role.id),
    }));
};

export const useDeploymentWorkspaceRoles = (workspaceId?: string) => {
    const { selectedDeployment } = useProjects();

    return useQuery<Role[], Error>({
        queryKey: ["deploymentWorkspaceRoles", selectedDeployment?.id, workspaceId],
        queryFn: () => fetchDeploymentWorkspaceRoles(selectedDeployment!.id, workspaceId!),
        enabled: !!selectedDeployment?.id && !!workspaceId,
    });
};
