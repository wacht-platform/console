import type {
  Deployment,
  IndividualAuthSettings,
  MultiSessionSupport,
  SecondFactorPolicy,
} from "./deployment";

export type ProjectWithDeployments = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  image_url: string;
  deployments: Deployment[];
};

interface NameSettings {
  first_name_enabled: boolean;
  first_name_required: boolean;
  last_name_enabled: boolean;
  last_name_required: boolean;
}

export interface AuthenticationFactorSettings {
  sso_enabled?: boolean;
  web3_wallet_enabled?: boolean;
  magic_link?: {
    enabled: boolean;
    require_same_device: boolean;
  };
  email_otp_enabled?: boolean;
  phone_otp_enabled?: boolean;
  passkey?: {
    enabled: boolean;
    allow_autofill: boolean;
  };
  second_factor_phone_otp_enabled?: boolean;
  second_factor_authenticator_enabled?: boolean;
  second_factor_backup_code_enabled?: boolean;
}

export interface DeploymentAuthSettingsUpdates {
  email?: {
    enabled: boolean;
    required: boolean;
    verify_signup?: boolean;
    otp_verification_allowed?: boolean;
    magic_link_verification_allowed?: boolean;
  };
  phone?: {
    enabled: boolean;
    required: boolean;
    verify_signup?: boolean;
    sms_verification_allowed?: boolean;
    whatsapp_verification_allowed?: boolean;
  };
  username?: {
    enabled: boolean;
    required: boolean;
    min_length?: number;
    max_length?: number;
  };
  backup_code?: IndividualAuthSettings;
  web3_wallet?: IndividualAuthSettings;
  password?: {
    enabled: boolean;
    min_length?: number;
    require_lowercase?: boolean;
    require_uppercase?: boolean;
    require_number?: boolean;
    require_special?: boolean;
  };
  name?: NameSettings;
  authentication_factors?: AuthenticationFactorSettings;
  second_factor_policy?: SecondFactorPolicy;
  multi_session_support?: MultiSessionSupport;
  session_token_lifetime?: number;
  session_validity_period?: number;
  session_inactive_timeout?: number;
  restrictions?: {
    blocked_country_codes: string[];
    banned_keywords: string[];
    email_allowlist: string[];
    email_blocklist: string[];
    block_voip_numbers: boolean;
    restrict_signup: boolean;
    block_temporary_emails: boolean;
    block_special_characters_in_email: boolean;
  };
  social_connections?: Array<{
    provider?: string;
    id?: string;
    client_id: string;
    client_secret: string;
    enabled?: boolean;
  }>;
  session?: {
    max_session_age?: number;
    inactivity_timeout?: number;
    allow_multi_account_session?: boolean;
    default_jwt_template?: string;
  };
}
