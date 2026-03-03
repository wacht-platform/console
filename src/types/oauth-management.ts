export interface OAuthScopeDefinition {
  scope: string;
  display_name: string;
  description: string;
  archived: boolean;
  category: "" | "personal" | "organization" | "workspace";
  organization_permission?: string;
  workspace_permission?: string;
}

export interface OAuthApp {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  fqdn: string;
  supported_scopes: string[];
  scope_definitions: OAuthScopeDefinition[];
  allow_dynamic_client_registration: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OAuthDomainVerificationResponse {
  domain: string;
  cname_target: string;
  verified: boolean;
}

export interface CreateOAuthAppRequest {
  slug: string;
  name: string;
  description?: string;
  fqdn?: string;
  logo_file?: File;
  supported_scopes?: string[];
  scope_definitions?: OAuthScopeDefinition[];
  allow_dynamic_client_registration?: boolean;
}

export interface UpdateOAuthAppRequest {
  name?: string;
  description?: string;
  supported_scopes?: string[];
  scope_definitions?: OAuthScopeDefinition[];
  allow_dynamic_client_registration?: boolean;
  is_active?: boolean;
}

export interface UpdateOAuthScopeRequest {
  display_name?: string;
  description?: string;
}

export interface SetOAuthScopeMappingRequest {
  category: "personal" | "organization" | "workspace";
  organization_permission?: string;
  workspace_permission?: string;
}

export interface OAuthClient {
  id: string;
  oauth_app_id: string;
  client_id: string;
  client_auth_method: string;
  grant_types: string[];
  redirect_uris: string[];
  token_endpoint_auth_signing_alg?: string;
  jwks_uri?: string;
  jwks?: JwksDocument;
  public_key_pem?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  client_secret?: string;
}

export interface Jwk {
  kty: string;
  kid?: string;
  use?: string;
  key_ops?: string[];
  alg?: string;
  n?: string;
  e?: string;
  crv?: string;
  x?: string;
  y?: string;
  x5u?: string;
  x5c?: string[];
  x5t?: string;
  "x5t#S256"?: string;
}

export interface JwksDocument {
  keys: Jwk[];
}

export interface CreateOAuthClientRequest {
  client_auth_method: string;
  grant_types: string[];
  redirect_uris: string[];
  token_endpoint_auth_signing_alg?: string;
  jwks_uri?: string;
  jwks?: JwksDocument;
  public_key_pem?: string;
}

export interface UpdateOAuthClientRequest {
  client_auth_method?: string;
  grant_types?: string[];
  redirect_uris?: string[];
  token_endpoint_auth_signing_alg?: string;
  jwks_uri?: string;
  jwks?: JwksDocument;
  public_key_pem?: string;
}

export interface RotateOAuthClientSecretResponse {
  client_secret: string;
}

export interface OAuthGrant {
  id: string;
  api_auth_app_slug: string;
  oauth_client_id: string;
  resource: string;
  scopes: string[];
  status: string;
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  granted_by_user_id?: string;
  created_at: string;
  updated_at: string;
}
