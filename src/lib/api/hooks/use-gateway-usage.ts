import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface GatewayUsageBucket {
  bucket: string;
  total_requests: number;
  allowed_requests: number;
  blocked_requests: number;
}

export interface GatewayUsageResponse {
  buckets: GatewayUsageBucket[];
}

export const useGatewayUsage = (
  deploymentId: string,
  from: string,
  to: string,
  granularity: "minute" | "hour" | "day",
  tz: string,
  enabled = true,
) =>
  useQuery({
    queryKey: ["gateway-usage", deploymentId, from, to, granularity, tz],
    queryFn: async (): Promise<GatewayUsageResponse> => {
      const response = await apiClient.get(
        `/deployments/${deploymentId}/analytics/gateway-usage`,
        { params: { from, to, granularity, tz } },
      );
      return response.data;
    },
    enabled,
  });
