import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type {
  ComposioAuthConfigListResponse,
  ComposioConfig,
  ComposioToolListResponse,
  ComposioToolkitDetailsResponse,
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

async function fetchComposioTools(
  deploymentId: string,
  toolkits?: string[],
): Promise<ComposioToolListResponse> {
  const params: Record<string, string> = {};
  if (toolkits && toolkits.length > 0) {
    params.toolkits = toolkits.join(",");
  }
  const { data } = await apiClient.get<ComposioToolListResponse>(
    `/deployments/${deploymentId}/ai/composio/tools`,
    { params },
  );
  return data;
}

/**
 * Fetches Composio tools for the picker. Gated on the deployment having
 * Composio enabled — we never hit the upstream tools API for deployments that
 * haven't turned the integration on, since the request would always come back
 * empty (or fail key resolution) and just burn quota.
 */
export function useComposioTools(options: { toolkits?: string[]; enabled?: boolean } = {}) {
  const { selectedDeployment } = useProjects();
  const { data: config } = useComposioConfig();
  const toolkits = options.toolkits;
  const callerEnabled = options.enabled ?? true;
  const composioOn = !!config?.enabled;

  return useQuery({
    queryKey: ["composio-tools", selectedDeployment?.id, toolkits ?? null],
    queryFn: () => fetchComposioTools(selectedDeployment!.id, toolkits),
    enabled: !!selectedDeployment?.id && callerEnabled && composioOn,
    staleTime: 5 * 60 * 1000,
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

async function fetchToolkitAuthDetails(
  deploymentId: string,
  slug: string,
): Promise<ComposioToolkitDetailsResponse> {
  const { data } = await apiClient.get<ComposioToolkitDetailsResponse>(
    `/deployments/${deploymentId}/ai/composio/toolkits/${encodeURIComponent(slug)}/auth-details`,
  );
  return data;
}

export function useComposioToolkitAuthDetails(slug: string | null) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["composio-toolkit-auth-details", selectedDeployment?.id, slug],
    queryFn: () => fetchToolkitAuthDetails(selectedDeployment!.id, slug!),
    enabled: !!selectedDeployment?.id && !!slug,
  });
}
