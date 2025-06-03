export interface UserWithIdentifiers {
	id: string;
	created_at: string;
	updated_at: string;
	first_name: string;
	last_name: string;
	username: string | null;
	primary_email_address: string | null;
	primary_phone_number: string | null;
}

export interface DeploymentInvitation {
	id: string;
	created_at: string;
	updated_at: string;
	deployment_id: string;
	first_name: string;
	last_name: string;
	email_address: string;
	expiry: string;
}

export interface DeploymentWaitlistUser {
	id: string;
	created_at: string;
	updated_at: string;
	deployment_id: string;
	email_address: string;
	first_name: string;
	last_name: string;
}

export enum VerificationStrategy {
	Otp = "otp",
	OauthGoogle = "oauth_google",
	OauthGithub = "oauth_github",
	OauthMicrosoft = "oauth_microsoft",
	OauthFacebook = "oauth_facebook",
	OauthLinkedin = "oauth_linkedin",
	OauthDiscord = "oauth_discord",
	OauthApple = "oauth_apple",
}

export enum SchemaVersion {
	V1 = "v1",
	V2 = "v2",
}

export enum SecondFactorPolicy {
	Optional = "optional",
	Required = "required",
	Disabled = "disabled",
}

export interface UserEmailAddress {
	id: string;
	created_at: string;
	updated_at: string;
	deployment_id: string;
	user_id: string;
	email: string;
	is_primary: boolean;
	verified: boolean;
	verified_at: string;
	verification_strategy: VerificationStrategy;
	social_connection_id: string | null;
}

export interface UserPhoneNumber {
	id: string;
	created_at: string;
	updated_at: string;
	user_id: string;
	phone_number: string;
	is_primary: boolean;
	verified: boolean;
	verified_at: string;
}

export interface SocialConnection {
	id: string;
	created_at: string;
	updated_at: string;
	user_id: string;
	user_email_address_id: string;
	provider: string;
	email_address: string;
	access_token: string;
	refresh_token: string;
}

export interface UserDetails {
	id: string;
	created_at: string;
	updated_at: string;
	first_name: string;
	last_name: string;
	username: string | null;
	schema_version: SchemaVersion;
	disabled: boolean;
	second_factor_policy: SecondFactorPolicy;
	active_organization_membership_id: string | null;
	active_workspace_membership_id: string | null;
	deployment_id: string;
	public_metadata: Record<string, unknown>;
	private_metadata: Record<string, unknown>;

	// Primary identifiers
	primary_email_address: string | null;
	primary_phone_number: string | null;

	// All identifiers
	email_addresses: UserEmailAddress[];
	phone_numbers: UserPhoneNumber[];
	social_connections: SocialConnection[];

	// Authentication
	has_password: boolean;
	has_otp: boolean;
	has_backup_codes: boolean;
}
