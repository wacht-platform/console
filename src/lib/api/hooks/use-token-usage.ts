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
  tz: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["token-usage", deploymentId, from, to, granularity, tz],
    queryFn: async (): Promise<TokenUsageResponse> => {
      const response = await apiClient.get(
        `/deployments/${deploymentId}/analytics/token-usage`,
        { params: { from, to, granularity, tz } },
      );
      return response.data;
    },
    enabled,
  });
};

export interface TokenUsageByModel {
  model: string;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
}

export interface TokenUsageByModelResponse {
  models: TokenUsageByModel[];
}

export const useTokenUsageByModel = (
  deploymentId: string,
  from: string,
  to: string,
  enabled = true,
) =>
  useQuery({
    queryKey: ["token-usage-by-model", deploymentId, from, to],
    queryFn: async (): Promise<TokenUsageByModelResponse> => {
      const response = await apiClient.get(
        `/deployments/${deploymentId}/analytics/token-usage-by-model`,
        { params: { from, to } },
      );
      return response.data;
    },
    enabled,
  });
