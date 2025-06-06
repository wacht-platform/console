import React, { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";

import type { BaseNodeData } from "../../../types/NodeTypes";
import type {
  ActionType,
  ApiActionConfig,
  KnowledgeBaseActionConfig,
  TriggerWorkflowActionConfig,
  SchemaField
} from "../../../types/workflow";
import type { AuthorizationConfiguration } from "../../../types/ai-tool";
import { useWorkflows } from "../../../lib/api/hooks/use-workflows";

import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";


interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<BaseNodeData> | null;
  onSave: (nodeId: string, data: Record<string, unknown>) => void;
  availableNodes?: Node<BaseNodeData>[]; // For Try/Catch protected nodes selection
}

interface NodeFormData {
  label: string;
  description?: string;
  node_type: "trigger" | "action" | "condition" | "transform" | "try-catch" | "llm-call" | "switch-case";
  // Trigger node fields
  condition?: string;
  scheduled_at?: string;
  // Action node fields
  action_type?: ActionType;
  api_config?: ApiActionConfig;
  knowledge_base_config?: KnowledgeBaseActionConfig;
  trigger_workflow_config?: TriggerWorkflowActionConfig;
  // Try/Catch fields
  enable_retry?: boolean;
  max_retries?: number;
  retry_delay_seconds?: number;
  log_errors?: boolean;
  custom_error_message?: string;
  contained_nodes?: string[];
  // LLM Call fields
  prompt_template?: string;
  response_format?: "text" | "json";
  json_schema?: SchemaField[];
  // Switch/Case fields
  switch_variable?: string;
  comparison_type?: "equals" | "contains" | "starts_with" | "ends_with" | "regex";
  number_of_cases?: number;
  default_case?: boolean;
  cases?: Array<{ case_value: string; case_label?: string }>;
  // Enhanced API fields
  request_body_schema?: SchemaField[];
  url_params_schema?: SchemaField[];
  query_params_schema?: SchemaField[];
  authorization?: AuthorizationConfiguration;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
  availableNodes = [],
}) => {
  const { data } = useWorkflows();
  const workflows = data?.workflows || [];

  // Initialize formData with node data or defaults
  const [formData, setFormData] = useState<NodeFormData>({
    label: "",
    description: "",
    node_type: "action",
    action_type: "api_call",
    api_config: {
      endpoint: "",
      method: "GET",
      headers: {},
      body: "",
      timeout_seconds: 30,
    },
  });

  // Update formData when the selected node changes
  useEffect(() => {
    if (node?.data) {
      // Determine node type from the node type or data
      let nodeType: "trigger" | "action" | "condition" | "transform" | "try-catch" | "llm-call" | "switch-case" = "action";
      if (node.type === "trigger") {
        nodeType = "trigger";
      } else if (node.type?.includes("conditional")) {
        nodeType = "condition";
      } else if (node.type?.includes("transform")) {
        nodeType = "transform";
      } else if (node.type === "try-catch") {
        nodeType = "try-catch";
      } else if (node.type === "llm-call") {
        nodeType = "llm-call";
      } else if (node.type === "switch-case") {
        nodeType = "switch-case";
      }

      setFormData({
        label: (node.data.label as string) || "",
        description: (node.data.description as string) || "",
        node_type: nodeType,
        condition: node.data.condition as string,
        scheduled_at: node.data.scheduled_at as string,
        action_type: node.data.action_type as ActionType,
        api_config: node.data.api_config as ApiActionConfig,
        knowledge_base_config: node.data.knowledge_base_config as KnowledgeBaseActionConfig,
        trigger_workflow_config: node.data.trigger_workflow_config as TriggerWorkflowActionConfig,
        // Try/Catch fields
        enable_retry: node.data.enable_retry as boolean,
        max_retries: node.data.max_retries as number,
        retry_delay_seconds: node.data.retry_delay_seconds as number,
        log_errors: node.data.log_errors as boolean,
        custom_error_message: node.data.custom_error_message as string,
        contained_nodes: node.data.contained_nodes as string[],
        // LLM Call fields
        prompt_template: node.data.prompt_template as string,
        response_format: node.data.response_format as "text" | "json",
        json_schema: node.data.json_schema as SchemaField[] || [],
        // Switch/Case fields
        switch_variable: node.data.switch_variable as string,
        comparison_type: node.data.comparison_type as "equals" | "contains" | "starts_with" | "ends_with" | "regex",
        number_of_cases: node.data.number_of_cases as number,
        default_case: node.data.default_case as boolean,
        cases: node.data.cases as Array<{ case_value: string; case_label?: string }>,
        // Enhanced API fields
        request_body_schema: node.data.request_body_schema as SchemaField[] || [],
        url_params_schema: node.data.url_params_schema as SchemaField[] || [],
        query_params_schema: node.data.query_params_schema as SchemaField[] || [],
        authorization: node.data.authorization as AuthorizationConfiguration || undefined,
      });
    }
  }, [node]);

  // Don't render the modal if it's not open or no node is selected
  if (!isOpen || !node) {
    return null;
  }



  // Handle save action
  const handleSave = () => {
    onSave(node!.id, formData as unknown as Record<string, unknown>);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        Edit {formData.node_type === "trigger" ? "Trigger" : formData.node_type === "action" ? "Action" : "Node"}
      </DialogTitle>
      <DialogBody>
        <div className="space-y-4">
          {/* Basic node information */}
          <Field>
            <Label htmlFor="label">Node Label:</Label>
            <Input
              id="label"
              name="label"
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Enter node label"
            />
          </Field>

          <Field>
            <Label htmlFor="description">Description:</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter node description"
              className="h-20"
            />
          </Field>

          {/* Trigger Node Configuration */}
          {formData.node_type === "trigger" && (
            <div className="space-y-4">
              <h4 className="font-medium">Trigger Configuration</h4>
              <Field>
                <Label htmlFor="condition">Trigger Condition:</Label>
                <Textarea
                  id="condition"
                  name="condition"
                  value={formData.condition || ""}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="Describe when this workflow should trigger automatically (e.g., when a user becomes active and has admin role)"
                  className="h-20"
                />
              </Field>
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> Leave empty for manual triggers. Describe the condition in natural language for automatic triggers.
              </div>
            </div>
          )}

          {/* Conditional Node Configuration */}
          {formData.node_type === "condition" && (
            <div className="space-y-4">
              <h4 className="font-medium">Conditional Configuration</h4>
              <Field>
                <Label htmlFor="condition">Condition Description:</Label>
                <Textarea
                  id="condition"
                  name="condition"
                  value={formData.condition || ""}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="Describe the condition to evaluate (e.g., user is active and has admin role)"
                  className="h-20"
                />
              </Field>
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> Describe the condition in natural language. The workflow will follow the True or False path based on this condition.
              </div>
            </div>
          )}

          {/* Action Node Configuration - Action type is determined by block type */}
          {formData.node_type === "action" && formData.action_type && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Action Type:</strong> {
                  formData.action_type === "api_call" ? "API Call" :
                  formData.action_type === "knowledge_base_search" ? "Knowledge Base Search" :
                  formData.action_type === "trigger_workflow" ? "Trigger Workflow" :
                  formData.action_type
                }
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Action type is determined by the block you selected from the sidebar.
              </div>
            </div>
          )}

          {/* API Call Configuration */}
          {formData.node_type === "action" && formData.action_type === "api_call" && formData.api_config && (
            <div className="space-y-4">
              <h4 className="font-medium">API Configuration</h4>
              <Field>
                <Label htmlFor="endpoint">API Endpoint:</Label>
                <Input
                  id="endpoint"
                  name="endpoint"
                  type="text"
                  value={formData.api_config.endpoint}
                  onChange={(e) => setFormData({
                    ...formData,
                    api_config: { ...formData.api_config!, endpoint: e.target.value }
                  })}
                  placeholder="https://api.example.com/users/{userId}/posts (use {paramName} for URL parameters)"
                />
              </Field>
              <Field>
                <Label htmlFor="method">HTTP Method:</Label>
                <Select
                  id="method"
                  name="method"
                  value={formData.api_config.method}
                  onChange={(e) => setFormData({
                    ...formData,
                    api_config: { ...formData.api_config!, method: e.target.value }
                  })}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </Select>
              </Field>

              {/* URL Parameters Schema */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">URL Parameters Schema:</label>
                <div className="text-xs text-gray-600 mb-2">
                  Define the parameters that will be substituted in the URL path (e.g., {`{userId}`} in the endpoint).
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(formData.url_params_schema || []).length === 0 && (
                    <div className="text-xs text-gray-500 italic p-2 text-center bg-gray-50 rounded">
                      No URL parameters defined. Click "Add URL Parameter" to add one.
                    </div>
                  )}
                  {(formData.url_params_schema || []).map((param, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Parameter Name</label>
                          <Input
                        placeholder="userId, postId, etc."
                        value={param.name}
                        onChange={(e) => {
                          const newParams = [...(formData.url_params_schema || [])];
                          newParams[index] = { ...param, name: e.target.value };
                          setFormData({ ...formData, url_params_schema: newParams });
                        }}
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <Select
                            value={param.type}
                            onChange={(e) => {
                              const newParams = [...(formData.url_params_schema || [])];
                              newParams[index] = { ...param, type: e.target.value };
                              setFormData({ ...formData, url_params_schema: newParams });
                            }}
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </Select>
                        </div>
                        <div className="w-20 flex flex-col">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Required</label>
                          <div className="flex items-center justify-center h-9">
                            <input
                              type="checkbox"
                              checked={param.required}
                              onChange={(e) => {
                                const newParams = [...(formData.url_params_schema || [])];
                                newParams[index] = { ...param, required: e.target.checked };
                                setFormData({ ...formData, url_params_schema: newParams });
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-8 flex flex-col">
                          <div className="h-5 mb-1"></div>
                          <div className="flex items-center justify-center h-9">
                            <button
                              type="button"
                              onClick={() => {
                                const newParams = (formData.url_params_schema || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, url_params_schema: newParams });
                              }}
                              className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newParams = [...(formData.url_params_schema || []), { name: '', type: 'string', required: true, description: '' }];
                    setFormData({ ...formData, url_params_schema: newParams });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add URL Parameter
                </button>
              </div>

              {/* Query Parameters Schema */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Query Parameters Schema:</label>
                <div className="text-xs text-gray-600 mb-2">
                  Define the query string parameters that will be appended to the URL (e.g., ?limit=10&offset=0).
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(formData.query_params_schema || []).length === 0 && (
                    <div className="text-xs text-gray-500 italic p-2 text-center bg-gray-50 rounded">
                      No query parameters defined. Click "Add Query Parameter" to add one.
                    </div>
                  )}
                  {(formData.query_params_schema || []).map((param, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Parameter Name</label>
                          <Input
                            placeholder="limit, offset, search, etc."
                            value={param.name}
                            onChange={(e) => {
                              const newParams = [...(formData.query_params_schema || [])];
                              newParams[index] = { ...param, name: e.target.value };
                              setFormData({ ...formData, query_params_schema: newParams });
                            }}
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <Select
                            value={param.type}
                            onChange={(e) => {
                              const newParams = [...(formData.query_params_schema || [])];
                              newParams[index] = { ...param, type: e.target.value };
                              setFormData({ ...formData, query_params_schema: newParams });
                            }}
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </Select>
                        </div>
                        <div className="w-20 flex flex-col">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Required</label>
                          <div className="flex items-center justify-center h-9">
                            <input
                              type="checkbox"
                              checked={param.required}
                              onChange={(e) => {
                                const newParams = [...(formData.query_params_schema || [])];
                                newParams[index] = { ...param, required: e.target.checked };
                                setFormData({ ...formData, query_params_schema: newParams });
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-8 flex flex-col">
                          <div className="h-5 mb-1"></div>
                          <div className="flex items-center justify-center h-9">
                            <button
                              type="button"
                              onClick={() => {
                                const newParams = (formData.query_params_schema || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, query_params_schema: newParams });
                              }}
                              className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newParams = [...(formData.query_params_schema || []), { name: '', type: 'string', required: false, description: '' }];
                    setFormData({ ...formData, query_params_schema: newParams });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Query Parameter
                </button>
              </div>

              {/* Request Body Schema */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Request Body Schema:</label>
                <div className="text-xs text-gray-600 mb-2">
                  Define the structure and types of data that will be sent in the request body.
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(formData.request_body_schema || []).length === 0 && (
                    <div className="text-xs text-gray-500 italic p-2 text-center bg-gray-50 rounded">
                      No body fields defined. Click "Add Body Field" to add one.
                    </div>
                  )}
                  {(formData.request_body_schema || []).map((field, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">JSON Key Name</label>
                          <Input
                            placeholder="name, email, age, etc."
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...(formData.request_body_schema || [])];
                              newFields[index] = { ...field, name: e.target.value };
                              setFormData({ ...formData, request_body_schema: newFields });
                            }}
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <Select
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...(formData.request_body_schema || [])];
                              newFields[index] = { ...field, type: e.target.value };
                              setFormData({ ...formData, request_body_schema: newFields });
                            }}
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="object">object</option>
                            <option value="array">array</option>
                          </Select>
                        </div>
                        <div className="w-20 flex flex-col">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Required</label>
                          <div className="flex items-center justify-center h-9">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                const newFields = [...(formData.request_body_schema || [])];
                                newFields[index] = { ...field, required: e.target.checked };
                                setFormData({ ...formData, request_body_schema: newFields });
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-8 flex flex-col">
                          <div className="h-5 mb-1"></div>
                          <div className="flex items-center justify-center h-9">
                            <button
                              type="button"
                              onClick={() => {
                                const newFields = (formData.request_body_schema || []).filter((_, i) => i !== index);
                                setFormData({ ...formData, request_body_schema: newFields });
                              }}
                              className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newFields = [...(formData.request_body_schema || []), { name: '', type: 'string', required: true, description: '' }];
                    setFormData({ ...formData, request_body_schema: newFields });
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Body Field
                </button>
              </div>

              <Field>
                <Label htmlFor="body">Request Body Template:</Label>
                <Textarea
                  id="body"
                  name="body"
                  value={formData.api_config.body || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    api_config: { ...formData.api_config!, body: e.target.value }
                  })}
                  placeholder="Request body template with variables (e.g., { &quot;name&quot;: &quot;{{user.name}}&quot;, &quot;email&quot;: &quot;{{user.email}}&quot; })"
                  className="h-20 font-mono text-sm"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Define the actual request body content with variable placeholders (e.g., {`{{variable}}`}).
                </div>
              </Field>

              {/* Authorization Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Authorization:</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.authorization?.authorize_as_user || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        authorization: {
                          authorize_as_user: e.target.checked,
                          jwt_template_id: formData.authorization?.jwt_template_id,
                          custom_headers: formData.authorization?.custom_headers || []
                        }
                      })}
                    />
                    <span className="text-sm">Authorize as user</span>
                  </label>
                  <div className="text-xs text-gray-600 ml-6">
                    When enabled, the API call will be made with the current user's authorization context.
                  </div>

                  {formData.authorization?.authorize_as_user && (
                    <div className="ml-6 space-y-3">
                      <Field>
                        <Label htmlFor="jwt_template_id">JWT Template ID (Optional):</Label>
                        <Input
                          id="jwt_template_id"
                          name="jwt_template_id"
                          type="text"
                          value={formData.authorization?.jwt_template_id || ""}
                          onChange={(e) => setFormData({
                            ...formData,
                            authorization: {
                              ...formData.authorization!,
                              jwt_template_id: e.target.value || undefined
                            }
                          })}
                          placeholder="Enter JWT template ID"
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          Optional JWT template to use for user authorization.
                        </div>
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Base Search Configuration */}
          {formData.node_type === "action" && formData.action_type === "knowledge_base_search" && formData.knowledge_base_config && (
            <div className="space-y-4">
              <h4 className="font-medium">Knowledge Base Configuration</h4>
              <Field>
                <Label htmlFor="knowledge_base_id">Knowledge Base ID:</Label>
                <Input
                  id="knowledge_base_id"
                  name="knowledge_base_id"
                  type="text"
                  value={formData.knowledge_base_config.knowledge_base_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    knowledge_base_config: { ...formData.knowledge_base_config!, knowledge_base_id: e.target.value }
                  })}
                  placeholder="Enter knowledge base ID"
                />
              </Field>
              <Field>
                <Label htmlFor="query">Search Query:</Label>
                <Input
                  id="query"
                  name="query"
                  type="text"
                  value={formData.knowledge_base_config.query}
                  onChange={(e) => setFormData({
                    ...formData,
                    knowledge_base_config: { ...formData.knowledge_base_config!, query: e.target.value }
                  })}
                  placeholder="Enter search query"
                />
              </Field>
              <Field>
                <Label htmlFor="max_results">Max Results:</Label>
                <Input
                  id="max_results"
                  name="max_results"
                  type="number"
                  value={formData.knowledge_base_config.max_results || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    knowledge_base_config: {
                      ...formData.knowledge_base_config!,
                      max_results: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  })}
                  placeholder="10"
                />
              </Field>
            </div>
          )}

          {/* Trigger Workflow Configuration */}
          {formData.node_type === "action" && formData.action_type === "trigger_workflow" && formData.trigger_workflow_config && (
            <div className="space-y-4">
              <h4 className="font-medium">Trigger Another Workflow</h4>
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> This action will manually trigger another workflow when this step is executed.
              </div>
              <Field>
                <Label htmlFor="target_workflow_id">Workflow to Trigger:</Label>
                <Select
                  id="target_workflow_id"
                  name="target_workflow_id"
                  value={formData.trigger_workflow_config.target_workflow_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_workflow_config: { ...formData.trigger_workflow_config!, target_workflow_id: e.target.value }
                  })}
                >
                  <option value="">Select a workflow to trigger</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {/* Try/Catch Configuration */}
          {formData.node_type === "try-catch" && (
            <div className="space-y-4">
              <h4 className="font-medium">Error Handling Configuration</h4>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enable_retry !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      enable_retry: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Retry on Error</span>
                </label>
              </div>

              {formData.enable_retry && (
                <>
                  <Field>
                    <Label htmlFor="max_retries">Max Retries:</Label>
                    <Input
                      id="max_retries"
                      name="max_retries"
                      type="number"
                      value={formData.max_retries || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_retries: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="3"
                      min="1"
                      max="10"
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="retry_delay_seconds">Retry Delay (seconds):</Label>
                    <Input
                      id="retry_delay_seconds"
                      name="retry_delay_seconds"
                      type="number"
                      value={formData.retry_delay_seconds || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        retry_delay_seconds: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="5"
                      min="1"
                      max="300"
                    />
                  </Field>
                </>
              )}

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.log_errors !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      log_errors: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium text-gray-700">Log Errors</span>
                </label>
              </div>

              <Field>
                <Label htmlFor="custom_error_message">Custom Error Message:</Label>
                <Input
                  id="custom_error_message"
                  name="custom_error_message"
                  type="text"
                  value={formData.custom_error_message || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_error_message: e.target.value
                  })}
                  placeholder="Optional custom error message"
                />
              </Field>

              {/* Protected Node Management (SINGLE NODE ONLY) */}
              <div>
                <h5 className="font-medium mb-2">Protected Node</h5>
                <div className="text-sm text-gray-600 mb-3">
                  Select ONE node to be protected by this Try/Catch block:
                </div>

                {/* Single node selection */}
                <Field>
                  <Label htmlFor="protected_node">Protected Node:</Label>
                  <Select
                    id="protected_node"
                    name="protected_node"
                    value={formData.contained_nodes?.[0] || ""}
                    onChange={(e) => {
                      // Only allow one protected node
                      const selectedNode = e.target.value;
                      setFormData({
                        ...formData,
                        contained_nodes: selectedNode ? [selectedNode] : []
                      });
                    }}
                  >
                    <option value="">No node selected</option>
                    {availableNodes
                      .filter(n => n.id !== node?.id && n.type !== "try-catch") // Exclude self and other try/catch blocks
                      .map((availableNode) => (
                        <option key={availableNode.id} value={availableNode.id}>
                          {(availableNode.data.label as string) || availableNode.id} ({availableNode.type})
                        </option>
                      ))}
                  </Select>
                </Field>

                {/* Currently protected node display */}
                <div className="border rounded p-3 bg-gray-50">
                  {formData.contained_nodes && formData.contained_nodes.length > 0 ? (
                    (() => {
                      const nodeId = formData.contained_nodes[0];
                      const protectedNode = availableNodes.find(n => n.id === nodeId);
                      const nodeLabel = protectedNode ?
                        ((protectedNode.data.label as string) || protectedNode.id) :
                        nodeId;
                      const nodeType = protectedNode?.type || "unknown";

                      return (
                        <div className="flex items-center justify-between text-sm bg-white p-3 rounded border">
                          <div>
                            <div className="font-medium text-green-700">✅ Protected Node</div>
                            <div className="text-gray-700">
                              <span className="font-medium">{nodeLabel}</span>
                              <span className="text-gray-500 ml-2">({nodeType})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, contained_nodes: [] });
                            }}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300 hover:border-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 text-center">
                      <div className="mb-1">No protected node selected</div>
                      <div className="text-xs">Select a node above or drop one in the container</div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                  💡 <strong>Single Node Protection:</strong> Try/Catch blocks can only protect one node at a time.
                  Drop a node in the container or select one above.
                </div>
              </div>
            </div>
          )}

          {/* LLM Call Configuration */}
          {formData.node_type === "llm-call" && (
            <div className="space-y-4">
              <h4 className="font-medium">LLM Configuration</h4>

              <Field>
                <Label htmlFor="prompt_template">Prompt Template:</Label>
                <Textarea
                  id="prompt_template"
                  name="prompt_template"
                  value={formData.prompt_template || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    prompt_template: e.target.value
                  })}
                  placeholder="Enter your prompt template here..."
                  className="h-24 font-mono text-sm"
                />
              </Field>

              <Field>
                <Label htmlFor="response_format">Response Format:</Label>
                <Select
                  id="response_format"
                  name="response_format"
                  value={formData.response_format || "text"}
                  onChange={(e) => setFormData({
                    ...formData,
                    response_format: e.target.value as "text" | "json"
                  })}
                >
                  <option value="text">Text</option>
                  <option value="json">JSON</option>
                </Select>
              </Field>

              {formData.response_format === "json" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">JSON Response Schema:</label>
                  <div className="text-xs text-gray-600 mb-2">
                    Define the structure of the expected JSON response from the LLM.
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(formData.json_schema || []).length === 0 && (
                      <div className="text-xs text-gray-500 italic p-2 text-center bg-gray-50 rounded">
                        No response fields defined. Click "Add Response Field" to add one.
                      </div>
                    )}
                    {(formData.json_schema || []).map((field, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">JSON Key Name</label>
                            <Input
                              placeholder="result, status, data, etc."
                              value={field.name}
                              onChange={(e) => {
                                const newFields = [...(formData.json_schema || [])];
                                newFields[index] = { ...field, name: e.target.value };
                                setFormData({ ...formData, json_schema: newFields });
                              }}
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                            <Select
                              value={field.type}
                              onChange={(e) => {
                                const newFields = [...(formData.json_schema || [])];
                                newFields[index] = { ...field, type: e.target.value };
                                setFormData({ ...formData, json_schema: newFields });
                              }}
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="object">object</option>
                              <option value="array">array</option>
                            </Select>
                          </div>
                          <div className="w-20 flex flex-col">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Required</label>
                            <div className="flex items-center justify-center h-9">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => {
                                  const newFields = [...(formData.json_schema || [])];
                                  newFields[index] = { ...field, required: e.target.checked };
                                  setFormData({ ...formData, json_schema: newFields });
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-8 flex flex-col">
                            <div className="h-5 mb-1"></div>
                            <div className="flex items-center justify-center h-9">
                              <button
                                type="button"
                                onClick={() => {
                                  const newFields = (formData.json_schema || []).filter((_, i) => i !== index);
                                  setFormData({ ...formData, json_schema: newFields });
                                }}
                                className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFields = [...(formData.json_schema || []), { name: '', type: 'string', required: true, description: '' }];
                      setFormData({ ...formData, json_schema: newFields });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Response Field
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Switch/Case Configuration */}
          {formData.node_type === "switch-case" && (
            <div className="space-y-4">
              <h4 className="font-medium">Switch/Case Configuration</h4>

              <Field>
                <Label htmlFor="switch_variable">Switch Variable:</Label>
                <Input
                  id="switch_variable"
                  name="switch_variable"
                  type="text"
                  value={formData.switch_variable || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    switch_variable: e.target.value
                  })}
                  placeholder="user.status, response.code, etc."
                />
              </Field>

              <Field>
                <Label htmlFor="comparison_type">Comparison Type:</Label>
                <Select
                  id="comparison_type"
                  name="comparison_type"
                  value={formData.comparison_type || "equals"}
                  onChange={(e) => setFormData({
                    ...formData,
                    comparison_type: e.target.value as "equals" | "contains" | "starts_with" | "ends_with" | "regex"
                  })}
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                  <option value="regex">Regex</option>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="number_of_cases">Number of Cases:</Label>
                <Input
                  id="number_of_cases"
                  name="number_of_cases"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.number_of_cases || ""}
                  onChange={(e) => {
                    const numCases = e.target.value ? parseInt(e.target.value) : 2;
                    // Adjust cases array to match the number
                    const currentCases = formData.cases || [];
                    let newCases = [...currentCases];

                    if (numCases > currentCases.length) {
                      // Add new cases
                      for (let i = currentCases.length; i < numCases; i++) {
                        newCases.push({
                          case_value: `case_${i + 1}`,
                          case_label: `Case ${i + 1}`
                        });
                      }
                    } else if (numCases < currentCases.length) {
                      // Remove excess cases
                      newCases = newCases.slice(0, numCases);
                    }

                    setFormData({
                      ...formData,
                      number_of_cases: numCases,
                      cases: newCases
                    });
                  }}
                  placeholder="2"
                />
              </Field>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.default_case !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      default_case: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Default Case</span>
                </label>
              </div>

              {/* Case Definitions */}
              {formData.number_of_cases && formData.number_of_cases > 0 && (
                <div>
                  <h5 className="font-medium mb-3">Case Definitions</h5>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {Array.from({ length: formData.number_of_cases }, (_, index) => {
                      const caseData = formData.cases?.[index] || { case_value: '', case_label: '' };
                      return (
                        <div key={index} className="py-3 rounded">
                          <div className="font-medium text-sm text-gray-700 mb-2">Case {index + 1}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Case Value:
                              </label>
                              <Input
                                type="text"
                                value={caseData.case_value}
                                onChange={(e) => {
                                  const newCases = [...(formData.cases || [])];
                                  newCases[index] = {
                                    ...newCases[index],
                                    case_value: e.target.value
                                  };
                                  setFormData({ ...formData, cases: newCases });
                                }}
                                placeholder="active, success, etc."
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Case Label:
                              </label>
                              <Input
                                type="text"
                                value={caseData.case_label || ''}
                                onChange={(e) => {
                                  const newCases = [...(formData.cases || [])];
                                  newCases[index] = {
                                    ...newCases[index],
                                    case_label: e.target.value
                                  };
                                  setFormData({ ...formData, cases: newCases });
                                }}
                                placeholder="Active User, Success, etc."
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogBody>

      <DialogActions>
        <Button onClick={handleSave}>Save</Button>
        <Button plain onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NodeEditModal;
