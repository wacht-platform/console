import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface WebhookUsageBucket {
  bucket: string;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  filtered_deliveries: number;
  success_rate: number;
}

export interface WebhookUsageResponse {
  buckets: WebhookUsageBucket[];
}

export const useWebhookUsage = (
  deploymentId: string,
  from: string,
  to: string,
  granularity: "minute" | "hour" | "day",
  enabled = true,
) =>
  useQuery({
    queryKey: ["webhook-usage", deploymentId, from, to, granularity],
    queryFn: async (): Promise<WebhookUsageResponse> => {
      const response = await apiClient.get(
        `/deployments/${deploymentId}/analytics/webhook-usage`,
        { params: { from, to, granularity } },
      );
      return response.data;
    },
    enabled,
  });
