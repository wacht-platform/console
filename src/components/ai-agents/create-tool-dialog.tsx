import React, { useState, useEffect } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { useCreateTool, useUpdateTool } from "../../lib/api/hooks/use-tools";
import type {
  AiTool,
  AiToolType,
  ToolFormData,
  ApiToolConfiguration,
  PlatformEventToolConfiguration,
  PlatformFunctionToolConfiguration,
  HttpMethod,
  CreateToolRequest,
  UpdateToolRequest,
  SchemaField,
} from "../../types/ai-tool";
import { toast } from 'sonner';

interface CreateToolDialogProps {
  open: boolean;
  onClose: () => void;
  tool?: AiTool;
}

export function CreateToolDialog({
  open,
  onClose,
  tool,
}: CreateToolDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createToolMutation = useCreateTool();
  const updateToolMutation = useUpdateTool();

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

  const [eventDataString, setEventDataString] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isEditing = !!tool;

  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [formData.name, formData.type, formData.configuration, eventDataString]);

  useEffect(() => {
    if (!open) {
      setValidationErrors([]);
      setEventDataString("");
      return;
    }

    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description || "",
        type: tool.tool_type,
        configuration: tool.configuration,
      });

      if (tool.tool_type === "platform_event" && (tool.configuration as PlatformEventToolConfiguration).event_data) {
        setEventDataString(JSON.stringify((tool.configuration as PlatformEventToolConfiguration).event_data, null, 2));
      } else {
        setEventDataString("");
      }
    } else {
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
      setEventDataString("");
    }
    setValidationErrors([]);
  }, [tool, open]);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("Tool name is required");
    }

    if (formData.type === "api") {
      const apiConfig = formData.configuration as ApiToolConfiguration;
      const endpoint = apiConfig.endpoint.trim().replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
      if (!endpoint) {
        errors.push("API endpoint is required");
      } else {
        try {
          const url = new URL(endpoint);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            errors.push("API endpoint must be a valid URL (http:// or https://)");
          }
        } catch {
          errors.push("API endpoint must be a valid URL (http:// or https://)");
        }
      }

      if (apiConfig.url_params_schema?.some(p => !p.name.trim())) {
        errors.push("All URL parameters must have a name");
      }

      if (apiConfig.request_body_schema?.some(f => !f.name.trim())) {
        errors.push("All request body fields must have a name");
      }
    } else if (formData.type === "platform_event") {
      const eventConfig = formData.configuration as PlatformEventToolConfiguration;
      if (!eventConfig.event_label.trim()) {
        errors.push("Event label is required");
      }

      if (eventDataString.trim()) {
        try {
          JSON.parse(eventDataString);
        } catch (e) {
          errors.push("Event Data must be valid JSON");
        }
      }
    } else if (formData.type === "platform_function") {
      const functionConfig = formData.configuration as PlatformFunctionToolConfiguration;
      if (!functionConfig.function_name.trim()) {
        errors.push("Function name is required");
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    setIsSubmitting(true);

    try {
      const toolData = {
        name: formData.name,
        description: formData.description || undefined,
        tool_type: formData.type,
        configuration: formData.configuration,
      };

      if (formData.type === "platform_event" && eventDataString.trim()) {
        try {
          (toolData.configuration as PlatformEventToolConfiguration).event_data = JSON.parse(eventDataString);
        } catch (e) {
          // Should be caught by validation, but safe guard
        }
      }

      if (isEditing && tool) {
        await updateToolMutation.mutateAsync({
          toolId: tool.id.toString(),
          tool: toolData as UpdateToolRequest,
        });
        toast.success("Tool updated successfully!");
      } else {
        await createToolMutation.mutateAsync(toolData as CreateToolRequest);
        toast.success("Tool created successfully!");
      }
      onClose();
    } catch (error) {
      console.error("Failed to save tool:", error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} tool`);
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
      case "platform_event":
        newConfiguration = {
          type: "PlatformEvent",
          event_label: "",
          event_data: undefined,
        } as PlatformEventToolConfiguration;
        setEventDataString("");
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

  const renderSchemaBuilder = (
    title: string,
    fields: SchemaField[],
    onChange: (fields: SchemaField[]) => void,
    emptyMessage: string = "No fields defined"
  ) => (
    <div className="space-y-3 rounded-lg border border-dashed p-3 h-auto min-h-0 flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <Label className="text-sm font-medium">{title}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            onChange([...fields, { name: "", field_type: "string", required: true, description: "" }]);
          }}
        >
          <PlusIcon className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Name"
              className="h-8"
              value={field.name}
              onChange={(e) => {
                const newFields = [...fields];
                newFields[i].name = e.target.value;
                onChange(newFields);
              }}
            />
            <Select
              value={field.field_type}
              onValueChange={(value) => {
                const newFields = [...fields];
                newFields[i].field_type = value;
                onChange(newFields);
              }}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="object">Object</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={field.required}
                onCheckedChange={(checked) => {
                  const newFields = [...fields];
                  newFields[i].required = !!checked;
                  onChange(newFields);
                }}
                title="Required"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                onChange(fields.filter((_, idx) => idx !== i));
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-1">{emptyMessage}</p>
        )}
      </div>
    </div>
  );

  const renderConfigurationFields = () => {
    switch (formData.type) {
      case "api": {
        const apiConfig = formData.configuration as ApiToolConfiguration;
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>API Configuration</Label>
              <div className="flex gap-2">
                <Select
                  value={apiConfig.method}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    configuration: { ...apiConfig, method: value as HttpMethod }
                  })}
                >
                  <SelectTrigger className="w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogTitle className="sr-only">API Configuration</DialogTitle>
                <Input
                  className="flex-1"
                  placeholder="https://api.example.com/v1/resource"
                  value={apiConfig.endpoint}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...apiConfig, endpoint: e.target.value }
                  })}
                />
                <div className="flex items-center gap-2 bg-muted/30 px-2 rounded-md border text-sm shrink-0 h-10">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap mb-0">Timeout</Label>
                  <Input
                    type="number"
                    className="w-[60px] h-7 px-1 text-center"
                    value={apiConfig.timeout_seconds || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: { ...apiConfig, timeout_seconds: parseInt(e.target.value) || undefined }
                    })}
                  />
                  <span className="text-xs text-muted-foreground">s</span>
                </div>
              </div>
            </div>

            {renderSchemaBuilder(
              "URL Parameters",
              apiConfig.url_params_schema || [],
              (newFields) => setFormData({ ...formData, configuration: { ...apiConfig, url_params_schema: newFields } }),
              "No URL parameters defined"
            )}

            {renderSchemaBuilder(
              "Request Body Fields",
              apiConfig.request_body_schema || [],
              (newFields) => setFormData({ ...formData, configuration: { ...apiConfig, request_body_schema: newFields } }),
              "No request body fields defined"
            )}
          </div>
        );
      }
      case "platform_event": {
        const eventConfig = formData.configuration as PlatformEventToolConfiguration;
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Event Label</Label>
              <Input
                placeholder="e.g. USER.CREATED"
                value={eventConfig.event_label}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...eventConfig, event_label: e.target.value }
                })}
              />
              <p className="text-xs text-muted-foreground">The event label pattern to listen for.</p>
            </div>
            <div className="space-y-2">
              <Label>Event Data (Optional JSON)</Label>
              <Textarea
                placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                className="font-mono text-sm"
                rows={5}
                value={eventDataString}
                onChange={(e) => setEventDataString(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mock data structure for the event.</p>
            </div>
          </div>
        );
      }
      case "platform_function": {
        const funcConfig = formData.configuration as PlatformFunctionToolConfiguration;
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Function Name</Label>
              <Input
                placeholder="e.g. calculateUsers"
                value={funcConfig.function_name}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...funcConfig, function_name: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Function Description</Label>
              <Textarea
                placeholder="Describe what this function does..."
                value={funcConfig.function_description}
                onChange={(e) => setFormData({
                  ...formData,
                  configuration: { ...funcConfig, function_description: e.target.value }
                })}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderSchemaBuilder(
                "Input Parameters",
                funcConfig.input_schema || [],
                (newFields) => setFormData({ ...formData, configuration: { ...funcConfig, input_schema: newFields } }),
                "No input parameters"
              )}

              {renderSchemaBuilder(
                "Output Parameters",
                funcConfig.output_schema || [],
                (newFields) => setFormData({ ...formData, configuration: { ...funcConfig, output_schema: newFields } }),
                "No output parameters"
              )}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{isEditing ? "Edit Tool" : "Create Tool"}</DialogTitle>
          <DialogDescription>
            Configure a tool for your AI agents to use.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Tool Name</Label>
              <Input
                placeholder="e.g. Search Users"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this tool does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tool Type</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API Integration</SelectItem>
                  <SelectItem value="platform_event">Platform Event</SelectItem>
                  <SelectItem value="platform_function">Platform Function</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-4 text-sm text-muted-foreground uppercase tracking-wider">Configuration</h3>
            {renderConfigurationFields()}
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              <ul className="list-disc pl-4 space-y-1">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/40 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Tool" : "Create Tool")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
