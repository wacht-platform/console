import { Segment } from "./segment";

export interface UserWithIdentifiers {
	id: string;
	created_at: string;
	updated_at: string;
	first_name: string;
	last_name: string;
	username: string | null;
	profile_picture_url: string;
	primary_email_address: string | null;
	primary_phone_number: string | null;
	segments?: Segment[];
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
	first_name: string | null;
	last_name: string | null;
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
	country_code: string;
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

export interface UserSignin {
	id: string;
	created_at: string;
	updated_at: string;
	session_id: string;
	user_id: string | null;
	active_organization_membership_id: string | null;
	active_workspace_membership_id: string | null;
	expires_at: string;
	last_active_at: string;
	ip_address: string;
	browser: string;
	device: string;
	city: string;
	region: string;
	region_code: string;
	country: string;
	country_code: string;
}

export interface UserPasskey {
	id: string;
	created_at: string | null;
	updated_at: string | null;
	user_id: string;
	name: string;
	sign_count: number;
	transports: string[] | null;
	last_used_at: string | null;
	backed_up: boolean | null;
	device_type: string | null;
}

export interface UserRoleSummary {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	permissions: string[];
	is_deployment_level: boolean;
}

export interface UserOrganizationMembership {
	id: string;
	created_at: string;
	updated_at: string;
	organization_id: string;
	user_id: string;
	public_metadata: Record<string, unknown>;
	roles: UserRoleSummary[];
	organization: {
		id: string;
		created_at: string;
		updated_at: string;
		name: string;
		image_url: string;
		description: string;
		member_count: number;
	};
}

export interface UserWorkspaceMembership {
	id: string;
	created_at: string;
	updated_at: string;
	workspace_id: string;
	organization_id: string;
	organization_membership_id: string;
	user_id: string;
	public_metadata: Record<string, unknown>;
	roles: UserRoleSummary[];
	workspace: {
		id: string;
		created_at: string;
		updated_at: string;
		name: string;
		image_url: string;
		description: string;
		member_count: number;
	};
}

export interface UserDetails {
	id: string;
	created_at: string;
	updated_at: string;
	first_name: string;
	last_name: string;
	username: string | null;
	profile_picture_url: string;
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
	primary_email_address_id: string | null;
	primary_phone_number: string | null;
	primary_phone_number_id: string | null;

	// All identifiers
	email_addresses: UserEmailAddress[];
	phone_numbers: UserPhoneNumber[];
	social_connections: SocialConnection[];
	segments?: Segment[];

	// Authentication
	has_password: boolean;
	has_otp: boolean;
	has_backup_codes: boolean;
}
