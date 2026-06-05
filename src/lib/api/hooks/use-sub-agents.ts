import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { PaginatedResponse } from "@/types/api";
import type { Agent } from "./use-agents";

async function fetchAgentSubAgents(
  deploymentId: string,
  agentId: string,
): Promise<PaginatedResponse<Agent>> {
  const { data } = await apiClient.get<PaginatedResponse<Agent>>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/sub-agents`,
  );
  return data;
}

async function attachSubAgent(
  deploymentId: string,
  agentId: string,
  subAgentId: string,
): Promise<void> {
  await apiClient.post(
    `/deployments/${deploymentId}/ai/agents/${agentId}/sub-agents/${subAgentId}`,
  );
}

async function detachSubAgent(
  deploymentId: string,
  agentId: string,
  subAgentId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/agents/${agentId}/sub-agents/${subAgentId}`,
  );
}

export type AgentRole = "reviewer" | "conversation";

async function setAgentRoleAgent(
  deploymentId: string,
  agentId: string,
  role: AgentRole,
  targetAgentId: string | null,
): Promise<void> {
  await apiClient.put(
    `/deployments/${deploymentId}/ai/agents/${agentId}/role-agent`,
    { role, agent_id: targetAgentId },
  );
}

export function useAgentSubAgents(agentId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-sub-agents", selectedDeployment?.id, agentId],
    queryFn: async () => {
      const response = await fetchAgentSubAgents(selectedDeployment!.id, agentId);
      return response.data;
    },
    enabled: !!selectedDeployment?.id && !!agentId,
  });
}

export function useAttachSubAgent() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      subAgentId,
    }: {
      agentId: string;
      subAgentId: string;
    }) => attachSubAgent(selectedDeployment!.id, agentId, subAgentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["agent-sub-agents", selectedDeployment?.id, variables.agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, variables.agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agents", selectedDeployment?.id],
      });
    },
  });
}

export function useDetachSubAgent() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      subAgentId,
    }: {
      agentId: string;
      subAgentId: string;
    }) => detachSubAgent(selectedDeployment!.id, agentId, subAgentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["agent-sub-agents", selectedDeployment?.id, variables.agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, variables.agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agents", selectedDeployment?.id],
      });
    },
  });
}

export function useSetAgentRoleAgent() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      agentId,
      role,
      targetAgentId,
    }: {
      agentId: string;
      role: AgentRole;
      targetAgentId: string | null;
    }) => setAgentRoleAgent(selectedDeployment!.id, agentId, role, targetAgentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, variables.agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-sub-agents", selectedDeployment?.id, variables.agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agents", selectedDeployment?.id],
      });
    },
  });
}
