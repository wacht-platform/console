export type RateLimitUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'calendar_day' | 'month' | 'calendar_month';
export type RateLimitMode = 'per_key' | 'per_ip' | 'per_key_and_ip';

export interface RateLimit {
  unit: RateLimitUnit;
  duration: number;
  max_requests: number;
  mode?: RateLimitMode;
}

export interface ApiKeyApp {
  id: string;
  deployment_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  rate_limits: RateLimit[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ApiKey {
  id: string;
  app_id: string;
  deployment_id: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
  permissions: string[];
  metadata: Record<string, any>;
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  revoked_at?: string;
  revoked_reason?: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  secret: string;
}

export interface ApiKeyScope {
  id: string;
  api_key_id: string;
  resource_type: string;
  resource_id?: string;
  actions: string[];
  created_at: string;
}

export interface CreateApiKeyAppRequest {
  name: string;
  description?: string;
  rate_limits?: RateLimit[];
}

export interface UpdateApiKeyAppRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  rate_limits?: RateLimit[];
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  expires_at?: string;
  // key_prefix will be automatically set based on deployment type (sk_live_ for production, sk_test_ for staging/development)
}

export interface RevokeApiKeyRequest {
  reason?: string;
}