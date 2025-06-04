import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { PaginatedResponse } from "@/types/api";
import type { AiTool, AiToolConfiguration, AiToolType } from "@/types/ai-tool";

export interface CreateToolRequest {
  name: string;
  description?: string;
  tool_type: AiToolType;
  configuration: AiToolConfiguration;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  tool_type?: AiToolType;
  configuration?: AiToolConfiguration;
}

interface GetToolsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

async function fetchTools(
  deploymentId: string,
  params: GetToolsParams = {}
): Promise<PaginatedResponse<AiTool>> {
  const { data } = await apiClient.get<PaginatedResponse<AiTool>>(
    `/deployment/${deploymentId}/ai-tools`,
    { params }
  );
  return data;
}

async function fetchTool(
  deploymentId: string,
  toolId: string
): Promise<AiTool> {
  const { data } = await apiClient.get<{ data: AiTool }>(
    `/deployment/${deploymentId}/ai-tools/${toolId}`
  );
  return data.data;
}

async function createTool(
  deploymentId: string,
  tool: CreateToolRequest
): Promise<AiTool> {
  const { data } = await apiClient.post<{ data: AiTool }>(
    `/deployment/${deploymentId}/ai-tools`,
    tool
  );
  return data.data;
}

async function updateTool(
  deploymentId: string,
  toolId: string,
  tool: UpdateToolRequest
): Promise<AiTool> {
  const { data } = await apiClient.patch<{ data: AiTool }>(
    `/deployment/${deploymentId}/ai-tools/${toolId}`,
    tool
  );
  return data.data;
}

async function deleteTool(
  deploymentId: string,
  toolId: string
): Promise<void> {
  await apiClient.delete(`/deployment/${deploymentId}/ai-tools/${toolId}`);
}

export function useTools(params: GetToolsParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["tools", selectedDeployment?.id, params],
    queryFn: () => fetchTools(selectedDeployment!.id, params),
    enabled: !!selectedDeployment?.id,
    select: (data) => ({
      tools: data.data,
      hasMore: data.has_more,
    }),
  });
}

export function useTool(toolId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["tool", selectedDeployment?.id, toolId],
    queryFn: () => fetchTool(selectedDeployment!.id, toolId),
    enabled: !!selectedDeployment?.id && !!toolId,
  });
}

export function useCreateTool() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tool: CreateToolRequest) =>
      createTool(selectedDeployment!.id, tool),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tools", selectedDeployment!.id],
      });
    },
  });
}

export function useUpdateTool() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ toolId, tool }: { toolId: string; tool: UpdateToolRequest }) =>
      updateTool(selectedDeployment!.id, toolId, tool),
    onSuccess: (_, { toolId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tools", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tool", selectedDeployment!.id, toolId],
      });
    },
  });
}

export function useDeleteTool() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) =>
      deleteTool(selectedDeployment!.id, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tools", selectedDeployment!.id],
      });
    },
  });
}
