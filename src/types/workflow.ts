export type VariableType = "string" | "number" | "boolean" | "object" | "array";

export interface WorkflowVariable {
  name: string;
  value_type: VariableType;
  default_value?: string;
  description?: string;
  required: boolean;
}

export interface WorkflowConfiguration {
  timeout_seconds?: number;
  max_retries?: number;
  retry_delay_seconds?: number;
  enable_logging: boolean;
  enable_metrics: boolean;
  variables: Record<string, WorkflowVariable>;
}

export interface NodePosition {
  x: number;
  y: number;
}



export interface TriggerNodeConfig {
  condition: string; // Text condition for automated trigger
}

export type ActionType =
  | "api_call"
  | "knowledge_base_search"
  | "trigger_workflow"
  | "platform_event";

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ApiActionConfig {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeout_seconds?: number;
  request_body_schema?: SchemaField[];
  url_params_schema?: SchemaField[];
  query_params_schema?: SchemaField[];
  authorization?: {
    authorize_as_user: boolean;
    jwt_template_id?: string;
    custom_headers: Array<{ name: string; value: string; required: boolean; description?: string }>;
  };
}

export interface KnowledgeBaseActionConfig {
  knowledge_base_id: string;
  query: string;
  max_results?: number;
  similarity_threshold?: number;
  sort_by_relevance?: boolean;
}

export interface TriggerWorkflowActionConfig {
  target_workflow_id: string;
}

export interface PlatformEventActionConfig {
  event_label: string;
  event_data?: Record<string, unknown>;
}

export interface ActionNodeConfig {
  action_type: ActionType;
  tool_id?: string;
  api_config?: ApiActionConfig;
  knowledge_base_config?: KnowledgeBaseActionConfig;
  trigger_workflow_config?: TriggerWorkflowActionConfig;
  platform_event_config?: PlatformEventActionConfig;
}

export type ConditionEvaluationType = "javascript" | "json_path" | "simple";

export interface ConditionNodeConfig {
  condition_type: ConditionEvaluationType;
  expression: string;
  true_path?: string;
  false_path?: string;
}

export type TransformType = "javascript" | "json_transform" | "data_mapping";

export interface TransformNodeConfig {
  transform_type: TransformType;
  script: string;
  input_mapping: Record<string, string>;
  output_mapping: Record<string, string>;
}

export interface ErrorHandlerNodeConfig {
  enable_retry?: boolean; // Simplified retry configuration
  max_retries?: number;
  retry_delay_seconds?: number;
  log_errors?: boolean;
  custom_error_message?: string;
  contained_nodes?: string[]; // IDs of nodes contained within this try/catch
}

export interface LLMCallNodeConfig {
  prompt_template: string;
  response_format?: "text" | "json";
  json_schema?: SchemaField[]; // JSON schema when response_format is "json"
}

export interface SwitchCase {
  case_condition: string; // Natural language condition
  case_label?: string;
}

export interface SwitchNodeConfig {
  switch_condition: string; // Natural language switch condition
  cases: SwitchCase[];
  default_case?: boolean;
}

export interface ToolCallNodeConfig {
  tool_id: number;
  input_parameters: Record<string, unknown>;
}

export interface ConditionNodeConfig {
  condition_type: ConditionEvaluationType;
  expression: string;
  true_path?: string;
  false_path?: string;
}

export interface StoreContextNodeConfig {
  context_data: string; // Textarea content for context to store
  use_llm: boolean; // Toggle for using LLM instead of static data
}

export interface FetchContextNodeConfig {
  context_data: string; // Textarea content for context to fetch
  use_llm: boolean; // Toggle for using LLM instead of static data
}

export type WorkflowNodeType =
  | ({ type: "Trigger" } & TriggerNodeConfig)
  | ({ type: "Condition" } & ConditionNodeConfig)
  | ({ type: "ErrorHandler" } & ErrorHandlerNodeConfig)
  | ({ type: "LLMCall" } & LLMCallNodeConfig)
  | ({ type: "Switch" } & SwitchNodeConfig)
  | ({ type: "ToolCall" } & ToolCallNodeConfig)
  | ({ type: "StoreContext" } & StoreContextNodeConfig)
  | ({ type: "FetchContext" } & FetchContextNodeConfig);

export interface WorkflowNodeData {
  label: string;
  description?: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  node_type: WorkflowNodeType;
  position: NodePosition;
  data: WorkflowNodeData;
}

export type ConditionType = "always" | "on_success" | "on_error" | "on_condition";

export interface EdgeCondition {
  expression: string;
  condition_type: ConditionType;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  source_handle?: string;
  target_handle?: string;
  condition?: EdgeCondition;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: string;
}

export interface AiWorkflow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  deployment_id: string;
  configuration: WorkflowConfiguration;
  workflow_definition: WorkflowDefinition;
}

export interface AiWorkflowWithDetails extends AiWorkflow {
  agents_count: number;
  last_execution_at?: string;
}

export type ExecutionStatus = 
  | "pending" 
  | "running" 
  | "completed" 
  | "failed" 
  | "cancelled" 
  | "timeout";

export interface NodeExecution {
  node_id: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_message?: string;
  retry_count: number;
}

export interface ExecutionContext {
  variables: Record<string, unknown>;
  node_executions: NodeExecution[];
  current_node?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  created_at: string;
  updated_at: string;
  status: ExecutionStatus;
  trigger_data?: Record<string, unknown>;
  execution_context: ExecutionContext;
  output_data?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

// API Request/Response types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  configuration?: WorkflowConfiguration;
  workflow_definition?: WorkflowDefinition;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  configuration?: WorkflowConfiguration;
  workflow_definition?: WorkflowDefinition;
}

export interface WorkflowFormData {
  name: string;
  description: string;
  configuration: WorkflowConfiguration;
  workflow_definition: WorkflowDefinition;
}
