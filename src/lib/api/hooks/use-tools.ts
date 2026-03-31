import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/api";
import type { AiTool, AiToolConfiguration, AiToolType } from "@/types/ai-tool";

export interface CreateToolRequest {
  name: string;
  description?: string;
  tool_type: AiToolType;
  requires_user_approval: boolean;
  configuration: AiToolConfiguration;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  tool_type?: AiToolType;
  requires_user_approval?: boolean;
  configuration?: AiToolConfiguration;
}

interface GetToolsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

async function fetchTools(
  deploymentId: string,
  params: GetToolsParams = {},
): Promise<PaginatedResponse<AiTool>> {
  const { data } = await apiClient.get<PaginatedResponse<AiTool>>(
    `/deployments/${deploymentId}/ai/tools`,
    { params },
  );
  return data;
}

async function fetchAgentTools(
  deploymentId: string,
  agentId: string,
): Promise<PaginatedResponse<AiTool>> {
  const { data } = await apiClient.get<PaginatedResponse<AiTool>>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/tools`,
  );
  return data;
}

async function fetchTool(
  deploymentId: string,
  toolId: string,
): Promise<AiTool> {
  const { data } = await apiClient.get<{ data: AiTool }>(
    `/deployments/${deploymentId}/ai/tools/${toolId}`,
  );
  return data.data;
}

async function createTool(
  deploymentId: string,
  tool: CreateToolRequest,
): Promise<AiTool> {
  const { data } = await apiClient.post<{ data: AiTool }>(
    `/deployments/${deploymentId}/ai/tools`,
    tool,
  );
  return data.data;
}

async function updateTool(
  deploymentId: string,
  toolId: string,
  tool: UpdateToolRequest,
): Promise<AiTool> {
  const { data } = await apiClient.patch<{ data: AiTool }>(
    `/deployments/${deploymentId}/ai/tools/${toolId}`,
    tool,
  );
  return data.data;
}

async function deleteTool(deploymentId: string, toolId: string): Promise<void> {
  await apiClient.delete(`/deployments/${deploymentId}/ai/tools/${toolId}`);
}

async function attachToolToAgent(
  deploymentId: string,
  agentId: string,
  toolId: string,
): Promise<void> {
  await apiClient.post(`/deployments/${deploymentId}/ai/agents/${agentId}/tools/${toolId}`);
}

async function detachToolFromAgent(
  deploymentId: string,
  agentId: string,
  toolId: string,
): Promise<void> {
  await apiClient.delete(`/deployments/${deploymentId}/ai/agents/${agentId}/tools/${toolId}`);
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

export function useTool(toolId: string, enabled = true) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["tool", selectedDeployment?.id, toolId],
    queryFn: () => fetchTool(selectedDeployment!.id, toolId),
    enabled: enabled && !!selectedDeployment?.id && !!toolId,
  });
}

export function useAgentTools(agentId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-tools", selectedDeployment?.id, agentId],
    queryFn: () => fetchAgentTools(selectedDeployment!.id, agentId),
    enabled: !!selectedDeployment?.id && !!agentId,
    select: (data) => data.data,
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
      toast.success("Tool created successfully!");
    },
    onError: () => {
      toast.error("Failed to create tool. Please try again.");
    },
  });
}

export function useUpdateTool() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      toolId,
      tool,
    }: {
      toolId: string;
      tool: UpdateToolRequest;
    }) => updateTool(selectedDeployment!.id, toolId, tool),
    onSuccess: (_, { toolId }) => {
      queryClient.invalidateQueries({
        queryKey: ["tools", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tool", selectedDeployment!.id, toolId],
      });
      toast.success("Tool updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update tool. Please try again.");
    },
  });
}

export function useDeleteTool() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) => deleteTool(selectedDeployment!.id, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tools", selectedDeployment!.id],
      });
      toast.success("Tool deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete tool. Please try again.");
    },
  });
}

export function useAttachTool(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) =>
      attachToolToAgent(selectedDeployment!.id, agentId, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-tools", selectedDeployment?.id, agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, agentId],
      });
      toast.success("Tool attached");
    },
    onError: () => {
      toast.error("Failed to attach tool");
    },
  });
}

export function useDetachTool(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) =>
      detachToolFromAgent(selectedDeployment!.id, agentId, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-tools", selectedDeployment?.id, agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, agentId],
      });
      toast.success("Tool detached");
    },
    onError: () => {
      toast.error("Failed to detach tool");
    },
  });
}
