import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { DeploymentRestrictions } from "@/types/deployment";

async function updateDeploymentRestrictions(deploymentId: string, restrictions: DeploymentRestrictions) {
    const { data } = await apiClient.patch(`/deployments/${deploymentId}/restrictions`, restrictions);
    return data;
}

export function useUpdateDeploymentRestrictions() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    const mutation = useMutation({
        mutationFn: (restrictions: DeploymentRestrictions) => updateDeploymentRestrictions(selectedDeployment!.id, restrictions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deploymentRestrictions"] });
        },
    });

    return {
        mutate: mutation.mutate,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        error: mutation.error,
    };
}
