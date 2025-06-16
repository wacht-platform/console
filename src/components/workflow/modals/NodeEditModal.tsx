import React, { useState, useEffect } from "react";
import type { Node } from "@xyflow/react";

import type { BaseNodeData } from "../../../types/NodeTypes";
import type { AiTool } from "../../../types/ai-tool";
import ToolSelector from "../ToolSelector";

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
import { validateNodeFormData, type ValidationError } from "../../../lib/utils/workflow-validation";


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
  node_type: "trigger" | "action" | "condition" | "transform" | "try-catch" | "llm-call" | "switch-case" | "tool-call" | "store-context" | "fetch-context";
  // Trigger node fields
  condition?: string;
  scheduled_at?: string;

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
  json_schema?: Array<{ name: string; type: string; required: boolean; description: string }>;
  // Switch/Case fields
  switch_condition?: string;
  default_case?: boolean;
  cases?: Array<{ case_condition: string; case_label?: string }>;
  // Tool Call fields
  tool_id?: string;
  tool_name?: string;
  tool_type?: string;
  input_parameters?: Record<string, unknown>;
  // Context fields
  context_data?: string;
  use_llm?: boolean;

}

const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  node,
  onSave,
  availableNodes = [],
}) => {
  // Remove unused workflows since we no longer have trigger workflow action

  // Initialize formData with node data or defaults
  const [formData, setFormData] = useState<NodeFormData>({
    label: "",
    description: "",
    node_type: "action",
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update formData when the selected node changes
  useEffect(() => {
    if (node?.data) {
      // Determine node type from the node type or data
      let nodeType: "trigger" | "action" | "condition" | "transform" | "try-catch" | "llm-call" | "switch-case" | "tool-call" | "store-context" | "fetch-context" = "action";
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
      } else if (node.type === "tool-call") {
        nodeType = "tool-call";
      } else if (node.type === "store-context") {
        nodeType = "store-context";
      } else if (node.type === "fetch-context") {
        nodeType = "fetch-context";
      }

      setFormData({
        label: (node.data.label as string) || "",
        description: (node.data.description as string) || "",
        node_type: nodeType,
        condition: node.data.condition as string,
        scheduled_at: node.data.scheduled_at as string,
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
        json_schema: node.data.json_schema as any[] || [],
        // Switch/Case fields
        switch_condition: node.data.switch_condition as string,
        default_case: node.data.default_case as boolean,
        cases: node.data.cases as Array<{ case_condition: string; case_label?: string }> || [],
        // Tool Call fields
        tool_id: node.data.tool_id as string,
        tool_name: node.data.tool_name as string,
        tool_type: node.data.tool_type as string,
        input_parameters: node.data.input_parameters as Record<string, unknown> || {},
        // Context fields
        context_data: node.data.context_data as string,
        use_llm: node.data.use_llm as boolean,
      });
    }
  }, [node]);

  // Real-time validation when form data changes
  useEffect(() => {
    if (formData.label || formData.node_type) {
      const errors = validateNodeFormData(formData.node_type, formData as unknown as Record<string, unknown>);
      setValidationErrors(errors);

      // Convert validation errors to field errors for display
      const newFieldErrors: Record<string, string> = {};
      errors.forEach(error => {
        newFieldErrors[error.field] = error.message;
      });
      setFieldErrors(newFieldErrors);
    }
  }, [formData]);

  // Don't render the modal if it's not open or no node is selected
  if (!isOpen || !node) {
    return null;
  }



  // Handle save action
  const handleSave = () => {
    // Validate before saving
    const errors = validateNodeFormData(formData.node_type, formData as unknown as Record<string, unknown>);
    if (errors.length > 0) {
      setValidationErrors(errors);
      const newFieldErrors: Record<string, string> = {};
      errors.forEach(error => {
        newFieldErrors[error.field] = error.message;
      });
      setFieldErrors(newFieldErrors);
      return; // Don't save if there are validation errors
    }

    onSave(node!.id, formData as unknown as Record<string, unknown>);
    onClose(); // Close modal on successful save
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
              invalid={!!fieldErrors.label}
            />
            {fieldErrors.label && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.label}</div>
            )}
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
                  invalid={!!fieldErrors.condition}
                />
                {fieldErrors.condition && (
                  <div className="mt-1 text-sm text-red-600">{fieldErrors.condition}</div>
                )}
              </Field>
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> Describe the condition in natural language. The workflow will follow the True or False path based on this condition.
              </div>
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
                  invalid={!!fieldErrors.prompt_template}
                />
                {fieldErrors.prompt_template && (
                  <div className="mt-1 text-sm text-red-600">{fieldErrors.prompt_template}</div>
                )}
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
                  {fieldErrors.json_schema && (
                    <div className="text-sm text-red-600 mb-2">{fieldErrors.json_schema}</div>
                  )}
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
                <Label htmlFor="switch_condition">Switch Condition:</Label>
                <Textarea
                  id="switch_condition"
                  name="switch_condition"
                  value={formData.switch_condition || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    switch_condition: e.target.value
                  })}
                  placeholder="Describe what to evaluate (e.g., 'the user's subscription status', 'the API response code', 'the order total amount')"
                  className="h-20"
                  invalid={!!fieldErrors.switch_condition}
                />
                {fieldErrors.switch_condition && (
                  <div className="mt-1 text-sm text-red-600">{fieldErrors.switch_condition}</div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  Describe in natural language what condition should be evaluated for the switch
                </div>
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
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Case Definitions</h5>
                  <Button
                    type="button"
                    onClick={() => {
                      const newCases = [...(formData.cases || [])];
                      newCases.push({
                        case_condition: '',
                        case_label: `Case ${newCases.length + 1}`
                      });
                      setFormData({ ...formData, cases: newCases });
                    }}
                    className="text-xs px-2 py-1"
                  >
                    Add Case
                  </Button>
                </div>
                <div className="space-y-6 max-h-64 overflow-y-auto">
                  {(formData.cases || []).map((caseData, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-sm text-gray-700">Case {index + 1}</div>
                        <Button
                          type="button"
                          onClick={() => {
                            const newCases = [...(formData.cases || [])];
                            newCases.splice(index, 1);
                            setFormData({ ...formData, cases: newCases });
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Case Condition:
                          </label>
                          <Textarea
                            value={caseData.case_condition}
                            onChange={(e) => {
                              const newCases = [...(formData.cases || [])];
                              newCases[index] = {
                                ...newCases[index],
                                case_condition: e.target.value
                              };
                              setFormData({ ...formData, cases: newCases });
                            }}
                            placeholder="Describe when this case should match (e.g., 'user is premium subscriber', 'response indicates success', 'amount is greater than $100')"
                            className="text-sm h-16"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Case Label (optional):
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
                            placeholder="Premium User, Success, High Value, etc."
                            className="text-sm"
                          />
                        </div>
                      </div>
                      {index < (formData.cases || []).length - 1 && (
                        <div className="mt-6 border-b border-gray-100"></div>
                      )}
                    </div>
                  ))}
                  {(!formData.cases || formData.cases.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No cases defined. Click "Add Case" to create your first case.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tool Call Configuration */}
          {formData.node_type === "tool-call" && (
            <div className="space-y-4">
              <h4 className="font-medium">Tool Call Configuration</h4>
              <div className={fieldErrors.tool_id ? "border border-red-300 rounded-md p-3 bg-red-50" : ""}>
                <ToolSelector
                  selectedToolId={formData.tool_id}
                  onToolSelect={(tool: AiTool | null) => {
                    setFormData({
                      ...formData,
                      tool_id: tool?.id || "",
                      tool_name: tool?.name || "",
                      tool_type: tool?.tool_type || "",
                    });
                  }}
                  onParametersChange={(parameters: Record<string, unknown>) => {
                    setFormData({
                      ...formData,
                      input_parameters: parameters,
                    });
                  }}
                  inputParameters={formData.input_parameters}
                />
                {fieldErrors.tool_id && (
                  <div className="mt-2 text-sm text-red-600 font-medium">{fieldErrors.tool_id}</div>
                )}
              </div>
            </div>
          )}

          {/* Store Context Configuration */}
          {formData.node_type === "store-context" && (
            <div className="space-y-4">
              <h4 className="font-medium">Store Context Configuration</h4>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.use_llm === true}
                    onChange={(e) => setFormData({
                      ...formData,
                      use_llm: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium text-gray-700">Use LLM for dynamic context</span>
                </label>
              </div>

              {!formData.use_llm && (
                <Field>
                  <Label htmlFor="context_data">Context Data:</Label>
                  <Textarea
                    id="context_data"
                    name="context_data"
                    value={formData.context_data || ""}
                    onChange={(e) => setFormData({ ...formData, context_data: e.target.value })}
                    placeholder="Enter the data to store in context..."
                    className="h-24"
                  />
                </Field>
              )}

              {formData.use_llm && (
                <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                  <strong>LLM Mode:</strong> Context will be determined dynamically using LLM with static/dynamic parameters during workflow execution.
                </div>
              )}
            </div>
          )}

          {/* Fetch Context Configuration */}
          {formData.node_type === "fetch-context" && (
            <div className="space-y-4">
              <h4 className="font-medium">Fetch Context Configuration</h4>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.use_llm === true}
                    onChange={(e) => setFormData({
                      ...formData,
                      use_llm: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium text-gray-700">Use LLM for dynamic context</span>
                </label>
              </div>

              {!formData.use_llm && (
                <Field>
                  <Label htmlFor="context_data">Context Query:</Label>
                  <Textarea
                    id="context_data"
                    name="context_data"
                    value={formData.context_data || ""}
                    onChange={(e) => setFormData({ ...formData, context_data: e.target.value })}
                    placeholder="Enter query or filter for fetching context..."
                    className="h-24"
                  />
                </Field>
              )}

              {formData.use_llm && (
                <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
                  <strong>LLM Mode:</strong> Context will be fetched dynamically using LLM with static/dynamic parameters during workflow execution.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogBody>

      <DialogActions>
        {/* Validation Summary */}
        {validationErrors.length > 0 && (
          <div className="flex-1 mr-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''}
                </span>
              </div>
              <ul className="text-xs text-red-700 space-y-1">
                {validationErrors.slice(0, 3).map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li>• ... and {validationErrors.length - 3} more</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={validationErrors.length > 0}
            className={validationErrors.length > 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            Save
          </Button>
          <Button plain onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default NodeEditModal;
