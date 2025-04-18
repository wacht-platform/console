import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { DeploymentJWTTemplate } from "@/types/deployment";
import { useProjects } from "./use-projects";

async function fetchDeploymentJWTTemplates(deploymentId: string): Promise<DeploymentJWTTemplate[]> {
    const { data } = await apiClient.get<{ data: DeploymentJWTTemplate[] }>(
        `/deployments/${deploymentId}/jwt-templates`,
    );
    return data.data;
}

async function createDeploymentJWTTemplate(deploymentId: string, template: DeploymentJWTTemplate): Promise<DeploymentJWTTemplate> {
    const { data } = await apiClient.post<{ data: DeploymentJWTTemplate }>(
        `/deployments/${deploymentId}/jwt-templates`,
        template,
    );
    return data.data;
}

async function updateDeploymentJWTTemplate(deploymentId: string, templateId: string, template: DeploymentJWTTemplate): Promise<DeploymentJWTTemplate> {
    const { data } = await apiClient.patch<{ data: DeploymentJWTTemplate }>(
        `/deployments/${deploymentId}/jwt-templates/${templateId}`,
        template,
    );
    return data.data;
}

async function deleteDeploymentJWTTemplate(deploymentId: string, templateId: string): Promise<void> {
    await apiClient.delete(`/deployments/${deploymentId}/jwt-templates/${templateId}`);
}

export function useDeploymentJWTTemplates() {
    const { selectedDeployment } = useProjects();
    const queryClient = useQueryClient();

    const { data: jwtTemplates, isLoading: isLoadingJWTTemplates } = useQuery({
        queryKey: ["deployment-jwt-templates", selectedDeployment!.id],
        queryFn: () => fetchDeploymentJWTTemplates(selectedDeployment!.id),
        enabled: !!selectedDeployment?.id,
    });

    const { mutateAsync: createJWTTemplate, isPending: isCreatingJWTTemplate } = useMutation({
        mutationFn: (template: DeploymentJWTTemplate) => createDeploymentJWTTemplate(selectedDeployment!.id, template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deployment-jwt-templates", selectedDeployment!.id] });
        },
    });

    const { mutateAsync: updateJWTTemplate, isPending: isUpdatingJWTTemplate } = useMutation({
        mutationFn: (template: DeploymentJWTTemplate) => updateDeploymentJWTTemplate(selectedDeployment!.id, template.id, template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deployment-jwt-templates", selectedDeployment!.id] });
        },
    });

    const { mutateAsync: deleteJWTTemplate, isPending: isDeletingJWTTemplate } = useMutation({
        mutationFn: (templateId: string) => deleteDeploymentJWTTemplate(selectedDeployment!.id, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deployment-jwt-templates", selectedDeployment!.id] });
        },
    });

    return {
        jwtTemplates,
        isLoadingJWTTemplates,
        isCreatingJWTTemplate,
        createJWTTemplate,
        isUpdatingJWTTemplate,
        updateJWTTemplate,
        isDeletingJWTTemplate,
        deleteJWTTemplate,
    };
}