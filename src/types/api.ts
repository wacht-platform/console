export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
}

export interface QueryParams {
  offset?: number;
  sort_key?: string;
  sort_order?: string;
  limit?: number;
}
