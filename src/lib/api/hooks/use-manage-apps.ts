import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { PaginatedResponse } from "@/types/api";

export interface ApiAuthAppSummary {
  app_slug: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  key_prefix?: string;
}

export interface WebhookAppSummary {
  app_slug: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  event_catalog_slug?: string | null;
}

export interface ActorSummary {
  id: string;
  subject_type: string;
  external_key: string;
  display_name?: string | null;
  archived_at?: string | null;
}

export interface ManageAppListParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ManageAppListResult<T> {
  apps: T[];
  hasMore: boolean;
  isLoading: boolean;
}

const buildParams = ({ page, limit, search }: ManageAppListParams) => {
  const offset = Math.max(0, (page - 1) * limit);
  const params: Record<string, string | number> = { limit, offset };
  const term = search?.trim();
  if (term) params.search = term;
  return params;
};

export const useApiAuthApps = (
  args: ManageAppListParams,
): ManageAppListResult<ApiAuthAppSummary> => {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id;
  const params = buildParams(args);
  const query = useQuery({
    queryKey: ["api-auth-apps", deploymentId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ApiAuthAppSummary>>(
        `/deployments/${deploymentId}/api-auth/apps`,
        { params },
      );
      return data;
    },
    enabled: !!deploymentId,
  });
  return {
    apps: query.data?.data ?? [],
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
  };
};

export const useWebhookApps = (
  args: ManageAppListParams,
): ManageAppListResult<WebhookAppSummary> => {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id;
  const params = buildParams(args);
  const query = useQuery({
    queryKey: ["webhook-apps", deploymentId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<WebhookAppSummary>>(
        `/deployments/${deploymentId}/webhooks/apps`,
        { params },
      );
      return data;
    },
    enabled: !!deploymentId,
  });
  return {
    apps: query.data?.data ?? [],
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
  };
};

export const useActors = (
  args: ManageAppListParams,
): ManageAppListResult<ActorSummary> => {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id;
  const params = buildParams(args);
  const query = useQuery({
    queryKey: ["agent-actors", deploymentId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<ActorSummary>>(
        `/deployments/${deploymentId}/ai/actors`,
        { params },
      );
      return data;
    },
    enabled: !!deploymentId,
  });
  return {
    apps: query.data?.data ?? [],
    hasMore: query.data?.has_more ?? false,
    isLoading: query.isLoading,
  };
};
