import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/api";
import type { AgentIntegration, CreateIntegrationRequest, UpdateIntegrationRequest } from "@/types/agent-integration";

interface GetIntegrationsParams {
    limit?: number;
    offset?: number;
}

async function fetchIntegrations(
    deploymentId: string,
    agentId: string,
    params: GetIntegrationsParams = {},
): Promise<PaginatedResponse<AgentIntegration>> {
    const { data } = await apiClient.get<PaginatedResponse<AgentIntegration>>(
        `/deployments/${deploymentId}/agents/${agentId}/integrations`,
        { params },
    );
    return data;
}

async function fetchIntegration(
    deploymentId: string,
    agentId: string,
    integrationId: string,
): Promise<AgentIntegration> {
    const { data } = await apiClient.get<{ data: AgentIntegration }>(
        `/deployments/${deploymentId}/agents/${agentId}/integrations/${integrationId}`,
    );
    return data.data;
}

async function createIntegration(
    deploymentId: string,
    agentId: string,
    integration: CreateIntegrationRequest,
): Promise<AgentIntegration> {
    const { data } = await apiClient.post<{ data: AgentIntegration }>(
        `/deployments/${deploymentId}/agents/${agentId}/integrations`,
        integration,
    );
    return data.data;
}

async function updateIntegration(
    deploymentId: string,
    agentId: string,
    integrationId: string,
    integration: UpdateIntegrationRequest,
): Promise<AgentIntegration> {
    const { data } = await apiClient.patch<{ data: AgentIntegration }>(
        `/deployments/${deploymentId}/agents/${agentId}/integrations/${integrationId}`,
        integration,
    );
    return data.data;
}

async function deleteIntegration(
    deploymentId: string,
    agentId: string,
    integrationId: string,
): Promise<void> {
    await apiClient.delete(`/deployments/${deploymentId}/agents/${agentId}/integrations/${integrationId}`);
}

export function useIntegrations(agentId: string, params: GetIntegrationsParams = {}) {
    const { selectedDeployment } = useProjects();

    return useQuery({
        queryKey: ["integrations", selectedDeployment?.id, agentId, params],
        queryFn: () => fetchIntegrations(selectedDeployment!.id, agentId, params),
        enabled: !!selectedDeployment?.id && !!agentId,
        select: (data) => ({
            integrations: data.data,
            hasMore: data.has_more,
        }),
    });
}

export function useIntegration(agentId: string, integrationId: string) {
    const { selectedDeployment } = useProjects();

    return useQuery({
        queryKey: ["integration", selectedDeployment?.id, agentId, integrationId],
        queryFn: () => fetchIntegration(selectedDeployment!.id, agentId, integrationId),
        enabled: !!selectedDeployment?.id && !!agentId && !!integrationId,
    });
}

export function useCreateIntegration(agentId: string) {
    const { selectedDeployment } = useProjects();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (integration: CreateIntegrationRequest) =>
            createIntegration(selectedDeployment!.id, agentId, integration),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["integrations", selectedDeployment!.id, agentId],
            });
            queryClient.invalidateQueries({
                queryKey: ["agent", selectedDeployment!.id, agentId],
            });
            queryClient.invalidateQueries({
                queryKey: ["agent-details", selectedDeployment!.id, agentId],
            });
            toast.success("Integration created successfully!");
        },
        onError: () => {
            toast.error("Failed to create integration. Please try again.");
        },
    });
}

export function useUpdateIntegration(agentId: string) {
    const { selectedDeployment } = useProjects();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            ...updates
        }: UpdateIntegrationRequest & { id: string }) =>
            updateIntegration(selectedDeployment!.id, agentId, id, updates),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({
                queryKey: ["integrations", selectedDeployment!.id, agentId],
            });
            queryClient.invalidateQueries({
                queryKey: ["integration", selectedDeployment!.id, agentId, id],
            });
            queryClient.invalidateQueries({
                queryKey: ["agent", selectedDeployment!.id, agentId],
            });
            queryClient.invalidateQueries({
                queryKey: ["agent-details", selectedDeployment!.id, agentId],
            });
            toast.success("Integration updated successfully!");
        },
        onError: () => {
            toast.error("Failed to update integration. Please try again.");
        },
    });
}

export function useDeleteIntegration(agentId: string) {
    const { selectedDeployment } = useProjects();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (integrationId: string) => deleteIntegration(selectedDeployment!.id, agentId, integrationId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["integrations", selectedDeployment!.id, agentId],
            });
            queryClient.invalidateQueries({
                queryKey: ["agent", selectedDeployment!.id, agentId],
            });
            queryClient.invalidateQueries({
                queryKey: ["agent-details", selectedDeployment!.id, agentId],
            });
            toast.success("Integration deleted successfully!");
        },
        onError: () => {
            toast.error("Failed to delete integration. Please try again.");
        },
    });
}

