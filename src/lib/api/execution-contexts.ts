import { apiClient } from "./client";

export interface ExecutionContext {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'waiting_for_input' | 'interrupted' | 'completed' | 'failed';
  last_activity_at: string;
  context_group?: string;
  created_at: string;
  updated_at: string;
  deployment_id: string;
  tasks: string[];
  execution_state?: any;
}

export interface CreateContextRequest {
  title: string;
  context_group?: string;
}

export interface ListContextsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  context_group?: string;
}

export interface ListContextsResponse {
  data: ExecutionContext[];
  has_more: boolean;
}

export const executionContextsAPI = {
  // List execution contexts with pagination and filtering
  async listContexts(options?: ListContextsOptions): Promise<ListContextsResponse> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.context_group) params.append('context_group', options.context_group);

    const queryString = params.toString();
    const url = `/api/ai-execution-context${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Create a new execution context
  async createContext(request: CreateContextRequest): Promise<ExecutionContext> {
    const response = await apiClient.post('/api/ai-execution-context', request);
    return response.data;
  },

  // Get a specific context by ID
  async getContext(id: string): Promise<ExecutionContext> {
    const response = await apiClient.get(`/api/ai-execution-context/${id}`);
    return response.data;
  },

  // Delete a context
  async deleteContext(id: string): Promise<void> {
    await apiClient.delete(`/api/ai-execution-context/${id}`);
  }
};