import { apiClient } from "./client";

// Types
export interface WebhookApp {
  id: string;
  deployment_id: string;
  name: string;
  signing_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookAppEvent {
  id: string;
  app_id: string;
  event_name: string;
  description?: string;
  schema?: any;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  app_id: string;
  url: string;
  description?: string;
  headers?: Record<string, string>;
  is_active: boolean;
  max_retries: number;
  timeout_seconds: number;
  ip_allowlist?: string[];
  created_at: string;
  updated_at: string;
  last_failure_at?: string;
  consecutive_failures?: number;
  subscriptions?: WebhookSubscription[];
}

export interface WebhookSubscription {
  endpoint_id: string;
  event_id: string;
  event_name?: string;
  filter_rules?: any;
  created_at: string;
}

export interface WebhookDelivery {
  delivery_id: string;
  app_id: string;
  app_name: string;
  endpoint_id: number;
  endpoint_url: string;
  event_name: string;
  status: "pending" | "success" | "failed" | "retrying" | "filtered";
  http_status_code?: number;
  response_time_ms?: number;
  attempt_number: number;
  max_attempts: number;
  error_message?: string;
  filtered_reason?: string;
  next_retry_at?: string;
  timestamp: string;
}

export interface WebhookDeliveryDetails extends WebhookDelivery {
  payload?: any;
  response_body?: string;
  response_headers?: string;
}

export interface WebhookStats {
  total_deliveries: number;
  success_rate: number;
  active_endpoints: number;
  failed_deliveries_24h: number;
  total_events: number;
  avg_response_time_ms: number;
}

export interface WebhookStatus {
  is_activated: boolean;
  app: WebhookApp | null;
  stats: WebhookStats | null;
}

export interface WebhookAnalytics {
  total_events: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  filtered_deliveries: number;
  avg_response_time_ms: number;
  p50_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  success_rate: number;
  top_events: Array<{
    event_name: string;
    count: number;
  }>;
  endpoint_performance: Array<{
    endpoint_id: number;
    endpoint_url: string;
    total_attempts: number;
    successful_attempts: number;
    failed_attempts: number;
    avg_response_time_ms: number;
    success_rate: number;
  }>;
  failure_reasons: Array<{
    reason: string;
    count: number;
  }>;
}

export interface TimeseriesData {
  data: Array<{
    timestamp: string;
    total_events: number;
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    filtered_deliveries: number;
    avg_response_time_ms: number;
    success_rate?: number;
  }>;
  interval: string;
}

export interface CreateEndpointRequest {
  url: string;
  description?: string;
  headers?: Record<string, string>;
  max_retries?: number;
  timeout_seconds?: number;
  ip_allowlist?: string[];
  subscriptions: Array<{
    event_name: string;
    filter_rules?: any;
  }>;
}

export interface UpdateEndpointRequest {
  url?: string;
  description?: string;
  headers?: Record<string, string>;
  is_active?: boolean;
  max_retries?: number;
  timeout_seconds?: number;
  ip_allowlist?: string[];
  subscriptions?: Array<{
    event_name: string;
    filter_rules?: any;
  }>;
}

export interface TestWebhookRequest {
  event_name: string;
  payload?: any;
}

// API functions
export const webhookApi = {
  // Status and activation
  async getStatus(deploymentId: string): Promise<WebhookStatus> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/status`);
    return response.data;
  },

  async activate(deploymentId: string): Promise<WebhookApp> {
    const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/activate`);
    return response.data;
  },

  async deactivate(deploymentId: string): Promise<void> {
    await apiClient.post(`/deployments/${deploymentId}/webhooks/deactivate`);
  },

  // Get webhook app details (there's only one per deployment)
  async getApp(deploymentId: string): Promise<WebhookApp | null> {
    const status = await this.getStatus(deploymentId);
    return status.app;
  },

  // Get available events for the webhook app  
  async getAvailableEvents(deploymentId: string): Promise<WebhookAppEvent[]> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/events`);
    return response.data.events || [];
  },

  // Secret rotation
  async rotateSecret(deploymentId: string): Promise<WebhookApp> {
    const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/rotate-secret`);
    return response.data;
  },

  // Endpoint management
  async getEndpoints(deploymentId: string, params?: {
    limit?: number;
    offset?: number;
    include_inactive?: boolean;
  }): Promise<{ endpoints: WebhookEndpoint[], has_more: boolean, limit?: number, offset?: number }> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/endpoints`, { params });
    // Handle paginated response structure
    return {
      endpoints: response.data.data || [],
      has_more: response.data.has_more || false,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  async getEndpoint(deploymentId: string, endpointId: string): Promise<WebhookEndpoint> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}`);
    return response.data;
  },

  async createEndpoint(deploymentId: string, data: CreateEndpointRequest): Promise<WebhookEndpoint> {
    const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/endpoints`, data);
    return response.data;
  },

  async updateEndpoint(deploymentId: string, endpointId: string, data: UpdateEndpointRequest): Promise<WebhookEndpoint> {
    const response = await apiClient.patch(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}`, data);
    return response.data;
  },

  async deleteEndpoint(deploymentId: string, endpointId: string): Promise<void> {
    await apiClient.delete(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}`);
  },

  async reactivateEndpoint(deploymentId: string, endpointId: string): Promise<void> {
    const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}/reactivate`);
    return response.data;
  },

  async testEndpoint(deploymentId: string, endpointId: string, data: TestWebhookRequest): Promise<void> {
    const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/endpoints/${endpointId}/test`, data);
    return response.data;
  },

  // Deliveries
  async getDeliveries(deploymentId: string, params?: {
    endpoint_id?: string;
    event_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ deliveries: WebhookDelivery[], has_more: boolean, limit?: number, offset?: number }> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/deliveries`, { params });
    // Handle paginated response structure
    return {
      deliveries: response.data.data || [],
      has_more: response.data.has_more || false,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  async getDeliveryDetails(deploymentId: string, deliveryId: string, status?: string): Promise<WebhookDeliveryDetails> {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/deliveries/${deliveryId}`, { params });
    return response.data;
  },

  async retryDelivery(deploymentId: string, deliveryId: string): Promise<void> {
    // Use replay endpoint to retry a single delivery
    // include_successful: true allows retrying any delivery (not just failed ones)
    const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/deliveries/replay`, {
      delivery_ids: [deliveryId],
      include_successful: true
    });
    return response.data;
  },

  // Analytics
  async getAnalytics(deploymentId: string, params: {
    start_date: string;
    end_date: string;
    endpoint_id?: string;
    event_name?: string;
  }): Promise<WebhookAnalytics> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/analytics`, { params });
    return response.data;
  },

  async getTimeseries(deploymentId: string, params: {
    start_date: string;
    end_date: string;
    interval: "minute" | "hour" | "day";
    endpoint_id?: string;
    event_name?: string;
  }): Promise<TimeseriesData> {
    const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/analytics/timeseries`, { params });
    return response.data;
  },
};