export type DeploymentMode = "production" | "staging";

export type FirstFactor =
  | "email_password"
  | "username_password"
  | "email_otp"
  | "email_magic_link"
  | "phone_otp";

export type SecondFactor =
  | "none"
  | "phone_otp"
  | "backup_code"
  | "authenticator";

export type SecondFactorPolicy = "none" | "optional" | "enforced";

export interface IndividualAuthSettings {
  enabled: boolean;
  required: boolean;
  verify_signup: boolean;
  otp_verification_allowed: boolean;
  magic_link_verification_allowed: boolean;
  whatsapp_verification_allowed: boolean;
}

export interface AuthFactorsEnabled {
  email_password: boolean;
  username_password: boolean;
  email_otp: boolean;
  email_magic_link: boolean;
  phone_otp: boolean;
  web3_wallet: boolean;
  backup_code: boolean;
  authenticator: boolean;
}

export interface VerificationPolicy {
  phone_number: boolean;
  email: boolean;
}

export interface PasswordPolicy {
  enabled: boolean;
  min_length: boolean;
  require_lowercase: boolean;
  require_uppercase: boolean;
  require_number: boolean;
  require_special: boolean;
}

export interface UsernamePolicy {
  enabled: boolean;
  required: boolean;
  min_length: number;
  max_length: number;
}

export interface LastNamePolicy {
  enabled: boolean;
  required: boolean;
}

export interface FirstNamePolicy {
  enabled: boolean;
  required: boolean;
}

export interface AuthFactorsPolicy {
  sso: boolean;
  email_password: boolean;
  username_password: boolean;
  email_otp: boolean;
  email_magic_link: boolean;
  phone_otp: boolean;
  web3_wallet: boolean;
  backup_code: boolean;
  authenticator: boolean;
  passkey: boolean;
}


export interface DeploymentAuthSettings {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  deployment_id: string;
  email_address: IndividualAuthSettings;
  phone_number: IndividualAuthSettings;
  username: UsernamePolicy;
  first_name: FirstNamePolicy;
  last_name: LastNamePolicy;
  password: PasswordPolicy;
  backup_code: IndividualAuthSettings;
  web3_wallet: IndividualAuthSettings;
  password_policy: IndividualAuthSettings;
  auth_factors_enabled: AuthFactorsPolicy;
  verification_policy: VerificationPolicy;
  second_factor_policy?: SecondFactorPolicy;
  first_factor: FirstFactor;
  second_factor?: SecondFactor;
  alternate_first_factors?: FirstFactor[];
  alternate_second_factors?: SecondFactor[];
}

export interface ButtonConfig {
  background_color: string;
  text_color: string;
  border_radius: number;
}

export interface InputConfig {
  placeholder: string;
  text_color: string;
  border_color: string;
}

export interface DeploymentDisplaySettings {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  deployment_id: string;
  app_name: string;
  primary_color: string;
  tos_page_url: string;
  privacy_policy_url: string;
  signup_terms_statement: string;
  signup_terms_statement_shown: boolean;
  button_config: ButtonConfig;
  input_config: InputConfig;
}

export interface DeploymentOrgSettings {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  deployment_id: string;
  enabled: boolean;
  ip_allowlist_enabled: boolean;
  max_allowed_members: number;
  allow_deletion: boolean;
  custom_role_enabled: boolean;
  default_role: string;
}

export interface DeploymentWithSettings {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  maintenance_mode: boolean;
  host: string;
  publishable_key: string;
  secret: string;
  mode: DeploymentMode;
  auth_settings?: DeploymentAuthSettings;
  display_settings?: DeploymentDisplaySettings;
  org_settings?: DeploymentOrgSettings;
}

export interface Deployment {
  id: string;
  mode: DeploymentMode;
  name: string;
}
