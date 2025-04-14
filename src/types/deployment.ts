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

export type FirstFactorPolicy = "none" | "optional" | "enforced";

export interface IndividualAuthSettings {
	enabled: boolean;
	required?: boolean;
}

export interface EmailSettings {
	enabled: boolean;
	required: boolean;
	verify_signup?: boolean;
	otp_verification_allowed?: boolean;
	magic_link_verification_allowed?: boolean;
}

export interface PhoneSettings {
	enabled: boolean;
	required: boolean;
	verify_signup?: boolean;
	sms_verification_allowed?: boolean;
	whatsapp_verification_allowed?: boolean;
}

export interface UsernameSettings {
	enabled: boolean;
	required: boolean;
	min_length?: number;
	max_length?: number;
}

export interface PasswordSettings {
	enabled: boolean;
	min_length?: number;
	require_lowercase?: boolean;
	require_uppercase?: boolean;
	require_number?: boolean;
	require_special?: boolean;
}

export interface EmailLinkSettings {
	enabled: boolean;
	require_same_device: boolean;
}

export interface PasskeySettings {
	enabled: boolean;
	allow_autofill: boolean;
}

export interface AuthFactorsEnabled {
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

export interface VerificationPolicy {
	phone_number: boolean;
	email: boolean;
}

export interface DeploymentAuthSettings {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
	deployment_id: string;
	email_address: EmailSettings;
	phone_number: PhoneSettings;
	username: UsernameSettings;
	first_name: IndividualAuthSettings;
	last_name: IndividualAuthSettings;
	password: PasswordSettings;
	backup_code: IndividualAuthSettings;
	web3_wallet: IndividualAuthSettings;
	magic_link?: EmailLinkSettings;
	passkey?: PasskeySettings;
	auth_factors_enabled: AuthFactorsEnabled;
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

export interface DeploymentRestrictions {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
	deployment_id: string;
	allowlist_enabled: boolean;
	blocklist_enabled: boolean;
	block_subaddresses: boolean;
	block_disposable_emails: boolean;
	block_voip_numbers: boolean;
	country_restrictions: CountryRestrictions;
	banned_keywords: string[];
	allowlisted_resources: string[];
	blocklisted_resources: string[];
	sign_up_mode: DeploymentRestrictionsSignUpMode;
}

export interface CountryRestrictions {
	enabled: boolean;
	country_codes: string[];
}

export enum DeploymentRestrictionsSignUpMode {
	Public = "public",
	Restricted = "restricted",
	Waitlist = "waitlist",
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
	restrictions?: DeploymentRestrictions;
}

export interface Deployment {
	id: string;
	mode: DeploymentMode;
	name: string;
}

export enum SocialConnectionProvider {
	XOauth = "x_oauth",
	GithubOauth = "github_oauth",
	GitlabOauth = "gitlab_oauth",
	GoogleOauth = "google_oauth",
	FacebookOauth = "facebook_oauth",
	MicrosoftOauth = "microsoft_oauth",
	LinkedinOauth = "linkedin_oauth",
	DiscordOauth = "discord_oauth",
	AppleOauth = "apple_oauth",
}

export interface DeploymentSocialConnection {
	id: string;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	deployment_id?: number;
	provider?: SocialConnectionProvider;
	enabled?: boolean;
	credentials?: OauthCredentials | null;
}

export interface OauthCredentials {
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	scopes: string[];
}

export interface DeploymentSocialConnectionUpsert {
	provider: SocialConnectionProvider;
	enabled: boolean;
	credentials?: OauthCredentials | null;
}