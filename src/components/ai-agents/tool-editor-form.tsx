import React, { useState, useEffect } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CodeEditor } from "@/components/code-editor";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useCreateTool, useUpdateTool } from "../../lib/api/hooks/use-tools";
import type {
    AiTool,
    AiToolType,
    ToolFormData,
    ApiToolConfiguration,
    CodeRunnerEnvVariable,
    PlatformEventToolConfiguration,
    CodeRunnerToolConfiguration,
    HttpMethod,
    CreateToolRequest,
    UpdateToolRequest,
    SchemaField,
} from "../../types/ai-tool";
import { toast } from "sonner";

interface ToolEditorFormProps {
    tool?: AiTool;
    onSaved?: (tool: AiTool) => void;
    header?: React.ReactNode;
    className?: string;
    formId?: string;
}

const FIELD_TYPE_OPTIONS = [
    { label: "String", value: "STRING" },
    { label: "Integer", value: "INTEGER" },
    { label: "Number", value: "NUMBER" },
    { label: "Boolean", value: "BOOLEAN" },
    { label: "Object", value: "OBJECT" },
    { label: "Array", value: "ARRAY" },
] as const;

function createEmptySchemaField(): SchemaField {
    return {
        name: "",
        field_type: "STRING",
        required: true,
        description: "",
        items_type: undefined,
        items_schema: undefined,
        properties: undefined,
    };
}

function normalizeFieldType(value: string | undefined): string {
    const normalized = (value || "STRING").toUpperCase();
    return FIELD_TYPE_OPTIONS.some((option) => option.value === normalized)
        ? normalized
        : "STRING";
}

function normalizeSchemaField(field: SchemaField): SchemaField {
    return {
        name: field.name || "",
        field_type: normalizeFieldType(field.field_type),
        required: field.required ?? false,
        description: field.description || "",
        items_type: field.items_type
            ? normalizeFieldType(field.items_type)
            : undefined,
        items_schema: field.items_schema
            ? normalizeSchemaField(field.items_schema)
            : undefined,
        properties: field.properties?.map(normalizeSchemaField),
    };
}

function normalizeSchemaFields(fields?: SchemaField[]): SchemaField[] {
    return (fields || []).map(normalizeSchemaField);
}

function normalizeOptionalText(value?: string): string | undefined {
    const normalized = (value || "").trim();
    return normalized ? normalized : undefined;
}

function normalizeCodeRunnerEnvVariables(
    variables?: CodeRunnerEnvVariable[],
): CodeRunnerEnvVariable[] {
    return (variables || []).map((variable) => ({
        name: variable.name || "",
        value: variable.value || "",
    }));
}

function isValidCodeRunnerEnvName(name: string): boolean {
    return /^[_A-Za-z][_A-Za-z0-9]*$/.test(name);
}

function withFieldType(field: SchemaField, nextType: string): SchemaField {
    const normalizedType = normalizeFieldType(nextType);
    if (normalizedType === "ARRAY") {
        const itemType = normalizeFieldType(field.items_type || "STRING");
        return {
            ...field,
            field_type: normalizedType,
            properties: undefined,
            items_type: itemType,
            items_schema:
                itemType === "OBJECT" || itemType === "ARRAY"
                    ? normalizeSchemaField(
                          field.items_schema || {
                              ...createEmptySchemaField(),
                              name: "item",
                              field_type: itemType,
                              required: true,
                          },
                      )
                    : undefined,
        };
    }

    if (normalizedType === "OBJECT") {
        return {
            ...field,
            field_type: normalizedType,
            items_type: undefined,
            items_schema: undefined,
            properties: field.properties?.map(normalizeSchemaField) || [],
        };
    }

    return {
        ...field,
        field_type: normalizedType,
        items_type: undefined,
        items_schema: undefined,
        properties: undefined,
    };
}

function SchemaFieldEditor({
    field,
    onChange,
    onRemove,
    allowName = true,
    depth = 0,
}: {
    field: SchemaField;
    onChange: (field: SchemaField) => void;
    onRemove?: () => void;
    allowName?: boolean;
    depth?: number;
}) {
    const normalizedField = normalizeSchemaField(field);
    return (
        <div className={depth > 0 ? "border-l border-border/50 pl-3" : ""}>
            <div className="space-y-3 rounded-md py-1">
                {allowName ? (
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Input parameter name
                        </Label>
                        <Input
                            placeholder="Field name"
                            className="h-8 w-full"
                            value={normalizedField.name}
                            onChange={(e) =>
                                onChange({
                                    ...normalizedField,
                                    name: e.target.value,
                                })
                            }
                        />
                    </div>
                ) : (
                    <div className="h-8 px-1 flex items-center text-sm text-muted-foreground">
                        Array item
                    </div>
                )}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                        Description
                    </Label>
                    <Input
                        placeholder="Description"
                        className="h-8 w-full"
                        value={normalizedField.description || ""}
                        onChange={(e) =>
                            onChange({
                                ...normalizedField,
                                description: e.target.value,
                            })
                        }
                    />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Type
                        </Label>
                        <Select
                            value={normalizedField.field_type}
                            onValueChange={(value) =>
                                onChange(withFieldType(normalizedField, value))
                            }
                        >
                            <SelectTrigger className="h-8 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELD_TYPE_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 sm:shrink-0">
                        <Label className="text-xs text-muted-foreground">
                            Required
                        </Label>
                        <div className="flex h-8 items-center">
                            <Switch
                                checked={normalizedField.required}
                                onCheckedChange={(checked) =>
                                    onChange({
                                        ...normalizedField,
                                        required: checked,
                                    })
                                }
                            />
                        </div>
                    </div>
                    {onRemove ? (
                        <div className="space-y-1 sm:w-[36px] sm:shrink-0">
                            <Label className="text-xs text-muted-foreground">
                                Delete
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 justify-center px-0 text-muted-foreground hover:bg-transparent hover:text-destructive"
                                onClick={onRemove}
                                aria-label="Delete field"
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <div />
                    )}
                </div>

                {normalizedField.field_type === "OBJECT" && (
                    <SchemaFieldListEditor
                        title="Object properties"
                        fields={normalizedField.properties || []}
                        onChange={(properties) =>
                            onChange({ ...normalizedField, properties })
                        }
                        emptyMessage="No object properties defined"
                        depth={depth + 1}
                    />
                )}

                {normalizedField.field_type === "ARRAY" && (
                    <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">
                                Array item type
                            </Label>
                            <Select
                                value={normalizeFieldType(
                                    normalizedField.items_type || "STRING",
                                )}
                                onValueChange={(value) => {
                                    const itemType = normalizeFieldType(value);
                                    onChange({
                                        ...normalizedField,
                                        items_type: itemType,
                                        items_schema:
                                            itemType === "OBJECT" ||
                                            itemType === "ARRAY"
                                                ? normalizeSchemaField(
                                                      normalizedField.items_schema || {
                                                          ...createEmptySchemaField(),
                                                          name: "item",
                                                          field_type: itemType,
                                                          required: true,
                                                      },
                                                  )
                                                : undefined,
                                    });
                                }}
                            >
                                <SelectTrigger className="h-8 min-w-[180px] w-full max-w-full sm:w-[220px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPE_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(normalizedField.items_type === "OBJECT" ||
                            normalizedField.items_type === "ARRAY") && (
                            <SchemaFieldEditor
                                field={
                                    normalizedField.items_schema || {
                                        ...createEmptySchemaField(),
                                        name: "item",
                                        field_type: normalizeFieldType(
                                            normalizedField.items_type,
                                        ),
                                        required: true,
                                    }
                                }
                                onChange={(items_schema) =>
                                    onChange({
                                        ...normalizedField,
                                        items_schema,
                                    })
                                }
                                allowName={false}
                                depth={depth + 1}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SchemaFieldListEditor({
    title,
    fields,
    onChange,
    emptyMessage,
    depth = 0,
}: {
    title: string;
    fields: SchemaField[];
    onChange: (fields: SchemaField[]) => void;
    emptyMessage: string;
    depth?: number;
}) {
    return (
        <div className={`space-y-2 ${depth > 0 ? "pt-1" : ""}`}>
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{title}</Label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                        onChange([...fields, createEmptySchemaField()])
                    }
                >
                    <PlusIcon className="h-3 w-3 mr-1" /> Add
                </Button>
            </div>
            <div className="space-y-2">
                {fields.map((field, index) => (
                    <SchemaFieldEditor
                        key={index}
                        field={field}
                        depth={depth}
                        onChange={(updatedField) => {
                            const next = [...fields];
                            next[index] = updatedField;
                            onChange(next);
                        }}
                        onRemove={() =>
                            onChange(fields.filter((_, i) => i !== index))
                        }
                    />
                ))}
                {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground italic py-1">
                        {emptyMessage}
                    </p>
                )}
            </div>
        </div>
    );
}

function ConfigSubsection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-3 border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
            <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">{title}</h4>
                {description ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </div>
    );
}

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                {description ? (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </section>
    );
}

export function ToolEditorForm({
    tool,
    onSaved,
    header,
    className,
    formId = "tool-editor-form",
}: ToolEditorFormProps) {
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
    }, [
        formData.name,
        formData.type,
        formData.configuration,
        eventDataString,
        validationErrors.length,
    ]);

    useEffect(() => {
        if (tool) {
            setFormData({
                name: tool.name,
                description: tool.description || "",
                type: tool.tool_type,
                configuration: normalizeToolConfiguration(tool.configuration),
            });

            if (
                tool.tool_type === "platform_event" &&
                (tool.configuration as PlatformEventToolConfiguration)
                    .event_data
            ) {
                setEventDataString(
                    JSON.stringify(
                        (tool.configuration as PlatformEventToolConfiguration)
                            .event_data,
                        null,
                        2,
                    ),
                );
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
    }, [tool]);

    const validateForm = (): string[] => {
        const errors: string[] = [];

        if (!formData.name.trim()) {
            errors.push("Tool name is required");
        }

        if (formData.type === "api") {
            const apiConfig = formData.configuration as ApiToolConfiguration;
            const endpoint = apiConfig.endpoint
                .trim()
                .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
            if (!endpoint) {
                errors.push("API endpoint is required");
            } else {
                try {
                    const url = new URL(endpoint);
                    if (url.protocol !== "http:" && url.protocol !== "https:") {
                        errors.push(
                            "API endpoint must be a valid URL (http:// or https://)",
                        );
                    }
                } catch {
                    errors.push(
                        "API endpoint must be a valid URL (http:// or https://)",
                    );
                }
            }

            if (apiConfig.url_params_schema?.some((p) => !p.name.trim())) {
                errors.push("All URL parameters must have a name");
            }

            if (apiConfig.request_body_schema?.some((f) => !f.name.trim())) {
                errors.push("All request body fields must have a name");
            }
        } else if (formData.type === "platform_event") {
            const eventConfig =
                formData.configuration as PlatformEventToolConfiguration;
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
        } else if (formData.type === "code_runner") {
            const runnerConfig =
                formData.configuration as CodeRunnerToolConfiguration;
            if (!runnerConfig.code.trim()) {
                errors.push("Code is required");
            }

            const seenNames = new Set<string>();
            normalizeCodeRunnerEnvVariables(runnerConfig.env_variables).forEach(
                (variable) => {
                    const trimmedName = variable.name.trim();
                    if (!trimmedName) {
                        errors.push(
                            "All environment variables must have a name",
                        );
                        return;
                    }

                    if (!isValidCodeRunnerEnvName(trimmedName)) {
                        errors.push(
                            `Invalid environment variable name: ${trimmedName}`,
                        );
                        return;
                    }

                    if (seenNames.has(trimmedName)) {
                        errors.push(
                            `Duplicate environment variable name: ${trimmedName}`,
                        );
                        return;
                    }

                    seenNames.add(trimmedName);
                },
            );
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = validateForm();
        setValidationErrors(errors);
        if (errors.length > 0) return;

        try {
            const configuration = serializeToolConfiguration(
                formData.configuration,
                eventDataString,
            );
            const baseToolData = {
                name: formData.name.trim(),
                description: normalizeOptionalText(formData.description),
                configuration,
            };

            if (isEditing && tool) {
                const savedTool = await updateToolMutation.mutateAsync({
                    toolId: tool.id.toString(),
                    tool: {
                        ...baseToolData,
                        ...(tool.tool_type !== formData.type
                            ? { tool_type: formData.type }
                            : {}),
                    } as UpdateToolRequest,
                });
                onSaved?.(savedTool);
            } else {
                const savedTool = await createToolMutation.mutateAsync(
                    {
                        ...baseToolData,
                        tool_type: formData.type,
                    } as CreateToolRequest,
                );
                onSaved?.(savedTool);
            }
        } catch (error) {
            console.error("Failed to save tool:", error);
            toast.error(`Failed to ${isEditing ? "update" : "create"} tool`);
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
            case "code_runner":
                newConfiguration = {
                    type: "CodeRunner",
                    runtime: "python",
                    code: "def run(input):\n    return {}\n",
                    input_schema: [],
                    output_schema: [],
                    timeout_seconds: 30,
                    allow_network: false,
                    env_variables: [],
                } as CodeRunnerToolConfiguration;
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
                const apiConfig =
                    formData.configuration as ApiToolConfiguration;
                return (
                    <div className="space-y-5">
                        <ConfigSubsection
                            title="Endpoint"
                            description="Choose the HTTP method, target URL, and timeout."
                        >
                            <div className="grid gap-4 xl:grid-cols-[140px_minmax(0,1fr)_120px]">
                                <div className="space-y-2">
                                    <Label>Method</Label>
                                    <Select
                                        value={apiConfig.method}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                configuration: {
                                                    ...apiConfig,
                                                    method: value as HttpMethod,
                                                },
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "DELETE",
                                                "PATCH",
                                            ].map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Resource</Label>
                                    <Input
                                        className="w-full"
                                        placeholder="https://api.example.com/v1/resource"
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
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeout</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            className="w-full"
                                            value={apiConfig.timeout_seconds || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    configuration: {
                                                        ...apiConfig,
                                                        timeout_seconds:
                                                            parseInt(
                                                                e.target.value,
                                                            ) || undefined,
                                                    },
                                                })
                                            }
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            s
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </ConfigSubsection>

                        <ConfigSubsection
                            title="URL parameters"
                            description="Define path or query parameters the agent can provide."
                        >
                            <SchemaFieldListEditor
                                title="URL Parameters"
                                fields={normalizeSchemaFields(
                                    apiConfig.url_params_schema,
                                )}
                                onChange={(newFields) =>
                                    setFormData({
                                        ...formData,
                                        configuration: {
                                            ...apiConfig,
                                            url_params_schema: newFields,
                                        },
                                    })
                                }
                                emptyMessage="No URL parameters defined"
                            />
                        </ConfigSubsection>

                        <ConfigSubsection
                            title="Request body"
                            description="Define the JSON payload shape for this API tool."
                        >
                            <SchemaFieldListEditor
                                title="Request Body Fields"
                                fields={normalizeSchemaFields(
                                    apiConfig.request_body_schema,
                                )}
                                onChange={(newFields) =>
                                    setFormData({
                                        ...formData,
                                        configuration: {
                                            ...apiConfig,
                                            request_body_schema: newFields,
                                        },
                                    })
                                }
                                emptyMessage="No request body fields defined"
                            />
                        </ConfigSubsection>
                    </div>
                );
            }
            case "platform_event": {
                const eventConfig =
                    formData.configuration as PlatformEventToolConfiguration;
                return (
                    <div className="space-y-5">
                        <ConfigSubsection
                            title="Event label"
                            description="The event label the tool will emit."
                        >
                            <Input
                                placeholder="e.g. USER.CREATED"
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
                        </ConfigSubsection>
                        <ConfigSubsection
                            title="Event data"
                            description="Optional mock JSON payload for the event."
                        >
                            <Textarea
                                placeholder='{\n  "key": "value"\n}'
                                className="text-sm"
                                rows={6}
                                value={eventDataString}
                                onChange={(e) =>
                                    setEventDataString(e.target.value)
                                }
                            />
                        </ConfigSubsection>
                    </div>
                );
            }
            case "code_runner": {
                const runnerConfig =
                    formData.configuration as CodeRunnerToolConfiguration;
                return (
                    <div className="space-y-5">
                        <ConfigSubsection
                            title="Runtime"
                            description="Choose the runtime and execution limits."
                        >
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px]">
                                <div className="space-y-2">
                                    <Label>Runtime</Label>
                                    <Select
                                        value={runnerConfig.runtime || "python"}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                configuration: {
                                                    ...runnerConfig,
                                                    runtime: value as "python",
                                                },
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="python">
                                                Python
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Timeout</Label>
                                    <Input
                                        type="number"
                                        className="w-full"
                                        value={
                                            runnerConfig.timeout_seconds || ""
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                configuration: {
                                                    ...runnerConfig,
                                                    timeout_seconds:
                                                        parseInt(
                                                            e.target.value,
                                                        ) || undefined,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </ConfigSubsection>

                        <ConfigSubsection
                            title="Network access"
                            description="Keep this off unless the code genuinely needs outbound access."
                        >
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Allow outbound network access for this code
                                    runner.
                                </p>
                                <Switch
                                    id="code-runner-network"
                                    checked={runnerConfig.allow_network}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            configuration: {
                                                ...runnerConfig,
                                                allow_network: checked,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </ConfigSubsection>

                        <ConfigSubsection
                            title="Environment variables"
                            description="These values are encrypted at rest and injected into the execution environment for this tool."
                        >
                            <div className="space-y-3">
                                {normalizeCodeRunnerEnvVariables(
                                    runnerConfig.env_variables,
                                ).map((variable, index) => (
                                    <div
                                        key={index}
                                        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px]"
                                    >
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                placeholder="MY_ENV_VAR"
                                                value={variable.name}
                                                onChange={(e) => {
                                                    const nextVariables =
                                                        normalizeCodeRunnerEnvVariables(
                                                            runnerConfig.env_variables,
                                                        );
                                                    nextVariables[index] = {
                                                        ...variable,
                                                        name: e.target.value,
                                                    };
                                                    setFormData({
                                                        ...formData,
                                                        configuration: {
                                                            ...runnerConfig,
                                                            env_variables:
                                                                nextVariables,
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Value</Label>
                                            <Input
                                                placeholder="Value"
                                                value={variable.value}
                                                onChange={(e) => {
                                                    const nextVariables =
                                                        normalizeCodeRunnerEnvVariables(
                                                            runnerConfig.env_variables,
                                                        );
                                                    nextVariables[index] = {
                                                        ...variable,
                                                        value: e.target.value,
                                                    };
                                                    setFormData({
                                                        ...formData,
                                                        configuration: {
                                                            ...runnerConfig,
                                                            env_variables:
                                                                nextVariables,
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-10 w-10 justify-center px-0 text-muted-foreground hover:bg-transparent hover:text-destructive"
                                                onClick={() => {
                                                    const nextVariables =
                                                        normalizeCodeRunnerEnvVariables(
                                                            runnerConfig.env_variables,
                                                        ).filter(
                                                            (_, i) =>
                                                                i !== index,
                                                        );
                                                    setFormData({
                                                        ...formData,
                                                        configuration: {
                                                            ...runnerConfig,
                                                            env_variables:
                                                                nextVariables,
                                                        },
                                                    });
                                                }}
                                                aria-label="Delete environment variable"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-xs text-muted-foreground">
                                        Reserved runtime keys such as provider API
                                        keys are managed by the platform.
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                configuration: {
                                                    ...runnerConfig,
                                                    env_variables: [
                                                        ...normalizeCodeRunnerEnvVariables(
                                                            runnerConfig.env_variables,
                                                        ),
                                                        {
                                                            name: "",
                                                            value: "",
                                                        },
                                                    ],
                                                },
                                            })
                                        }
                                    >
                                        <PlusIcon className="mr-1 h-3 w-3" />
                                        Add variable
                                    </Button>
                                </div>
                            </div>
                        </ConfigSubsection>

                        <ConfigSubsection
                            title="Python code"
                            description="Define run(input) or async def run(input). Return JSON matching the output schema."
                        >
                            <CodeEditor
                                value={runnerConfig.code}
                                language="python"
                                minHeight={360}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        configuration: {
                                            ...runnerConfig,
                                            code: value || "",
                                        },
                                    })
                                }
                            />
                            <p className="text-xs leading-5 text-muted-foreground">
                                If your code returns structured output, define it in
                                <span className="font-medium text-foreground"> Output Parameters</span>.
                                The returned JSON must match that schema exactly.
                            </p>
                        </ConfigSubsection>

                        <ConfigSubsection
                            title="Schemas"
                            description="Define the exact input and output contract for the runner."
                        >
                            <div className="space-y-6">
                                <SchemaFieldListEditor
                                    title="Input Parameters"
                                    fields={normalizeSchemaFields(
                                        runnerConfig.input_schema,
                                    )}
                                    onChange={(newFields) =>
                                        setFormData({
                                            ...formData,
                                            configuration: {
                                                ...runnerConfig,
                                                input_schema: newFields,
                                            },
                                        })
                                    }
                                    emptyMessage="No input parameters"
                                />

                                <SchemaFieldListEditor
                                    title="Output Parameters"
                                    fields={normalizeSchemaFields(
                                        runnerConfig.output_schema,
                                    )}
                                    onChange={(newFields) =>
                                        setFormData({
                                            ...formData,
                                            configuration: {
                                                ...runnerConfig,
                                                output_schema: newFields,
                                            },
                                        })
                                    }
                                    emptyMessage="No output parameters"
                                />
                            </div>
                        </ConfigSubsection>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className={className}>
            {header}
            <form
                id={formId}
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <div className="grid min-h-0 flex-1 gap-10 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-6 border-b border-border/60 pb-8 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-8">
                        <FormSection
                            title="Tool details"
                            description="Define what the tool is called and how the agent should think about using it."
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tool Name</Label>
                                    <Input
                                        placeholder="e.g. Search Users"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Describe what this tool does..."
                                        className="min-h-[120px]"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tool Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={handleTypeChange}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="api">
                                                API Integration
                                            </SelectItem>
                                            <SelectItem value="platform_event">
                                                Platform Event
                                            </SelectItem>
                                            <SelectItem value="code_runner">
                                                Code Runner
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </FormSection>

                    </aside>

                    <main className="min-h-0 space-y-8 xl:pl-2">
                        <FormSection
                            title="Configuration"
                            description="Provide the type-specific settings and schemas the runtime will use."
                        >
                            {renderConfigurationFields()}
                        </FormSection>

                        {validationErrors.length > 0 && (
                            <section className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                                <ul className="list-disc pl-4 space-y-1">
                                    {validationErrors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </main>
                </div>
            </form>
        </div>
    );
}

function normalizeToolConfiguration(
    configuration: ToolFormData["configuration"],
): ToolFormData["configuration"] {
    switch (configuration.type) {
        case "Api":
            return {
                ...configuration,
                request_body_schema: normalizeSchemaFields(
                    configuration.request_body_schema,
                ),
                url_params_schema: normalizeSchemaFields(
                    configuration.url_params_schema,
                ),
            };
        case "CodeRunner":
            return {
                ...configuration,
                runtime: configuration.runtime === "python" ? "python" : "python",
                input_schema: normalizeSchemaFields(configuration.input_schema),
                output_schema: normalizeSchemaFields(
                    configuration.output_schema,
                ),
                env_variables: normalizeCodeRunnerEnvVariables(
                    configuration.env_variables,
                ),
            };
        default:
            return configuration;
    }
}

function serializeToolConfiguration(
    configuration: ToolFormData["configuration"],
    eventDataString: string,
): ToolFormData["configuration"] {
    switch (configuration.type) {
        case "Api":
            return {
                ...configuration,
                endpoint: configuration.endpoint.trim(),
                method: configuration.method || "GET",
                request_body_schema: normalizeSchemaFields(
                    configuration.request_body_schema,
                ),
                url_params_schema: normalizeSchemaFields(
                    configuration.url_params_schema,
                ),
                timeout_seconds: configuration.timeout_seconds || undefined,
            };
        case "PlatformEvent":
            return {
                ...configuration,
                event_label: configuration.event_label.trim(),
                event_data: eventDataString.trim()
                    ? JSON.parse(eventDataString)
                    : configuration.event_data,
            };
        case "CodeRunner":
            return {
                ...configuration,
                runtime: configuration.runtime || "python",
                input_schema: normalizeSchemaFields(configuration.input_schema),
                output_schema: normalizeSchemaFields(
                    configuration.output_schema,
                ),
                env_variables: normalizeCodeRunnerEnvVariables(
                    configuration.env_variables,
                ).map((variable) => ({
                    name: variable.name.trim(),
                    value: variable.value,
                })),
                timeout_seconds: configuration.timeout_seconds || undefined,
                allow_network: !!configuration.allow_network,
            };
        default:
            return configuration;
    }
}
