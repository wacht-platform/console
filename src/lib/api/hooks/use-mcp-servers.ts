import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateMcpServerRequest,
  DiscoverMcpServerAuthRequest,
  McpAuthDiscoveryResult,
  McpServer,
  UpdateMcpServerRequest,
} from "@/types/mcp-server";

interface GetMcpServersParams {
  limit?: number;
  offset?: number;
}

async function fetchMcpServers(
  deploymentId: string,
  params: GetMcpServersParams = {},
): Promise<PaginatedResponse<McpServer>> {
  const { data } = await apiClient.get<PaginatedResponse<McpServer>>(
    `/deployments/${deploymentId}/ai/mcp-servers`,
    { params },
  );
  return data;
}

async function fetchAgentMcpServers(
  deploymentId: string,
  agentId: string,
): Promise<McpServer[]> {
  const { data } = await apiClient.get<{ data: McpServer[] }>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/mcp-servers`,
  );
  return data.data;
}

async function createMcpServer(
  deploymentId: string,
  payload: CreateMcpServerRequest,
): Promise<McpServer> {
  const { data } = await apiClient.post<{ data?: McpServer } & McpServer>(
    `/deployments/${deploymentId}/ai/mcp-servers`,
    payload,
  );
  return data.data ?? (data as McpServer);
}

async function updateMcpServer(
  deploymentId: string,
  mcpServerId: string,
  payload: UpdateMcpServerRequest,
): Promise<McpServer> {
  const { data } = await apiClient.patch<{ data?: McpServer } & McpServer>(
    `/deployments/${deploymentId}/ai/mcp-servers/${mcpServerId}`,
    payload,
  );
  return data.data ?? (data as McpServer);
}

async function discoverMcpServerAuth(
  deploymentId: string,
  payload: DiscoverMcpServerAuthRequest,
): Promise<McpAuthDiscoveryResult> {
  const { data } = await apiClient.post<{ data?: McpAuthDiscoveryResult } & McpAuthDiscoveryResult>(
    `/deployments/${deploymentId}/ai/mcp-servers/discover`,
    payload,
  );
  return data.data ?? (data as McpAuthDiscoveryResult);
}

async function deleteMcpServer(
  deploymentId: string,
  mcpServerId: string,
): Promise<void> {
  await apiClient.delete(`/deployments/${deploymentId}/ai/mcp-servers/${mcpServerId}`);
}

async function attachMcpServerToAgent(
  deploymentId: string,
  agentId: string,
  mcpServerId: string,
): Promise<void> {
  await apiClient.post(
    `/deployments/${deploymentId}/ai/agents/${agentId}/mcp-servers/${mcpServerId}`,
  );
}

async function detachMcpServerFromAgent(
  deploymentId: string,
  agentId: string,
  mcpServerId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/agents/${agentId}/mcp-servers/${mcpServerId}`,
  );
}

export function useMcpServers(params: GetMcpServersParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["mcp-servers", selectedDeployment?.id, params],
    queryFn: () => fetchMcpServers(selectedDeployment!.id, params),
    enabled: !!selectedDeployment?.id,
    select: (response) => ({
      mcpServers: response.data,
      hasMore: response.has_more,
    }),
  });
}

export function useAgentMcpServers(agentId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-mcp-servers", selectedDeployment?.id, agentId],
    queryFn: () => fetchAgentMcpServers(selectedDeployment!.id, agentId),
    enabled: !!selectedDeployment?.id && !!agentId,
  });
}

export function useCreateMcpServer() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMcpServerRequest) =>
      createMcpServer(selectedDeployment!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mcp-servers", selectedDeployment!.id],
      });
      toast.success("MCP server created");
    },
    onError: () => {
      toast.error("Failed to create MCP server");
    },
  });
}

export function useUpdateMcpServer() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mcpServerId,
      payload,
    }: {
      mcpServerId: string;
      payload: UpdateMcpServerRequest;
    }) => updateMcpServer(selectedDeployment!.id, mcpServerId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["mcp-servers", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["mcp-server", selectedDeployment!.id, variables.mcpServerId],
      });
      toast.success("MCP server updated");
    },
    onError: () => {
      toast.error("Failed to update MCP server");
    },
  });
}

export function useDeleteMcpServer() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mcpServerId: string) =>
      deleteMcpServer(selectedDeployment!.id, mcpServerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mcp-servers", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({ queryKey: ["agent-mcp-servers"] });
      toast.success("MCP server deleted");
    },
    onError: () => {
      toast.error("Failed to delete MCP server");
    },
  });
}

export function useAttachMcpServer(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mcpServerId: string) =>
      attachMcpServerToAgent(selectedDeployment!.id, agentId, mcpServerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-mcp-servers", selectedDeployment!.id, agentId],
      });
      toast.success("MCP server attached");
    },
    onError: () => {
      toast.error("Failed to attach MCP server");
    },
  });
}

export function useDetachMcpServer(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mcpServerId: string) =>
      detachMcpServerFromAgent(selectedDeployment!.id, agentId, mcpServerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-mcp-servers", selectedDeployment!.id, agentId],
      });
      toast.success("MCP server detached");
    },
    onError: () => {
      toast.error("Failed to detach MCP server");
    },
  });
}

export function useDiscoverMcpServerAuth() {
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (payload: DiscoverMcpServerAuthRequest) =>
      discoverMcpServerAuth(selectedDeployment!.id, payload),
  });
}
