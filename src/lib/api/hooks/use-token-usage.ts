import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";

export interface TokenUsageBucket {
  bucket: string;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
}

export interface TokenUsageResponse {
  buckets: TokenUsageBucket[];
}

export const useTokenUsage = (
  deploymentId: string,
  from: string,
  to: string,
  granularity: "minute" | "hour" | "day",
  enabled = true,
) => {
  return useQuery({
    queryKey: ["token-usage", deploymentId, from, to, granularity],
    queryFn: async (): Promise<TokenUsageResponse> => {
      const response = await apiClient.get(
        `/deployments/${deploymentId}/analytics/token-usage`,
        { params: { from, to, granularity } },
      );
      return response.data;
    },
    enabled,
  });
};
