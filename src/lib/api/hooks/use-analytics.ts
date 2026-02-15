import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface AnalyticsStatsResponse {
  unique_signins: number;
  signups: number;
  organizations_created: number;
  workspaces_created: number;
  total_signups: number;
  unique_signins_change?: number;
  signups_change?: number;
  organizations_created_change?: number;
  workspaces_created_change?: number;
  recent_signups: RecentSignup[];
  recent_signins: RecentSignup[];
}

export interface RecentSignup {
  name?: string | null;
  email?: string | null;
  method?: string | null;
  date: string;
}

export const useAnalyticsStats = (
  deploymentId: string,
  from: string,
  to: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["analytics", deploymentId, from, to],
    queryFn: async (): Promise<AnalyticsStatsResponse> => {
      const response = await apiClient.get(
        `/deployments/${deploymentId}/analytics`,
        {
          params: { from, to },
        },
      );
      return response.data;
    },
    enabled,
  });
};
