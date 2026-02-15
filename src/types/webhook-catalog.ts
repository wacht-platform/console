export interface WebhookEventDefinition {
  name: string;
  description: string;
  group?: string;
  schema?: Record<string, unknown> | null;
  example_payload?: Record<string, unknown> | null;
  is_archived?: boolean;
}

export interface WebhookEventCatalog {
  deployment_id: string;
  slug: string;
  name: string;
  description?: string;
  events: WebhookEventDefinition[];
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookEventCatalogRequest {
  slug: string;
  name: string;
  description?: string;
  events: WebhookEventDefinition[];
}

export interface UpdateWebhookEventCatalogRequest {
  name: string;
  description?: string;
  events: WebhookEventDefinition[];
}
