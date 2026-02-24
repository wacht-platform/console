import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
    PlusIcon,
    TrashIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Divider } from "@/components/ui/divider";
import {
    useWebhookEventCatalogs,
    useCreateWebhookEventCatalog,
    useUpdateWebhookEventCatalog,
} from "@/lib/api/hooks/use-webhook-event-catalogs";
import type { WebhookEventDefinition } from "@/types/webhook-catalog";
import { toast } from "sonner";

type SchemaFieldType =
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "object"
    | "array";

type SchemaFieldForm = {
    id: string;
    name: string;
    type: SchemaFieldType;
    required: boolean;
    description: string;
    example: string;
};

type EventForm = {
    id: string;
    name: string;
    description: string;
    group: string;
    fields: SchemaFieldForm[];
    isExpanded: boolean;
};

const FIELD_TYPES: Array<{ label: string; value: SchemaFieldType }> = [
    { label: "String", value: "string" },
    { label: "Number", value: "number" },
    { label: "Integer", value: "integer" },
    { label: "Boolean", value: "boolean" },
    { label: "Object", value: "object" },
    { label: "Array", value: "array" },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultField = (): SchemaFieldForm => ({
    id: generateId(),
    name: "",
    type: "string",
    required: false,
    description: "",
    example: "",
});

const createDefaultEvent = (expanded = false): EventForm => ({
    id: generateId(),
    name: "",
    description: "",
    group: "",
    fields: [createDefaultField()],
    isExpanded: expanded,
});

const normalizeFieldType = (value: unknown): SchemaFieldType => {
    if (
        ["string", "number", "integer", "boolean", "object", "array"].includes(
            value as string,
        )
    ) {
        return value as SchemaFieldType;
    }
    return "string";
};

const stringifyExample = (value: unknown, type: SchemaFieldType): string => {
    if (value === undefined || value === null) return "";
    if (type === "object" || type === "array") {
        try {
            return JSON.stringify(value);
        } catch {
            return "";
        }
    }
    return typeof value === "string" ? value : String(value);
};

const parseExample = (
    rawValue: string,
    type: SchemaFieldType,
    eventName: string,
    fieldName: string,
): unknown => {
    const trimmed = rawValue.trim();
    if (!trimmed) return undefined;

    switch (type) {
        case "string":
            return trimmed;
        case "number": {
            const parsed = Number(trimmed);
            if (!Number.isFinite(parsed))
                throw new Error(
                    `Event "${eventName}", field "${fieldName}": example must be a number`,
                );
            return parsed;
        }
        case "integer": {
            const parsed = Number(trimmed);
            if (!Number.isInteger(parsed))
                throw new Error(
                    `Event "${eventName}", field "${fieldName}": example must be an integer`,
                );
            return parsed;
        }
        case "boolean": {
            if (trimmed === "true") return true;
            if (trimmed === "false") return false;
            throw new Error(
                `Event "${eventName}", field "${fieldName}": example must be true or false`,
            );
        }
        case "object": {
            const parsed = JSON.parse(trimmed);
            if (
                !parsed ||
                typeof parsed !== "object" ||
                Array.isArray(parsed)
            ) {
                throw new Error(
                    `Event "${eventName}", field "${fieldName}": example must be a JSON object`,
                );
            }
            return parsed;
        }
        case "array": {
            const parsed = JSON.parse(trimmed);
            if (!Array.isArray(parsed))
                throw new Error(
                    `Event "${eventName}", field "${fieldName}": example must be a JSON array`,
                );
            return parsed;
        }
        default:
            return trimmed;
    }
};

const toEventForm = (event: WebhookEventDefinition): EventForm => {
    const schema = (event.schema ?? {}) as Record<string, unknown>;
    const properties = (schema.properties ?? {}) as Record<
        string,
        Record<string, unknown>
    >;
    const requiredList = Array.isArray(schema.required)
        ? (schema.required as string[])
        : [];
    const requiredSet = new Set(requiredList);
    const examplePayload =
        event.example_payload && typeof event.example_payload === "object"
            ? (event.example_payload as Record<string, unknown>)
            : {};

    const mappedFields = Object.entries(properties).map(([key, def]) => {
        const fieldType = normalizeFieldType(def?.type);
        return {
            id: generateId(),
            name: key,
            type: fieldType,
            required: requiredSet.has(key),
            description: String(def?.description ?? ""),
            example: stringifyExample(examplePayload[key], fieldType),
        } satisfies SchemaFieldForm;
    });

    return {
        id: generateId(),
        name: event.name ?? "",
        description: event.description ?? "",
        group: event.group ?? "",
        fields: mappedFields.length > 0 ? mappedFields : [createDefaultField()],
        isExpanded: false,
    };
};

const parseEvents = (events: EventForm[]): WebhookEventDefinition[] => {
    return events.map((item) => {
        const eventName = item.name.trim() || "Untitled Event";
        const namedFields = item.fields.filter(
            (field) => field.name.trim().length > 0,
        );
        const required: string[] = [];
        const properties: Record<string, Record<string, unknown>> = {};
        const examplePayload: Record<string, unknown> = {};
        const duplicateCheck = new Set<string>();

        namedFields.forEach((field) => {
            const fieldName = field.name.trim();
            if (duplicateCheck.has(fieldName)) {
                throw new Error(
                    `Event "${eventName}": duplicate schema field name "${fieldName}"`,
                );
            }
            duplicateCheck.add(fieldName);

            const definition: Record<string, unknown> = { type: field.type };
            if (field.description.trim())
                definition.description = field.description.trim();
            properties[fieldName] = definition;
            if (field.required) required.push(fieldName);

            const parsedExample = parseExample(
                field.example,
                field.type,
                eventName,
                fieldName,
            );
            if (parsedExample !== undefined)
                examplePayload[fieldName] = parsedExample;
        });

        const schema: Record<string, unknown> = { type: "object", properties };
        if (required.length > 0) schema.required = required;

        return {
            name: item.name.trim(),
            description: item.description.trim(),
            group: item.group.trim() || undefined,
            schema,
            example_payload: examplePayload,
        } satisfies WebhookEventDefinition;
    });
};

export default function CatalogEditorPage() {
    const { catalogSlug } = useParams<{ catalogSlug?: string }>();
    const navigate = useNavigate();
    const isEditMode = !!catalogSlug;

    const { data: catalogs, isLoading: catalogsLoading } =
        useWebhookEventCatalogs();
    const createCatalog = useCreateWebhookEventCatalog();
    const updateCatalog = useUpdateWebhookEventCatalog();

    const [slug, setSlug] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [events, setEvents] = useState<EventForm[]>([
        createDefaultEvent(true),
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const existingCatalog = useMemo(() => {
        if (!catalogSlug || !catalogs) return null;
        return catalogs.find((c) => c.slug === catalogSlug) ?? null;
    }, [catalogSlug, catalogs]);

    const isLoading = isEditMode && catalogsLoading;

    useEffect(() => {
        if (existingCatalog) {
            setSlug(existingCatalog.slug);
            setName(existingCatalog.name);
            setDescription(existingCatalog.description || "");
            const mapped =
                (existingCatalog.events ?? []).length > 0
                    ? existingCatalog.events!.map(toEventForm)
                    : [createDefaultEvent(true)];
            setEvents(mapped);
        }
    }, [existingCatalog]);

    const handleBack = () => navigate(-1);

    const updateEvent = (eventId: string, patch: Partial<EventForm>) => {
        setEvents((current) =>
            current.map((evt) =>
                evt.id === eventId ? { ...evt, ...patch } : evt,
            ),
        );
    };

    const addEvent = () =>
        setEvents((current) => [...current, createDefaultEvent(true)]);

    const removeEvent = (eventId: string) => {
        setEvents((current) =>
            current.length === 1
                ? current
                : current.filter((evt) => evt.id !== eventId),
        );
    };

    const toggleEventExpanded = (eventId: string) => {
        setEvents((current) =>
            current.map((evt) =>
                evt.id === eventId
                    ? { ...evt, isExpanded: !evt.isExpanded }
                    : evt,
            ),
        );
    };

    const addField = (eventId: string) => {
        setEvents((current) =>
            current.map((evt) =>
                evt.id === eventId
                    ? { ...evt, fields: [...evt.fields, createDefaultField()] }
                    : evt,
            ),
        );
    };

    const updateField = (
        eventId: string,
        fieldId: string,
        patch: Partial<SchemaFieldForm>,
    ) => {
        setEvents((current) =>
            current.map((evt) => {
                if (evt.id !== eventId) return evt;
                return {
                    ...evt,
                    fields: evt.fields.map((f) =>
                        f.id === fieldId ? { ...f, ...patch } : f,
                    ),
                };
            }),
        );
    };

    const removeField = (eventId: string, fieldId: string) => {
        setEvents((current) =>
            current.map((evt) => {
                if (evt.id !== eventId) return evt;
                return evt.fields.length === 1
                    ? evt
                    : {
                          ...evt,
                          fields: evt.fields.filter((f) => f.id !== fieldId),
                      };
            }),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (!name.trim()) {
                toast.error("Catalog name is required");
                setIsSaving(false);
                return;
            }
            if (!isEditMode && !slug.trim()) {
                toast.error("Catalog slug is required");
                setIsSaving(false);
                return;
            }
            if (events.some((evt) => !evt.name.trim())) {
                toast.error("All events must have a name");
                setIsSaving(false);
                return;
            }

            const parsedEvents = parseEvents(events);

            if (isEditMode && existingCatalog) {
                await updateCatalog.mutateAsync({
                    slug: existingCatalog.slug,
                    request: {
                        name: name.trim(),
                        description: description.trim() || undefined,
                        events: parsedEvents,
                    },
                });
                toast.success("Catalog updated successfully");
            } else {
                await createCatalog.mutateAsync({
                    slug: slug.trim(),
                    name: name.trim(),
                    description: description.trim() || undefined,
                    events: parsedEvents,
                });
                toast.success("Catalog created successfully");
            }
            navigate(-1);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to save catalog",
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <InlineLoader />;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-normal tracking-tight">
                        {isEditMode
                            ? "Edit Event Catalog"
                            : "Create Event Catalog"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isEditMode
                            ? "Update your event catalog and its events."
                            : "Define a new event catalog with its events and schema."}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="catalog-form"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? isEditMode
                                ? "Saving..."
                                : "Creating..."
                            : isEditMode
                              ? "Save Changes"
                              : "Create Catalog"}
                    </Button>
                </div>
            </div>

            <form
                id="catalog-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-8"
            >
                {/* Catalog Details */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Catalog Details
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                placeholder="user-events"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isEditMode}
                                required={!isEditMode}
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier. Cannot be changed after
                                creation.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="User Lifecycle Events"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            placeholder="Describe what this catalog is for..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </section>

                <Divider />

                {/* Events */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Events
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Define the events that belong to this catalog.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addEvent}
                        >
                            <PlusIcon className="mr-1.5 h-4 w-4" /> Add Event
                        </Button>
                    </div>

                    <div className="space-y-1">
                        {events.map((event) => (
                            <Collapsible
                                key={event.id}
                                open={event.isExpanded}
                                onOpenChange={() =>
                                    toggleEventExpanded(event.id)
                                }
                            >
                                <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <ChevronDownIcon
                                            className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${event.isExpanded ? "rotate-180" : ""}`}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {event.name.trim() ||
                                                    "Untitled Event"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {event.group.trim()
                                                    ? `Group: ${event.group}`
                                                    : event.description.trim() ||
                                                      "No description"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {event.fields.length} field
                                            {event.fields.length !== 1
                                                ? "s"
                                                : ""}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeEvent(event.id);
                                            }}
                                            disabled={events.length === 1}
                                        >
                                            <TrashIcon className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="pb-4 pt-2 space-y-4">
                                        {/* Event Info */}
                                        <div className="grid gap-4 lg:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Event Name</Label>
                                                <Input
                                                    value={event.name}
                                                    onChange={(e) =>
                                                        updateEvent(event.id, {
                                                            name: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="user.created"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Group</Label>
                                                <Input
                                                    value={event.group}
                                                    onChange={(e) =>
                                                        updateEvent(event.id, {
                                                            group: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="user"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Input
                                                    value={event.description}
                                                    onChange={(e) =>
                                                        updateEvent(event.id, {
                                                            description:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Emitted when a user is created"
                                                />
                                            </div>
                                        </div>

                                        {/* Schema Fields */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">
                                                    Schema Fields
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        addField(event.id)
                                                    }
                                                >
                                                    <PlusIcon className="mr-1 h-3 w-3" />{" "}
                                                    Add Field
                                                </Button>
                                            </div>

                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-muted/50 border-b">
                                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                                                                Field Name
                                                            </th>
                                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground w-28">
                                                                Type
                                                            </th>
                                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                                                                Description
                                                            </th>
                                                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                                                                Example
                                                            </th>
                                                            <th className="text-center py-2 px-3 font-medium text-muted-foreground w-16">
                                                                Req
                                                            </th>
                                                            <th className="w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {event.fields.map(
                                                            (field) => (
                                                                <tr
                                                                    key={
                                                                        field.id
                                                                    }
                                                                    className="border-b last:border-b-0"
                                                                >
                                                                    <td className="py-2 px-3">
                                                                        <Input
                                                                            className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                                                            value={
                                                                                field.name
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateField(
                                                                                    event.id,
                                                                                    field.id,
                                                                                    {
                                                                                        name: e
                                                                                            .target
                                                                                            .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            placeholder="field_name"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-3">
                                                                        <Select
                                                                            value={
                                                                                field.type
                                                                            }
                                                                            onValueChange={(
                                                                                value: SchemaFieldType,
                                                                            ) =>
                                                                                updateField(
                                                                                    event.id,
                                                                                    field.id,
                                                                                    {
                                                                                        type: value,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="h-8 text-sm border-0 bg-transparent shadow-none">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {FIELD_TYPES.map(
                                                                                    (
                                                                                        item,
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                item.value
                                                                                            }
                                                                                            value={
                                                                                                item.value
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </SelectItem>
                                                                                    ),
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </td>
                                                                    <td className="py-2 px-3">
                                                                        <Input
                                                                            className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                                                            value={
                                                                                field.description
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateField(
                                                                                    event.id,
                                                                                    field.id,
                                                                                    {
                                                                                        description:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            placeholder="Description..."
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-3">
                                                                        <Input
                                                                            className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 font-mono text-xs"
                                                                            value={
                                                                                field.example
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateField(
                                                                                    event.id,
                                                                                    field.id,
                                                                                    {
                                                                                        example:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            placeholder="example"
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center">
                                                                        <Checkbox
                                                                            checked={
                                                                                field.required
                                                                            }
                                                                            onCheckedChange={(
                                                                                checked,
                                                                            ) =>
                                                                                updateField(
                                                                                    event.id,
                                                                                    field.id,
                                                                                    {
                                                                                        required:
                                                                                            checked ===
                                                                                            true,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="py-2 px-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() =>
                                                                                removeField(
                                                                                    event.id,
                                                                                    field.id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                event
                                                                                    .fields
                                                                                    .length ===
                                                                                1
                                                                            }
                                                                        >
                                                                            <TrashIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                </section>
            </form>
        </div>
    );
}
