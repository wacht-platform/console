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

export const useApiAuthApps = () => {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id;
  return useQuery({
    queryKey: ["api-auth-apps", deploymentId],
    queryFn: async (): Promise<ApiAuthAppSummary[]> => {
      const { data } = await apiClient.get<{ apps: ApiAuthAppSummary[] }>(
        `/deployments/${deploymentId}/api-auth/apps`,
      );
      return data.apps ?? [];
    },
    enabled: !!deploymentId,
  });
};

export const useWebhookApps = () => {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id;
  return useQuery({
    queryKey: ["webhook-apps", deploymentId],
    queryFn: async (): Promise<WebhookAppSummary[]> => {
      const { data } = await apiClient.get<PaginatedResponse<WebhookAppSummary>>(
        `/deployments/${deploymentId}/webhooks/apps`,
      );
      return data.data ?? [];
    },
    enabled: !!deploymentId,
  });
};
