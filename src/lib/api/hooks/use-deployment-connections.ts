import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { DeploymentSocialConnection, DeploymentSocialConnectionUpsert } from "@/types/deployment";

async function fetchDeploymentSocialConnections(
    deploymentId: string,
): Promise<DeploymentSocialConnection[]> {
    const { data } = await apiClient.get<{ data: DeploymentSocialConnection[] }>(
        `/deployments/${deploymentId}/social-connections`,
    );
    return data.data;
}

export function useDeploymentSocialConnections() {
    const { selectedDeployment } = useProjects();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["deploymentSocialConnections", selectedDeployment?.id],
        queryFn: () => fetchDeploymentSocialConnections(String(selectedDeployment!.id)),
        enabled: !!selectedDeployment,
    });

    return {
        data,
        isLoading,
        refetch,
    };
}

interface UpsertParams {
    deploymentId: string;
    payload: DeploymentSocialConnectionUpsert;
}

async function upsertDeploymentSocialConnection({ deploymentId, payload }: UpsertParams): Promise<DeploymentSocialConnection> {
    const { data } = await apiClient.put<{ data: DeploymentSocialConnection }>(
        `/deployments/${deploymentId}/social-connections`,
        payload
    );
    return data.data;
}

export function useUpsertDeploymentSocialConnection() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation<DeploymentSocialConnection, Error, UpsertParams>({
        mutationFn: upsertDeploymentSocialConnection,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["deploymentSocialConnections", selectedDeployment?.id],
            });
        },
    });
}
