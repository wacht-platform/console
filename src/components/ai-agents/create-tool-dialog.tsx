import React, { useState, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Field, Label } from "../ui/fieldset";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { useCreateTool, useUpdateTool } from "../../lib/api/hooks/use-tools";
import { useKnowledgeBases } from "../../lib/api/hooks/use-knowledge-bases";
import type {
  AiTool,
  AiToolType,
  ToolFormData,
  ApiToolConfiguration,
  KnowledgeBaseToolConfiguration,
  PlatformEventToolConfiguration,
  PlatformFunctionToolConfiguration,
  HttpMethod,
  CreateToolRequest,
  UpdateToolRequest,
} from "../../types/ai-tool";
import { toast } from 'sonner';

interface JwtTemplate {
  id: number;
  name: string;
}

interface CreateToolDialogProps {
  open: boolean;
  onClose: () => void;
  tool?: AiTool;
  jwtTemplates?: JwtTemplate[];
}

export function CreateToolDialog({
  open,
  onClose,
  tool,
  jwtTemplates = [],
}: CreateToolDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createToolMutation = useCreateTool();
  const updateToolMutation = useUpdateTool();
  const { data: knowledgeBasesData } = useKnowledgeBases();

  const [formData, setFormData] = useState<ToolFormData>({
    name: "",
    description: "",
    type: "api",
    configuration: {
      type: "Api",
      endpoint: "",
      method: "GET",
      authorization: undefined,
      request_body_schema: [],
      url_params_schema: [],
      timeout_seconds: 30,
    } as ApiToolConfiguration,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isEditing = !!tool;

  // Clear validation errors when form data changes
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [formData.name, formData.type, formData.configuration, validationErrors.length]);

  // Initialize form data when editing
  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description || "",
        type: tool.tool_type,
        configuration: tool.configuration,
      });
    } else {
      // Reset form for new tool
      setFormData({
        name: "",
        description: "",
        type: "api",
        configuration: {
          type: "Api",
          endpoint: "",
          method: "GET",
          authorization: undefined,
          request_body_schema: [],
          url_params_schema: [],
          timeout_seconds: 30,
        } as ApiToolConfiguration,
      });
    }
  }, [tool]);

  // Validation function
  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Basic validation
    if (!formData.name.trim()) {
      errors.push("Tool name is required");
    }

    // Type-specific validation
    if (formData.type === "api") {
      const apiConfig = formData.configuration as ApiToolConfiguration;
      if (!apiConfig.endpoint.trim()) {
        errors.push("API endpoint is required");
      }
      if (
        !apiConfig.endpoint.startsWith("http://") &&
        !apiConfig.endpoint.startsWith("https://")
      ) {
        errors.push("API endpoint must be a valid URL (http:// or https://)");
      }
    } else if (formData.type === "knowledge_base") {
      const kbConfig = formData.configuration as KnowledgeBaseToolConfiguration;
      if (!kbConfig.knowledge_base_ids || kbConfig.knowledge_base_ids.length === 0) {
        errors.push("At least one knowledge base must be selected");
      }
    } else if (formData.type === "platform_event") {
      const eventConfig =
        formData.configuration as PlatformEventToolConfiguration;
      if (!eventConfig.event_label.trim()) {
        errors.push("Event label is required");
      }
    } else if (formData.type === "platform_function") {
      const functionConfig =
        formData.configuration as PlatformFunctionToolConfiguration;
      if (!functionConfig.function_name.trim()) {
        errors.push("Function name is required");
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    if (errors.length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && tool) {
        const updateRequest: UpdateToolRequest = {
          name: formData.name,
          description: formData.description || undefined,
          tool_type: formData.type,
          configuration: formData.configuration,
        };
        await updateToolMutation.mutateAsync({
          toolId: tool.id.toString(),
          tool: updateRequest,
        });
        toast.success("Tool updated successfully!");
      } else {
        const createRequest: CreateToolRequest = {
          name: formData.name,
          description: formData.description || undefined,
          tool_type: formData.type,
          configuration: formData.configuration,
        };
        await createToolMutation.mutateAsync(createRequest);
        toast.success("Tool created successfully!");
      }
      onClose();
    } catch (error) {
      console.error("Failed to save tool:", error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} tool. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTypeChange = (newType: string) => {
    let newConfiguration;

    switch (newType) {
      case "api":
        newConfiguration = {
          type: "Api",
          endpoint: "",
          method: "GET",
          authorization: undefined,
          request_body_schema: [],
          url_params_schema: [],
          timeout_seconds: 30,
        } as ApiToolConfiguration;
        break;
      case "knowledge_base":
        newConfiguration = {
          type: "KnowledgeBase",
          knowledge_base_ids: [],
          search_settings: {
            max_results: 10,
            similarity_threshold: 0.7,
            include_metadata: true,
            sort_by_relevance: true,
          },
        } as KnowledgeBaseToolConfiguration;
        break;
      case "platform_event":
        newConfiguration = {
          type: "PlatformEvent",
          event_label: "",
          event_data: undefined,
        } as PlatformEventToolConfiguration;
        break;
      case "platform_function":
        newConfiguration = {
          type: "PlatformFunction",
          function_name: "",
          function_description: "",
          input_schema: [],
          output_schema: [],
          is_overridable: false,
        } as PlatformFunctionToolConfiguration;
        break;
      default:
        return;
    }

    setFormData({
      ...formData,
      type: newType as AiToolType,
      configuration: newConfiguration,
    });
  };

  const renderConfigurationFields = () => {
    switch (formData.type) {
      case "api": {
        const apiConfig = formData.configuration as ApiToolConfiguration;
        return (
          <div className="space-y-6">
            <Field>
              <Label>API Endpoint</Label>
              <Input
                placeholder="https://api.example.com/users/{userId}/posts"
                value={apiConfig.endpoint}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    configuration: {
                      ...apiConfig,
                      endpoint: e.target.value,
                    },
                  })
                }
              />
            </Field>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field>
                <Label>HTTP Method</Label>
                <Select
                  value={apiConfig.method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...apiConfig,
                        method: e.target.value as HttpMethod,
                      },
                    })
                  }
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </Select>
              </Field>
              <Field>
                <Label>Timeout (seconds)</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={apiConfig.timeout_seconds || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...apiConfig,
                        timeout_seconds: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </Field>
            </div>

            <div className="rounded-lg py-4 border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center justify-between px-4">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Authorize as user
                </label>
                <Switch
                  checked={apiConfig.authorization?.authorize_as_user || false}
                  onChange={(checked) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...apiConfig,
                        authorization: {
                          ...apiConfig.authorization,
                          authorize_as_user: checked,
                          jwt_template_id:
                            apiConfig.authorization?.jwt_template_id,
                          custom_headers:
                            apiConfig.authorization?.custom_headers || [],
                        },
                      },
                    })
                  }
                />
              </div>

              {apiConfig.authorization?.authorize_as_user && (
                <div className="px-4 pt-4">
                  <Field>
                    <Label>JWT Template</Label>
                    <Select
                      value={apiConfig.authorization?.jwt_template_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          configuration: {
                            ...apiConfig,
                            authorization: {
                              ...apiConfig.authorization!,
                              jwt_template_id: e.target.value || undefined,
                            },
                          },
                        })
                      }
                    >
                      <option value="">Select JWT Template</option>
                      {jwtTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            {/* Parameters - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* URL Parameters Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    URL & Query Parameters
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newParams = [
                        ...(apiConfig.url_params_schema || []),
                        { name: "", field_type: "string", required: true, description: "" },
                      ];
                      setFormData({
                        ...formData,
                        configuration: { ...apiConfig, url_params_schema: newParams },
                      });
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(apiConfig.url_params_schema || []).length === 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/20">
                      No URL parameters
                    </div>
                  )}
                  {(apiConfig.url_params_schema || []).map((param, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-1">
                      <Input
                        placeholder="name"
                        value={param.name}
                        onChange={(e) => {
                          const newParams = [...(apiConfig.url_params_schema || [])];
                          newParams[index] = { ...param, name: e.target.value };
                          setFormData({ ...formData, configuration: { ...apiConfig, url_params_schema: newParams } });
                        }}
                      />
                      <Select
                        value={param.field_type}
                        onChange={(e) => {
                          const newParams = [...(apiConfig.url_params_schema || [])];
                          newParams[index] = { ...param, field_type: e.target.value };
                          setFormData({ ...formData, configuration: { ...apiConfig, url_params_schema: newParams } });
                        }}
                      >
                        <option value="string">str</option>
                        <option value="number">num</option>
                        <option value="boolean">bool</option>
                      </Select>
                      <Switch
                        checked={param.required}
                        onChange={(checked) => {
                          const newParams = [...(apiConfig.url_params_schema || [])];
                          newParams[index] = { ...param, required: checked };
                          setFormData({ ...formData, configuration: { ...apiConfig, url_params_schema: newParams } });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newParams = (apiConfig.url_params_schema || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, configuration: { ...apiConfig, url_params_schema: newParams } });
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Body Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Request Body Schema
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newFields = [
                        ...(apiConfig.request_body_schema || []),
                        { name: "", field_type: "string", required: true, description: "" },
                      ];
                      setFormData({
                        ...formData,
                        configuration: { ...apiConfig, request_body_schema: newFields },
                      });
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(apiConfig.request_body_schema || []).length === 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/20">
                      No body fields
                    </div>
                  )}
                  {(apiConfig.request_body_schema || []).map((field, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-1">
                      <Input
                        placeholder="name"
                        value={field.name}
                        onChange={(e) => {
                          const newFields = [...(apiConfig.request_body_schema || [])];
                          newFields[index] = { ...field, name: e.target.value };
                          setFormData({ ...formData, configuration: { ...apiConfig, request_body_schema: newFields } });
                        }}
                      />
                      <Select
                        value={field.field_type}
                        onChange={(e) => {
                          const newFields = [...(apiConfig.request_body_schema || [])];
                          newFields[index] = { ...field, field_type: e.target.value };
                          setFormData({ ...formData, configuration: { ...apiConfig, request_body_schema: newFields } });
                        }}
                      >
                        <option value="string">str</option>
                        <option value="number">num</option>
                        <option value="boolean">bool</option>
                        <option value="array">arr</option>
                        <option value="object">obj</option>
                      </Select>
                      <Switch
                        checked={field.required}
                        onChange={(checked) => {
                          const newFields = [...(apiConfig.request_body_schema || [])];
                          newFields[index] = { ...field, required: checked };
                          setFormData({ ...formData, configuration: { ...apiConfig, request_body_schema: newFields } });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFields = (apiConfig.request_body_schema || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, configuration: { ...apiConfig, request_body_schema: newFields } });
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case "knowledge_base": {
        const kbConfig =
          formData.configuration as KnowledgeBaseToolConfiguration;
        const knowledgeBases = knowledgeBasesData?.data || [];
        const searchSettings = kbConfig.search_settings || {
          max_results: 10,
          similarity_threshold: 0.7,
          include_metadata: true,
          sort_by_relevance: true,
        };

        return (
          <div className="space-y-6">
            <Field>
              <Label>Knowledge Bases</Label>
              <div className="space-y-2">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Select one or more knowledge bases to search</div>
                <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50/50 dark:bg-zinc-800/30">
                  {knowledgeBases.length === 0 ? (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 py-3 text-center">No knowledge bases available</div>
                  ) : (
                    knowledgeBases.map((kb) => (
                      <div
                        key={kb.id}
                        className="flex items-center gap-3 py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-md cursor-pointer transition-colors"
                        onClick={() => {
                          const currentIds = kbConfig.knowledge_base_ids || [];
                          const kbId = kb.id.toString();
                          const newIds = currentIds.includes(kbId)
                            ? currentIds.filter(id => id !== kbId)
                            : [...currentIds, kbId];
                          setFormData({
                            ...formData,
                            configuration: {
                              ...kbConfig,
                              knowledge_base_ids: newIds,
                            },
                          });
                        }}
                      >
                        <Checkbox
                          color="indigo"
                          checked={(kbConfig.knowledge_base_ids || []).includes(kb.id.toString())}
                          onChange={() => { }}
                        />
                        <span className="text-sm text-zinc-900 dark:text-zinc-100">{kb.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label>Max Results</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={searchSettings.max_results || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...kbConfig,
                        search_settings: {
                          ...searchSettings,
                          max_results: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        },
                      },
                    })
                  }
                />
              </Field>
              <Field>
                <Label>Similarity Threshold</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  placeholder="0.7"
                  value={searchSettings.similarity_threshold || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...kbConfig,
                        search_settings: {
                          ...searchSettings,
                          similarity_threshold: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        },
                      },
                    })
                  }
                />
              </Field>
            </div>

            <div className="rounded-lg py-4 border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center justify-between px-4">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Include metadata
                </label>
                <Switch
                  checked={searchSettings.include_metadata}
                  onChange={(checked) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...kbConfig,
                        search_settings: {
                          ...searchSettings,
                          include_metadata: checked,
                        },
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between px-4 pt-4">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Sort by relevance
                </label>
                <Switch
                  checked={searchSettings.sort_by_relevance}
                  onChange={(checked) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...kbConfig,
                        search_settings: {
                          ...searchSettings,
                          sort_by_relevance: checked,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        );
      }
      case "platform_event": {
        const eventConfig =
          formData.configuration as PlatformEventToolConfiguration;
        return (
          <div className="space-y-4">
            <Field>
              <Label>Event Label</Label>
              <Input
                required
                placeholder="user_action"
                value={eventConfig.event_label}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    configuration: {
                      ...eventConfig,
                      event_label: e.target.value,
                    },
                  })
                }
              />
            </Field>

            <Field>
              <Label>Event Data (Optional JSON)</Label>
              <Textarea
                placeholder='{"key": "value"}'
                value={
                  eventConfig.event_data
                    ? JSON.stringify(eventConfig.event_data, null, 2)
                    : ""
                }
                onChange={(e) => {
                  try {
                    const parsed = e.target.value
                      ? JSON.parse(e.target.value)
                      : undefined;
                    setFormData({
                      ...formData,
                      configuration: {
                        ...eventConfig,
                        event_data: parsed,
                      },
                    });
                  } catch {
                    // Invalid JSON, keep the string value for now
                  }
                }}
              />
            </Field>
          </div>
        );
      }
      case "platform_function": {
        const functionConfig =
          formData.configuration as PlatformFunctionToolConfiguration;
        return (
          <div className="space-y-6">
            <Field>
              <Label>Function Name</Label>
              <Input
                required
                placeholder="calculate_score"
                value={functionConfig.function_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    configuration: {
                      ...functionConfig,
                      function_name: e.target.value,
                    },
                  })
                }
              />
            </Field>

            <Field>
              <Label>Function Description</Label>
              <Textarea
                placeholder="Describe what this function does"
                value={functionConfig.function_description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    configuration: {
                      ...functionConfig,
                      function_description: e.target.value,
                    },
                  })
                }
              />
            </Field>

            {/* Parameters - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input Parameters Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Input Parameters
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newParams = [
                        ...(functionConfig.input_schema || []),
                        { name: "", field_type: "string", required: true, description: "" },
                      ];
                      setFormData({
                        ...formData,
                        configuration: { ...functionConfig, input_schema: newParams },
                      });
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(functionConfig.input_schema || []).length === 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/20">
                      No input parameters
                    </div>
                  )}
                  {(functionConfig.input_schema || []).map((param, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-1">
                      <Input
                        placeholder="name"
                        value={param.name}
                        onChange={(e) => {
                          const newParams = [...(functionConfig.input_schema || [])];
                          newParams[index] = { ...param, name: e.target.value };
                          setFormData({ ...formData, configuration: { ...functionConfig, input_schema: newParams } });
                        }}
                      />
                      <Select
                        value={param.field_type}
                        onChange={(e) => {
                          const newParams = [...(functionConfig.input_schema || [])];
                          newParams[index] = { ...param, field_type: e.target.value };
                          setFormData({ ...formData, configuration: { ...functionConfig, input_schema: newParams } });
                        }}
                      >
                        <option value="string">str</option>
                        <option value="number">num</option>
                        <option value="boolean">bool</option>
                        <option value="array">arr</option>
                        <option value="object">obj</option>
                      </Select>
                      <Switch
                        checked={param.required}
                        onChange={(checked) => {
                          const newParams = [...(functionConfig.input_schema || [])];
                          newParams[index] = { ...param, required: checked };
                          setFormData({ ...formData, configuration: { ...functionConfig, input_schema: newParams } });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newParams = (functionConfig.input_schema || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, configuration: { ...functionConfig, input_schema: newParams } });
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Parameters Schema */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Output Parameters
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newParams = [
                        ...(functionConfig.output_schema || []),
                        { name: "", field_type: "string", required: true, description: "" },
                      ];
                      setFormData({
                        ...formData,
                        configuration: { ...functionConfig, output_schema: newParams },
                      });
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(functionConfig.output_schema || []).length === 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/20">
                      No output parameters
                    </div>
                  )}
                  {(functionConfig.output_schema || []).map((param, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-1">
                      <Input
                        placeholder="name"
                        value={param.name}
                        onChange={(e) => {
                          const newParams = [...(functionConfig.output_schema || [])];
                          newParams[index] = { ...param, name: e.target.value };
                          setFormData({ ...formData, configuration: { ...functionConfig, output_schema: newParams } });
                        }}
                      />
                      <Select
                        value={param.field_type}
                        onChange={(e) => {
                          const newParams = [...(functionConfig.output_schema || [])];
                          newParams[index] = { ...param, field_type: e.target.value };
                          setFormData({ ...formData, configuration: { ...functionConfig, output_schema: newParams } });
                        }}
                      >
                        <option value="string">str</option>
                        <option value="number">num</option>
                        <option value="boolean">bool</option>
                        <option value="array">arr</option>
                        <option value="object">obj</option>
                      </Select>
                      <Switch
                        checked={param.required}
                        onChange={(checked) => {
                          const newParams = [...(functionConfig.output_schema || [])];
                          newParams[index] = { ...param, required: checked };
                          setFormData({ ...formData, configuration: { ...functionConfig, output_schema: newParams } });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newParams = (functionConfig.output_schema || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, configuration: { ...functionConfig, output_schema: newParams } });
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };
  return (
    <Dialog open={open} onClose={onClose} size="5xl">
      <DialogTitle>{isEditing ? "Edit Tool" : "Create New Tool"}</DialogTitle>
      <DialogDescription>
        {isEditing
          ? "Update the tool configuration and settings."
          : "Create a new tool that can be used by AI agents and workflows."}
      </DialogDescription>

      <form onSubmit={handleSubmit}>
        <DialogBody>
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Field>
                <Label>Tool Name</Label>
                <Input
                  required
                  placeholder="Enter tool name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </Field>

              <Field>
                <Label>Tool Type</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => {
                    handleTypeChange(e.target.value);
                  }}
                >
                  <option value="api">REST API</option>
                  <option value="knowledge_base">Search Knowledge Base</option>
                  <option value="platform_event">Platform Event</option>
                  <option value="platform_function">Platform Function</option>
                </Select>
              </Field>
            </div>

            <Field>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this tool does"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Field>

            {renderConfigurationFields()}
          </div>
        </DialogBody>

        <DialogActions>
          <Button type="button" plain onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Tool"
                : "Create Tool"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
