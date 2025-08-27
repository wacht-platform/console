import { apiClient } from "./client";
import type {
  ApiKeyApp,
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyRequest,
  RevokeApiKeyRequest,
} from "@/types/api-key";

export interface ApiKeyStatus {
  is_activated: boolean;
  app: ApiKeyApp | null;
  keys?: ApiKey[];
}

export interface ApiKeyStats {
  total_keys: number;
  active_keys: number;
  revoked_keys: number;
  keys_used_24h: number;
}

export const apiKeysApi = {
  // Status and activation (similar to webhooks pattern)
  async getStatus(deploymentId: string): Promise<ApiKeyStatus> {
    const response = await apiClient.get(
      `/deployments/${deploymentId}/api-keys/status`
    );
    return response.data;
  },

  async activate(deploymentId: string): Promise<ApiKeyApp> {
    const response = await apiClient.post(
      `/deployments/${deploymentId}/api-keys/activate`
    );
    return response.data;
  },

  async deactivate(deploymentId: string): Promise<void> {
    await apiClient.post(`/deployments/${deploymentId}/api-keys/deactivate`);
  },

  // Get API key app details (there's only one per deployment)
  async getApp(deploymentId: string): Promise<ApiKeyApp | null> {
    const status = await this.getStatus(deploymentId);
    return status.app;
  },

  // API Keys Management
  async getKeys(deploymentId: string): Promise<ApiKey[]> {
    const response = await apiClient.get(
      `/deployments/${deploymentId}/api-keys`
    );
    return response.data.keys || [];
  },

  async createKey(
    deploymentId: string,
    data: CreateApiKeyRequest
  ): Promise<ApiKeyWithSecret> {
    const response = await apiClient.post(
      `/deployments/${deploymentId}/api-keys`,
      data
    );
    return response.data;
  },

  async revokeKey(
    deploymentId: string,
    keyId: string,
    data?: RevokeApiKeyRequest
  ): Promise<void> {
    await apiClient.delete(
      `/deployments/${deploymentId}/api-keys/${keyId}`,
      { data }
    );
  },

  async rotateKey(
    deploymentId: string,
    keyId: string
  ): Promise<ApiKeyWithSecret> {
    const response = await apiClient.post(
      `/deployments/${deploymentId}/api-keys/${keyId}/rotate`
    );
    return response.data;
  },

  // Get statistics for API key usage
  async getStats(deploymentId: string): Promise<ApiKeyStats> {
    const response = await apiClient.get(
      `/deployments/${deploymentId}/api-keys/stats`
    );
    return response.data;
  },
};