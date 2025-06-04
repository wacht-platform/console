import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { PaginatedResponse } from "@/types/api";

export interface Agent {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  deployment_id: string;
  configuration: any;
  tools_count: number;
  workflows_count: number;
  knowledge_bases_count: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  configuration?: any;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  status?: string;
  configuration?: any;
}

interface GetAgentsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

async function fetchAgents(
  deploymentId: string,
  params: GetAgentsParams = {}
): Promise<PaginatedResponse<Agent>> {
  const { data } = await apiClient.get<PaginatedResponse<Agent>>(
    `/deployment/${deploymentId}/ai-agents`,
    { params }
  );
  return data;
}

async function fetchAgent(
  deploymentId: string,
  agentId: string
): Promise<Agent> {
  const { data } = await apiClient.get<{ data: Agent }>(
    `/deployment/${deploymentId}/ai-agents/${agentId}`
  );
  return data.data;
}

async function createAgent(
  deploymentId: string,
  agent: CreateAgentRequest
): Promise<Agent> {
  const { data } = await apiClient.post<{ data: Agent }>(
    `/deployment/${deploymentId}/ai-agents`,
    agent
  );
  return data.data;
}

async function updateAgent(
  deploymentId: string,
  agentId: string,
  agent: UpdateAgentRequest
): Promise<Agent> {
  const { data } = await apiClient.patch<{ data: Agent }>(
    `/deployment/${deploymentId}/ai-agents/${agentId}`,
    agent
  );
  return data.data;
}

async function deleteAgent(
  deploymentId: string,
  agentId: string
): Promise<void> {
  await apiClient.delete(`/deployment/${deploymentId}/ai-agents/${agentId}`);
}

export function useAgents(params: GetAgentsParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agents", selectedDeployment?.id, params],
    queryFn: () => fetchAgents(selectedDeployment!.id, params),
    enabled: !!selectedDeployment?.id,
    select: (data) => ({
      agents: data.data,
      hasMore: data.has_more,
    }),
  });
}

export function useAgent(agentId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent", selectedDeployment?.id, agentId],
    queryFn: () => fetchAgent(selectedDeployment!.id, agentId),
    enabled: !!selectedDeployment?.id && !!agentId,
  });
}

export function useCreateAgent() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agent: CreateAgentRequest) =>
      createAgent(selectedDeployment!.id, agent),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agents", selectedDeployment!.id],
      });
    },
  });
}

export function useUpdateAgent() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, agent }: { agentId: string; agent: UpdateAgentRequest }) =>
      updateAgent(selectedDeployment!.id, agentId, agent),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({
        queryKey: ["agents", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent", selectedDeployment!.id, agentId],
      });
    },
  });
}

export function useDeleteAgent() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) =>
      deleteAgent(selectedDeployment!.id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agents", selectedDeployment!.id],
      });
    },
  });
}
