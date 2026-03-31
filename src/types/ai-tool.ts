export type AiToolType =
  | "api"
  | "knowledge_base"
  | "platform_event"
  | "code_runner";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";


export interface SchemaField {
  name: string;
  field_type: string;
  required: boolean;
  description?: string;
  items_type?: string;
  items_schema?: SchemaField;
  properties?: SchemaField[];
}

export interface AuthorizationConfiguration {
  authorize_as_user: boolean;
  jwt_template_id?: string;
  custom_headers?: SchemaField[];
}

export interface ApiToolConfiguration {
  type: "Api";
  endpoint: string;
  method: HttpMethod;
  authorization?: AuthorizationConfiguration;
  request_body_schema?: SchemaField[];
  url_params_schema?: SchemaField[];
  timeout_seconds?: number;
}

export interface KnowledgeBaseSearchSettings {
  max_results?: number;
  similarity_threshold?: number;
  include_metadata: boolean;
  sort_by_relevance: boolean;
}

export interface KnowledgeBaseToolConfiguration {
  type: "KnowledgeBase";
  knowledge_base_ids: string[];
  search_settings: KnowledgeBaseSearchSettings;
}

export interface PlatformEventToolConfiguration {
  type: "PlatformEvent";
  event_label: string;
  event_data?: Record<string, unknown>;
}

export interface CodeRunnerEnvVariable {
  name: string;
  value: string;
}

export interface CodeRunnerToolConfiguration {
  type: "CodeRunner";
  runtime: "python";
  code: string;
  input_schema?: SchemaField[];
  output_schema?: SchemaField[];
  timeout_seconds?: number;
  allow_network: boolean;
  env_variables?: CodeRunnerEnvVariable[];
}

export type AiToolConfiguration =
  | ApiToolConfiguration
  | KnowledgeBaseToolConfiguration
  | PlatformEventToolConfiguration
  | CodeRunnerToolConfiguration;

export interface AiTool {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  tool_type: AiToolType;
  deployment_id: string;
  requires_user_approval: boolean;
  configuration: AiToolConfiguration;
}

export type AiToolWithDetails = AiTool;

// Form data interfaces for the frontend
export interface ToolFormData {
  name: string;
  description: string;
  type: AiToolType;
  requires_user_approval: boolean;
  configuration: AiToolConfiguration;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  tool_type: AiToolType;
  requires_user_approval: boolean;
  configuration: AiToolConfiguration;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  tool_type?: AiToolType;
  requires_user_approval?: boolean;
  configuration?: AiToolConfiguration;
}
