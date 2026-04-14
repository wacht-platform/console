import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";

export type SkillScope = "system" | "agent";

export interface SkillTreeEntry {
  name: string;
  path: string;
  kind: "file" | "directory";
  size_bytes?: number | null;
}

export interface SkillTreeResponse {
  scope: SkillScope;
  path: string;
  entries: SkillTreeEntry[];
}

export interface SkillFileResponse {
  scope: SkillScope;
  path: string;
  is_text: boolean;
  size_bytes: number;
  content?: string | null;
  content_base64?: string | null;
}

async function fetchSkillTree(
  deploymentId: string,
  agentId: string,
  scope: SkillScope,
  path: string,
): Promise<SkillTreeResponse> {
  const { data } = await apiClient.get<SkillTreeResponse>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/skills/tree`,
    { params: { scope, path } },
  );
  return data;
}

async function fetchSkillFile(
  deploymentId: string,
  agentId: string,
  scope: SkillScope,
  path: string,
): Promise<SkillFileResponse> {
  const { data } = await apiClient.get<SkillFileResponse>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/skills/file`,
    { params: { scope, path } },
  );
  return data;
}

async function importSkillBundle(
  deploymentId: string,
  agentId: string,
  formData: FormData,
): Promise<SkillTreeResponse> {
  const { data } = await apiClient.post<SkillTreeResponse>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/skills`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
}

async function deleteAgentSkill(
  deploymentId: string,
  agentId: string,
  skillSlug: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/agents/${agentId}/skills/${encodeURIComponent(skillSlug)}`,
  );
}

export function useAgentSkillTree(agentId: string, scope: SkillScope, path: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-skill-tree", selectedDeployment?.id, agentId, scope, path],
    queryFn: () => fetchSkillTree(selectedDeployment!.id, agentId, scope, path),
    enabled: !!selectedDeployment?.id && !!agentId,
  });
}

export function useAgentSkillFile(agentId: string, scope: SkillScope, path: string, enabled = true) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-skill-file", selectedDeployment?.id, agentId, scope, path],
    queryFn: () => fetchSkillFile(selectedDeployment!.id, agentId, scope, path),
    enabled: !!selectedDeployment?.id && !!agentId && !!path && enabled,
  });
}

export function useImportAgentSkillBundle(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      importSkillBundle(selectedDeployment!.id, agentId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-skill-tree", selectedDeployment?.id, agentId],
      });
      toast.success("Skill bundle imported");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to import skill bundle");
    },
  });
}

export function useDeleteAgentSkill(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (skillSlug: string) =>
      deleteAgentSkill(selectedDeployment!.id, agentId, skillSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-skill-tree", selectedDeployment?.id, agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-skill-file", selectedDeployment?.id, agentId],
      });
      toast.success("Skill deleted");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete skill");
    },
  });
}
