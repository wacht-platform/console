export interface McpServer {
  id: string;
  created_at: string;
  updated_at: string;
  deployment_id: string;
  name: string;
  slug: string;
  config: McpServerConfig;
}

export interface McpAuthDiscoveryResult {
  requires_auth: boolean;
  recommended_auth_mode?:
    | "token"
    | "oauth_client_credentials"
    | "oauth_authorization_code_public_pkce"
    | "oauth_authorization_code_confidential_pkce";
  token_url?: string;
  auth_url?: string;
  register_url?: string;
  resource_metadata_url?: string;
  resource?: string;
  scopes: string[];
  token_endpoint_auth_methods_supported: string[];
  authorization_servers: string[];
  message: string;
}

export interface McpServerConfig {
  endpoint: string;
  auth?: McpAuthConfig;
  headers?: Record<string, string>;
}

export type McpAuthConfig =
  | McpTokenAuth
  | McpOAuthClientCredentialsAuth
  | McpOAuthAuthorizationCodePublicPkceAuth
  | McpOAuthAuthorizationCodeConfidentialPkceAuth;

export interface McpTokenAuth {
  type: "token";
  auth_token: string;
}

export interface McpOAuthClientCredentialsAuth {
  type: "oauth_client_credentials";
  client_id: string;
  client_secret: string;
  token_url?: string;
  scopes?: string[];
}

export interface McpOAuthAuthorizationCodePublicPkceAuth {
  type: "oauth_authorization_code_public_pkce";
  client_id?: string;
  auth_url?: string;
  token_url?: string;
  register_url?: string;
  scopes?: string[];
  resource?: string;
}

export interface McpOAuthAuthorizationCodeConfidentialPkceAuth {
  type: "oauth_authorization_code_confidential_pkce";
  client_id: string;
  client_secret: string;
  auth_url?: string;
  token_url?: string;
  scopes?: string[];
  resource?: string;
}

export interface CreateMcpServerRequest {
  name: string;
  config: McpServerConfig;
}

export interface UpdateMcpServerRequest {
  name?: string;
  config?: McpServerConfig;
}

export interface DiscoverMcpServerAuthRequest {
  endpoint: string;
}
