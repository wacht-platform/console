import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

export type AiProvider = "openai";

export interface AiProviderProfile {
  id: string;
  deployment_id: string;
  provider: AiProvider;
  name: string;
  slug: string;
  api_key_set: boolean;
  base_url?: string | null;
  organization?: string | null;
  project?: string | null;
  default_model?: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAiProviderProfileRequest {
  provider: AiProvider;
  name: string;
  slug: string;
  api_key: string;
  base_url?: string;
  organization?: string;
  project?: string;
  default_model?: string;
  enabled?: boolean;
}

export interface UpdateAiProviderProfileRequest {
  name?: string;
  slug?: string;
  api_key?: string;
  base_url?: string;
  organization?: string;
  project?: string;
  default_model?: string;
  enabled?: boolean;
}

function unwrapProfile(data: { data?: AiProviderProfile } & AiProviderProfile) {
  return data.data ?? (data as AiProviderProfile);
}

async function listAiProviderProfiles(
  deploymentId: string,
): Promise<AiProviderProfile[]> {
  const { data } = await apiClient.get<
    { data?: AiProviderProfile[] } | AiProviderProfile[]
  >(`/deployments/${deploymentId}/ai/settings/provider-profiles`);
  return Array.isArray(data) ? data : data.data ?? [];
}

async function createAiProviderProfile(
  deploymentId: string,
  profile: CreateAiProviderProfileRequest,
): Promise<AiProviderProfile> {
  const { data } = await apiClient.post<
    { data?: AiProviderProfile } & AiProviderProfile
  >(`/deployments/${deploymentId}/ai/settings/provider-profiles`, profile);
  return unwrapProfile(data);
}

async function updateAiProviderProfile(
  deploymentId: string,
  profileId: string,
  profile: UpdateAiProviderProfileRequest,
): Promise<AiProviderProfile> {
  const { data } = await apiClient.patch<
    { data?: AiProviderProfile } & AiProviderProfile
  >(
    `/deployments/${deploymentId}/ai/settings/provider-profiles/${profileId}`,
    profile,
  );
  return unwrapProfile(data);
}

async function deleteAiProviderProfile(
  deploymentId: string,
  profileId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/settings/provider-profiles/${profileId}`,
  );
}

export function useAiProviderProfiles() {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["ai-provider-profiles", selectedDeployment?.id],
    queryFn: () => listAiProviderProfiles(selectedDeployment!.id),
    enabled: !!selectedDeployment?.id,
  });
}

export function useCreateAiProviderProfile() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: CreateAiProviderProfileRequest) =>
      createAiProviderProfile(selectedDeployment!.id, profile),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-provider-profiles", selectedDeployment!.id],
      });
    },
  });
}

export function useUpdateAiProviderProfile() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      profile,
    }: {
      profileId: string;
      profile: UpdateAiProviderProfileRequest;
    }) => updateAiProviderProfile(selectedDeployment!.id, profileId, profile),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-provider-profiles", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({ queryKey: ["agent-details"] });
    },
  });
}

export function useDeleteAiProviderProfile() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) =>
      deleteAiProviderProfile(selectedDeployment!.id, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-provider-profiles", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({ queryKey: ["agent-details"] });
    },
  });
}
