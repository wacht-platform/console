export type DeploymentMode = "production" | "staging";

export type VerificationStatus = "pending" | "in_progress" | "verified" | "failed";

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

export interface MultiSessionSupport {
	enabled: boolean;
	max_accounts_per_session: number;
	max_sessions_per_account: number;
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
	multi_session_support: MultiSessionSupport;
	session_token_lifetime: number;
	session_validity_period: number;
	session_inactive_timeout: number;
}

export interface LightModeSettings {
	primary_color: string;
	background_color: string;
}

export interface DarkModeSettings {
	primary_color: string;
	background_color: string;
}

export interface DeploymentUISettings {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
	deployment_id: string;
	app_name: string;
	tos_page_url: string;
	sign_in_page_url: string;
	sign_up_page_url: string;
	after_sign_out_one_page_url: string;
	after_sign_out_all_page_url: string;
	favicon_image_url: string;
	logo_image_url: string;
	privacy_policy_url: string;
	signup_terms_statement: string;
	signup_terms_statement_shown: boolean;
	light_mode_settings: LightModeSettings;
	dark_mode_settings: DarkModeSettings;
	after_logo_click_url: string;
	organization_profile_url: string;
	create_organization_url: string;
	default_user_profile_image_url: string;
	default_organization_profile_image_url: string;
	use_initials_for_user_profile_image: boolean;
	use_initials_for_organization_profile_image: boolean;
	after_signup_redirect_url: string;
	after_signin_redirect_url: string;
	user_profile_url: string;
	after_create_organization_redirect_url: string;
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

export interface CustomSigningKey {
	key: string;
	algorithm: string;
	enabled: boolean;
}

export interface DeploymentJWTTemplate {
	id: string;
	name: string;
	token_lifetime: number;
	allowed_clock_skew: number;
	custom_signing_key: CustomSigningKey | null;
	template: Record<string, string>;
	deployment_id: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface DeploymentWorkspaceRole {
	id: string;
	name: string;
	permissions: string[];
}

export interface DeploymentOrganizationRole {
	id: string;
	name: string;
	permissions: string[];
}

export interface DeploymentB2bSettings {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	deleted_at: string | null;
	deployment_id: string;
	organizations_enabled: boolean;
	workspaces_enabled: boolean;
	ip_allowlist_per_workspace_enabled: boolean;
	ip_allowlist_per_org_enabled: boolean;
	max_allowed_org_members: number;
	max_allowed_workspace_members: number;
	allow_users_to_create_orgs: boolean;
	allow_org_deletion: boolean;
	allow_workspace_deletion: boolean;
	custom_org_role_enabled: boolean;
	custom_workspace_role_enabled: boolean;
	limit_org_creation_per_user: boolean;
	limit_workspace_creation_per_org: boolean;
	org_creation_per_user_count: number;
	workspaces_per_org_count: number;
	default_workspace_creator_role_id: string;
	default_workspace_member_role_id: string;
	default_org_creator_role_id: string;
	default_org_member_role_id: string;
	default_workspace_creator_role: DeploymentWorkspaceRole;
	default_workspace_member_role: DeploymentWorkspaceRole;
	default_org_creator_role: DeploymentOrganizationRole;
	default_org_member_role: DeploymentOrganizationRole;
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
	mail_from_host: string;
	auth_settings?: DeploymentAuthSettings;
	ui_settings?: DeploymentUISettings;
	org_settings?: DeploymentOrgSettings;
	restrictions?: DeploymentRestrictions;
	jwt_templates?: DeploymentJWTTemplate[];
	b2b_settings?: DeploymentB2bSettings;
}

export interface DnsRecord {
	name: string;
	record_type: string;
	value: string;
	ttl?: number;
	verified: boolean;
	verification_attempted_at?: string;
	last_verified_at?: string;
}

export interface DomainVerificationRecords {
	cloudflare_verification: DnsRecord[];
	custom_hostname_verification: DnsRecord[];
}

export interface EmailVerificationRecords {
	dkim_records: DnsRecord[];
	return_path_records: DnsRecord[];
}

export interface Deployment {
	id: string;
	mode: DeploymentMode;
	name: string;
	backend_host: string;
	frontend_host: string;
	mail_from_host: string;
	updated_at: string;
	created_at: string;
	verification_status?: VerificationStatus;
	domain_verification_records?: DomainVerificationRecords;
	email_verification_records?: EmailVerificationRecords;
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

export interface EmailTemplate {
	template_name: string;
	template_data: string;
	template_from: string;
	template_reply_to: string;
	template_subject: string;
}
