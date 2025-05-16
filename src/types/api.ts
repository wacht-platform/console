export interface PaginatedResponse<T> {
  data: T[];
  has_next: boolean;
}

export interface QueryParams {
  offset?: number;
  sort_key?: string;
  sort_order?: string;
  limit?: number;
}
