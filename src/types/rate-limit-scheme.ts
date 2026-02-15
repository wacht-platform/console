export type RateLimitUnit =
  | "millisecond"
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "calendar_day"
  | "month"
  | "calendar_month";

export type RateLimitMode =
  | "per_key"
  | "per_ip"
  | "per_key_and_ip"
  | "per_app"
  | "per_app_and_ip";

export interface RateLimitRule {
  unit: RateLimitUnit;
  duration: number;
  max_requests: number;
  mode?: RateLimitMode;
  endpoints?: string[];
  priority?: number;
}

export interface RateLimitScheme {
  deployment_id: string;
  slug: string;
  name: string;
  description?: string;
  rules: RateLimitRule[];
  created_at: string;
  updated_at: string;
}

export interface CreateRateLimitSchemeRequest {
  slug: string;
  name: string;
  description?: string;
  rules: RateLimitRule[];
}
