import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
    PlusIcon,
    TrashIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/ui/section-label";
import { FieldRow, FieldCard } from "@/components/ui/field-row";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { InlineLoader } from "@/components/ui/loading-screen";
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
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    {isEditMode ? (
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Webhook catalog · {slug}
                        </p>
                    ) : null}
                    <h1 className="mt-1 text-xl font-medium tracking-tight text-foreground">
                        {isEditMode
                            ? "Edit event catalog"
                            : "Create event catalog"}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        A catalog groups related events into a schema your
                        subscribers can validate against.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                                ? "Saving…"
                                : "Creating…"
                            : isEditMode
                              ? "Save changes"
                              : "Create catalog"}
                    </Button>
                </div>
            </div>

            <form
                id="catalog-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-8"
            >
                <section className="space-y-3">
                    <SectionLabel>Catalog details</SectionLabel>
                    <FieldCard>
                        <FieldRow
                            label="Slug"
                            desc="Unique identifier used by subscribers. Cannot be changed after creation."
                        >
                            <Input
                                className="font-mono text-xs"
                                placeholder="user-events"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isEditMode}
                                required={!isEditMode}
                            />
                        </FieldRow>
                        <FieldRow
                            label="Name"
                            desc="Human-readable label shown in the dashboard."
                        >
                            <Input
                                placeholder="User Lifecycle Events"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </FieldRow>
                        <FieldRow
                            label="Description"
                            desc="Optional context for downstream developers."
                            align="start"
                        >
                            <Textarea
                                placeholder="Describe what this catalog is for…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </FieldRow>
                    </FieldCard>
                </section>

                <section className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-medium text-foreground">
                                Events
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Define the events that belong to this catalog.
                            </p>
                        </div>
                        <Button type="button" size="sm" onClick={addEvent}>
                            <PlusIcon className="h-4 w-4" />
                            Add event
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {events.map((event) => (
                            <div
                                key={event.id}
                                className="overflow-hidden rounded-lg border border-border bg-card"
                            >
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3",
                                        event.isExpanded &&
                                            "border-b border-border",
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleEventExpanded(event.id)
                                        }
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    >
                                        <ChevronDownIcon
                                            className={cn(
                                                "h-4 w-4 transition-transform",
                                                !event.isExpanded &&
                                                    "-rotate-90",
                                            )}
                                        />
                                    </button>
                                    <span className="truncate font-mono text-[13px] font-medium text-foreground">
                                        {event.name.trim() || "Untitled event"}
                                    </span>
                                    {event.group.trim() ? (
                                        <Tag>{event.group.trim()}</Tag>
                                    ) : null}
                                    {!event.isExpanded &&
                                    event.description.trim() ? (
                                        <span className="hidden truncate text-xs text-muted-foreground md:block">
                                            — {event.description.trim()}
                                        </span>
                                    ) : null}
                                    <div className="flex-1" />
                                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                                        {event.fields.length} field
                                        {event.fields.length === 1 ? "" : "s"}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeEvent(event.id)}
                                        disabled={events.length === 1}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>

                                {event.isExpanded ? (
                                    <div className="space-y-4 px-5 py-5">
                                        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-foreground">
                                                    Event name
                                                </label>
                                                <Input
                                                    className="font-mono text-xs"
                                                    value={event.name}
                                                    onChange={(e) =>
                                                        updateEvent(event.id, {
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    placeholder="user.created"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1.5 block text-xs font-medium text-foreground">
                                                    Group
                                                </label>
                                                <Input
                                                    className="font-mono text-xs"
                                                    value={event.group}
                                                    onChange={(e) =>
                                                        updateEvent(event.id, {
                                                            group: e.target.value,
                                                        })
                                                    }
                                                    placeholder="user"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-medium text-foreground">
                                                Description
                                            </label>
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

                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-xs font-medium text-foreground">
                                                    Schema fields
                                                </label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2.5 text-[11px]"
                                                    onClick={() =>
                                                        addField(event.id)
                                                    }
                                                >
                                                    <PlusIcon className="h-3 w-3" />
                                                    Add field
                                                </Button>
                                            </div>
                                            <div className="overflow-hidden rounded-lg border border-border">
                                                <div className="grid grid-cols-[1fr_120px_1fr_1fr_64px_36px] gap-x-2 border-b border-border bg-secondary px-3 py-2">
                                                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                                        Field
                                                    </span>
                                                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                                        Type
                                                    </span>
                                                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                                        Description
                                                    </span>
                                                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                                        Example
                                                    </span>
                                                    <span className="text-center font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                                                        Req'd
                                                    </span>
                                                    <span />
                                                </div>
                                                <div className="divide-y divide-border">
                                                    {event.fields.map((field) => (
                                                        <div
                                                            key={field.id}
                                                            className="grid grid-cols-[1fr_120px_1fr_1fr_64px_36px] items-center gap-x-2 px-3 py-2"
                                                        >
                                                            <Input
                                                                className="h-8 px-2.5 font-mono text-xs"
                                                                value={field.name}
                                                                onChange={(e) =>
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
                                                            <Select
                                                                value={field.type}
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
                                                                <SelectTrigger className="h-8 pl-2.5 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {FIELD_TYPES.map(
                                                                        (item) => (
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
                                                            <Input
                                                                className="h-8 px-2.5 text-sm"
                                                                value={
                                                                    field.description
                                                                }
                                                                onChange={(e) =>
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
                                                                placeholder="Description"
                                                            />
                                                            <Input
                                                                className="h-8 px-2.5 font-mono text-xs"
                                                                value={
                                                                    field.example
                                                                }
                                                                onChange={(e) =>
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
                                                            <div className="flex justify-center">
                                                                <Switch
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
                                                                                    checked,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    removeField(
                                                                        event.id,
                                                                        field.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    event.fields
                                                                        .length ===
                                                                    1
                                                                }
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            </form>
        </div>
    );
}
