import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { PaginatedResponse } from "@/types/api";

export interface AgentConfiguration {
  [key: string]: unknown;
}

export interface Agent {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  deployment_id: string;
  configuration: AgentConfiguration;
  tools_count: number;
  knowledge_bases_count: number;
  sub_agents?: Array<string | number>;
  spawn_config?: SpawnConfig;
}

export interface SpawnConfig {
  max_parallel_children?: number;
  default_timeout_secs?: number;
  allow_fork?: boolean;
  allow_exec?: boolean;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  configuration?: AgentConfiguration;
  tool_ids?: string[];
  knowledge_base_ids?: string[];
  sub_agents?: string[];
  spawn_config?: SpawnConfig;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  status?: string;
  configuration?: AgentConfiguration;
  spawn_config?: SpawnConfig;
}

interface GetAgentsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

async function fetchAgents(
  deploymentId: string,
  params: GetAgentsParams = {},
): Promise<PaginatedResponse<Agent>> {
  const { data } = await apiClient.get<PaginatedResponse<Agent>>(
    `/deployments/${deploymentId}/ai/agents`,
    { params },
  );
  return data;
}

async function fetchAgent(
  deploymentId: string,
  agentId: string,
): Promise<Agent> {
  const { data } = await apiClient.get<{ data?: Agent } & Agent>(
    `/deployments/${deploymentId}/ai/agents/${agentId}`,
  );
  return data.data ?? (data as Agent);
}

async function createAgent(
  deploymentId: string,
  agent: CreateAgentRequest,
): Promise<Agent> {
  const { data } = await apiClient.post<{ data?: Agent } & Agent>(
    `/deployments/${deploymentId}/ai/agents`,
    agent,
  );
  return data.data ?? (data as Agent);
}

async function updateAgent(
  deploymentId: string,
  agentId: string,
  agent: UpdateAgentRequest,
): Promise<Agent> {
  const { data } = await apiClient.patch<{ data?: Agent } & Agent>(
    `/deployments/${deploymentId}/ai/agents/${agentId}`,
    agent,
  );
  return data.data ?? (data as Agent);
}

async function deleteAgent(
  deploymentId: string,
  agentId: string,
): Promise<void> {
  await apiClient.delete(`/deployments/${deploymentId}/ai/agents/${agentId}`);
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

// Extended agent type with attached features
export interface AgentWithFeatures extends Agent {
  tools: Array<{
    id: string;
    name: string;
    tool_type: string;
    description?: string;
  }>;
  knowledge_bases: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

async function fetchAgentDetails(
  deploymentId: string,
  agentId: string,
): Promise<AgentWithFeatures> {
  const { data } = await apiClient.get<AgentWithFeatures>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/details`,
  );
  return data;
}

export function useAgentById(agentId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-details", selectedDeployment?.id, agentId],
    queryFn: () => fetchAgentDetails(selectedDeployment!.id, agentId),
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
    mutationFn: ({
      agentId,
      agent,
    }: {
      agentId: string;
      agent: UpdateAgentRequest;
    }) => updateAgent(selectedDeployment!.id, agentId, agent),
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

// Agent Token Generation
export interface GenerateAgentTokenRequest {
  subject: string;
  agent_name: string;
  validity_hours?: number;
}

export interface GenerateAgentTokenResponse {
  token: string;
}

async function generateAgentToken(
  deploymentId: string,
  request: GenerateAgentTokenRequest,
): Promise<GenerateAgentTokenResponse> {
  const { data } = await apiClient.post<GenerateAgentTokenResponse>(
    `/deployments/${deploymentId}/token/agent`,
    request,
  );
  console.log(data);
  return data;
}

export function useGenerateAgentToken() {
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (request: GenerateAgentTokenRequest) =>
      generateAgentToken(selectedDeployment!.id, request),
  });
}
