import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type {
  ComposioAuthConfigListResponse,
  ComposioConfig,
  ComposioToolkitListResponse,
  EnableComposioAppRequest,
  UpdateComposioConfigRequest,
} from "@/types/composio";

async function fetchComposioConfig(deploymentId: string): Promise<ComposioConfig> {
  const { data } = await apiClient.get<{ data?: ComposioConfig } & ComposioConfig>(
    `/deployments/${deploymentId}/ai/composio/config`,
  );
  return data.data ?? (data as ComposioConfig);
}

async function updateComposioConfig(
  deploymentId: string,
  payload: UpdateComposioConfigRequest,
): Promise<ComposioConfig> {
  const { data } = await apiClient.patch<{ data?: ComposioConfig } & ComposioConfig>(
    `/deployments/${deploymentId}/ai/composio/config`,
    payload,
  );
  return data.data ?? (data as ComposioConfig);
}

interface ListToolkitsParams {
  search?: string;
  category?: string;
  cursor?: string;
}

async function fetchComposioToolkits(
  deploymentId: string,
  params: ListToolkitsParams = {},
): Promise<ComposioToolkitListResponse> {
  const { data } = await apiClient.get<ComposioToolkitListResponse>(
    `/deployments/${deploymentId}/ai/composio/toolkits`,
    { params },
  );
  return data;
}

export function useComposioConfig() {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["composio-config", selectedDeployment?.id],
    queryFn: () => fetchComposioConfig(selectedDeployment!.id),
    enabled: !!selectedDeployment?.id,
  });
}

export function useUpdateComposioConfig() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateComposioConfigRequest) =>
      updateComposioConfig(selectedDeployment!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["composio-config", selectedDeployment!.id],
      });
      toast.success("Composio settings saved");
    },
    onError: () => {
      toast.error("Failed to save Composio settings");
    },
  });
}

async function enableComposioApp(
  deploymentId: string,
  payload: EnableComposioAppRequest,
): Promise<ComposioConfig> {
  const { data } = await apiClient.post<{ data?: ComposioConfig } & ComposioConfig>(
    `/deployments/${deploymentId}/ai/composio/apps`,
    payload,
  );
  return data.data ?? (data as ComposioConfig);
}

async function disableComposioApp(
  deploymentId: string,
  slug: string,
): Promise<ComposioConfig> {
  const { data } = await apiClient.delete<{ data?: ComposioConfig } & ComposioConfig>(
    `/deployments/${deploymentId}/ai/composio/apps/${encodeURIComponent(slug)}`,
  );
  return data.data ?? (data as ComposioConfig);
}

export function useEnableComposioApp() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EnableComposioAppRequest) =>
      enableComposioApp(selectedDeployment!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["composio-config", selectedDeployment!.id],
      });
      toast.success("App enabled");
    },
    onError: () => {
      toast.error("Failed to enable app");
    },
  });
}

export function useDisableComposioApp() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => disableComposioApp(selectedDeployment!.id, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["composio-config", selectedDeployment!.id],
      });
      toast.success("App disabled");
    },
    onError: () => {
      toast.error("Failed to disable app");
    },
  });
}

export function useComposioToolkits(params: ListToolkitsParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["composio-toolkits", selectedDeployment?.id, params],
    queryFn: () => fetchComposioToolkits(selectedDeployment!.id, params),
    enabled: !!selectedDeployment?.id,
  });
}

async function fetchToolkitAuthConfigs(
  deploymentId: string,
  slug: string,
): Promise<ComposioAuthConfigListResponse> {
  const { data } = await apiClient.get<ComposioAuthConfigListResponse>(
    `/deployments/${deploymentId}/ai/composio/toolkits/${encodeURIComponent(slug)}/auth-configs`,
  );
  return data;
}

export function useComposioToolkitAuthConfigs(slug: string | null, enabled: boolean) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["composio-toolkit-auth-configs", selectedDeployment?.id, slug],
    queryFn: () => fetchToolkitAuthConfigs(selectedDeployment!.id, slug!),
    enabled: !!selectedDeployment?.id && !!slug && enabled,
  });
}
