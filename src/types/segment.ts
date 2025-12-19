export type SegmentType = 'organization' | 'workspace' | 'user';

export interface Segment {
  id: string;
  name: string;
  type: SegmentType;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentRequest {
  name: string;
  type: SegmentType;
  description?: string;
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
}

export interface AssignSegmentRequest {
  segmentId: string;
  targetId: string;
  targetType: SegmentType;
}

export interface UserFilter {
  name?: string;
  email?: string;
  phone?: string;
}

export interface OrganizationFilter {
  name?: string;
}

export interface WorkspaceFilter {
  name?: string;
}

export interface SegmentDataFilters {
  segment_id?: string;
  user?: UserFilter;
  organization?: OrganizationFilter;
  workspace?: WorkspaceFilter;
}

export interface AnalyzeRequest {
  target_type: SegmentType;
  filters?: SegmentDataFilters;
}

export interface AnalyzedEntity {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}
