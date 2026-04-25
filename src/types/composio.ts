export interface ComposioEnabledApp {
  slug: string;
  auth_config_id: string;
  display_name?: string;
  logo_url?: string;
  auth_scheme?: string;
}

export interface ComposioConfig {
  enabled: boolean;
  use_platform_key: boolean;
  api_key_set: boolean;
  enabled_apps: ComposioEnabledApp[];
}

export interface UpdateComposioConfigRequest {
  enabled?: boolean;
  use_platform_key?: boolean;
  api_key?: string | null;
  enabled_apps?: ComposioEnabledApp[];
}

export interface ComposioToolkit {
  slug: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  categories: string[];
  auth_schemes: string[];
  tool_count: number;
}

export interface ComposioToolkitListResponse {
  toolkits: ComposioToolkit[];
  next_cursor?: string | null;
}

export type EnableComposioAppAuth =
  | {
      type: "managed";
      auth_scheme?: string;
      credentials?: Record<string, unknown>;
    }
  | {
      type: "custom";
      auth_scheme: string;
      credentials: Record<string, unknown>;
    }
  | {
      type: "use_existing";
      auth_config_id: string;
      auth_scheme?: string;
    };

export interface ComposioToolkitAuthField {
  name: string;
  display_name: string;
  type: string;
  description: string;
  required: boolean;
  default?: string | null;
}

export interface ComposioToolkitAuthFields {
  required: ComposioToolkitAuthField[];
  optional: ComposioToolkitAuthField[];
}

export interface ComposioToolkitAuthMode {
  mode: string;
  name: string;
  auth_config_creation: ComposioToolkitAuthFields;
  connected_account_initiation: ComposioToolkitAuthFields;
  auth_hint_url?: string | null;
}

export interface ComposioToolkitDetailsResponse {
  slug: string;
  name: string;
  logo?: string | null;
  composio_managed_auth_schemes: string[];
  auth_modes: ComposioToolkitAuthMode[];
}

export interface ComposioAuthConfigSummary {
  id: string;
  name: string;
  auth_scheme?: string | null;
  is_composio_managed: boolean;
  toolkit_slug: string;
}

export interface ComposioAuthConfigListResponse {
  auth_configs: ComposioAuthConfigSummary[];
}

export interface EnableComposioAppRequest {
  slug: string;
  display_name?: string;
  logo_url?: string;
  auth: EnableComposioAppAuth;
}
