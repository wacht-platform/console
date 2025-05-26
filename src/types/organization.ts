// Organization Permission Types
export interface OrganizationPermission {
  id: string;
  created_at: string;
  updated_at: string;
  org_role_id: string;
  permission: string;
}

// Organization Role Types
export interface OrganizationRole {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  permissions: OrganizationPermission[];
}

// Simplified role type for UI components
export interface OrganizationRoleSimple {
  id: string;
  name: string;
  permissions: string[];
}

// Organization Member Types
export interface OrganizationMemberDetails {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id: string;
  roles: OrganizationRole[];
  first_name: string;
  last_name: string;
  username: string | null;
  primary_email_address: string | null;
  primary_phone_number: string | null;
  user_created_at: string;
}

// Simplified member type for UI components
export interface OrganizationMemberSimple {
  id: string;
  first_name: string;
  last_name: string;
  primary_email_address: string | null;
  roles: OrganizationRoleSimple[];
}

// Workspace Types
export interface Workspace {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
}

// Organization Types
export interface Organization {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
}

export interface OrganizationDetails {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  members: OrganizationMemberDetails[];
  roles: OrganizationRole[];
  workspaces: Workspace[];
}

// API Request/Response Types
export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  image_url?: string;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  image_url?: string;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
}

export interface AddOrganizationMemberRequest {
  user_id: string;
  role_ids: string[];
}

export interface UpdateOrganizationMemberRequest {
  role_ids: string[];
}

export interface CreateOrganizationRoleRequest {
  name: string;
  permissions: string[];
}

export interface UpdateOrganizationRoleRequest {
  name?: string;
  permissions?: string[];
}

// Organization Membership Types
export interface OrganizationMembership {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id: string;
  roles: OrganizationRole[];
}

// Available Permissions (these should match backend)
export const ORGANIZATION_PERMISSIONS = {
  ADMIN: 'organization:admin',
  MEMBER: 'organization:member',
  MANAGE_MEMBERS: 'organization:manage_members',
  MANAGE_ROLES: 'organization:manage_roles',
  MANAGE_SETTINGS: 'organization:manage_settings',
  DELETE: 'organization:delete',
  VIEW: 'organization:view',
} as const;

export type OrganizationPermissionType = typeof ORGANIZATION_PERMISSIONS[keyof typeof ORGANIZATION_PERMISSIONS];

// Default Roles
export const DEFAULT_ORGANIZATION_ROLES = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
} as const;
