import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { toast } from "sonner";
import type { PaginatedResponse } from "@/types/api";
import type { AiTool, AiToolConfiguration, AiToolType } from "@/types/ai-tool";
import type { InternalToolListResponse } from "@/types/composio";

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

export type ApprovalAction = "allow" | "deny" | "review";

export interface UpdateAgentToolApprovalActionRequest {
  approval_action: ApprovalAction;
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
  const { data } = await apiClient.get<{ data?: AiTool } & AiTool>(
    `/deployments/${deploymentId}/ai/tools/${toolId}`,
  );
  return data.data ?? (data as AiTool);
}

async function createTool(
  deploymentId: string,
  tool: CreateToolRequest,
): Promise<AiTool> {
  const { data } = await apiClient.post<{ data?: AiTool } & AiTool>(
    `/deployments/${deploymentId}/ai/tools`,
    tool,
  );
  return data.data ?? (data as AiTool);
}

async function updateTool(
  deploymentId: string,
  toolId: string,
  tool: UpdateToolRequest,
): Promise<AiTool> {
  const { data } = await apiClient.patch<{ data?: AiTool } & AiTool>(
    `/deployments/${deploymentId}/ai/tools/${toolId}`,
    tool,
  );
  return data.data ?? (data as AiTool);
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

async function setAgentToolApprovalAction(
  deploymentId: string,
  agentId: string,
  toolId: string,
  payload: UpdateAgentToolApprovalActionRequest,
): Promise<void> {
  await apiClient.patch(
    `/deployments/${deploymentId}/ai/agents/${agentId}/tools/${toolId}`,
    payload,
  );
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

async function fetchInternalTools(
  deploymentId: string,
): Promise<InternalToolListResponse> {
  const { data } = await apiClient.get<InternalToolListResponse>(
    `/deployments/${deploymentId}/ai/internal-tools`,
  );
  return data;
}

/**
 * Built-in runtime tools (read_file, web_search, …) with their JSON schemas.
 * The list is constant per deploy; cached for the session.
 */
export function useInternalTools() {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["internal-tools", selectedDeployment?.id],
    queryFn: () => fetchInternalTools(selectedDeployment!.id),
    enabled: !!selectedDeployment?.id,
    staleTime: Infinity,
    select: (data) => data.tools,
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

export function useSetAgentToolApprovalAction() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      toolId,
      payload,
    }: {
      agentId: string;
      toolId: string;
      payload: UpdateAgentToolApprovalActionRequest;
    }) =>
      setAgentToolApprovalAction(selectedDeployment!.id, agentId, toolId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["agent-tools", selectedDeployment!.id, variables.agentId],
      });
      toast.success("Approval action updated");
    },
    onError: () => {
      toast.error("Failed to update approval action");
    },
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
