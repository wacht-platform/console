export type AiToolType = "api" | "knowledge_base" | "platform_event" | "platform_function";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ParameterValueType {
  type: "hardcoded" | "from_chat";
  value?: string;
  lookup_key?: string;
}

export interface HttpParameter {
  name: string;
  value_type: ParameterValueType;
  required: boolean;
  description?: string;
}

export interface SchemaField {
  name: string;
  field_type: string;
  required: boolean;
  description?: string;
}

export interface AuthorizationConfiguration {
  authorize_as_user: boolean;
  jwt_template_id?: string;
  custom_headers: HttpParameter[];
}

export interface ApiToolConfiguration {
  type: "Api";
  endpoint: string;
  method: HttpMethod;
  headers: HttpParameter[];
  query_parameters: HttpParameter[];
  body_parameters: HttpParameter[];
  authorization?: AuthorizationConfiguration;
  request_body_schema?: SchemaField[];
  url_params_schema?: SchemaField[];
  query_params_schema?: SchemaField[];
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
  knowledge_base_id: string;
  search_settings: KnowledgeBaseSearchSettings;
}

export interface PlatformEventToolConfiguration {
  type: "PlatformEvent";
  event_label: string;
  event_data?: Record<string, unknown>;
}

export interface PlatformFunctionToolConfiguration {
  type: "PlatformFunction";
  function_name: string;
  function_description?: string;
  input_schema?: SchemaField[];
  output_schema?: SchemaField[];
  is_overridable: boolean;
}

export type AiToolConfiguration = ApiToolConfiguration | KnowledgeBaseToolConfiguration | PlatformEventToolConfiguration | PlatformFunctionToolConfiguration;

export interface AiTool {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  tool_type: AiToolType;
  deployment_id: string;
  configuration: AiToolConfiguration;
}

export type AiToolWithDetails = AiTool;

// Form data interfaces for the frontend
export interface ToolFormData {
  name: string;
  description: string;
  type: AiToolType;
  configuration: AiToolConfiguration;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  tool_type: AiToolType;
  configuration: AiToolConfiguration;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  tool_type?: AiToolType;
  configuration?: AiToolConfiguration;
}
