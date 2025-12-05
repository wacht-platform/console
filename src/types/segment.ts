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

export type FilterKind = 'segment' | 'field' | 'metadata' | 'metric';

export interface AnalysisFilter {
  kind: FilterKind;
  operator: string;
  value?: string | number;
  field?: string; // For field, metadata, metric
}

export interface AnalyzeRequest {
  target_type: SegmentType;
  filters: AnalysisFilter[];
}

export interface AnalyzedEntity {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}
