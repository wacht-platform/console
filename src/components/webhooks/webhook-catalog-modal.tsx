import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useCreateWebhookEventCatalog,
  useUpdateWebhookEventCatalog,
} from "@/lib/api/hooks/use-webhook-event-catalogs";
import type {
  WebhookEventCatalog,
  WebhookEventDefinition,
} from "@/types/webhook-catalog";

type SchemaFieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array";

type SchemaFieldForm = {
  name: string;
  type: SchemaFieldType;
  required: boolean;
  description: string;
  example: string;
};

type EventForm = {
  name: string;
  description: string;
  group: string;
  fields: SchemaFieldForm[];
  is_archived?: boolean;
};

type ModalView = "events" | "event-detail";

const FIELD_TYPES: Array<{ label: string; value: SchemaFieldType }> = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Integer", value: "integer" },
  { label: "Boolean", value: "boolean" },
  { label: "Object (JSON)", value: "object" },
  { label: "Array (JSON)", value: "array" },
];

const createDefaultField = (): SchemaFieldForm => ({
  name: "",
  type: "string",
  required: false,
  description: "",
  example: "",
});

const createDefaultEvent = (): EventForm => ({
  name: "",
  description: "",
  group: "",
  fields: [createDefaultField()],
  is_archived: false,
});

const normalizeFieldType = (value: unknown): SchemaFieldType => {
  if (
    value === "string" ||
    value === "number" ||
    value === "integer" ||
    value === "boolean" ||
    value === "object" ||
    value === "array"
  ) {
    return value;
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
  if (typeof value === "string") return value;
  return String(value);
};

const parseExample = (
  rawValue: string,
  type: SchemaFieldType,
  eventIndex: number,
  fieldName: string,
): unknown => {
  const trimmed = rawValue.trim();
  if (!trimmed) return undefined;

  switch (type) {
    case "string":
      return trimmed;
    case "number": {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) {
        throw new Error(
          `Event ${eventIndex + 1}, field "${fieldName}": example must be a number`,
        );
      }
      return parsed;
    }
    case "integer": {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed)) {
        throw new Error(
          `Event ${eventIndex + 1}, field "${fieldName}": example must be an integer`,
        );
      }
      return parsed;
    }
    case "boolean": {
      if (trimmed === "true") return true;
      if (trimmed === "false") return false;
      throw new Error(
        `Event ${eventIndex + 1}, field "${fieldName}": example must be true or false`,
      );
    }
    case "object": {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(
          `Event ${eventIndex + 1}, field "${fieldName}": example must be a JSON object`,
        );
      }
      return parsed;
    }
    case "array": {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        throw new Error(
          `Event ${eventIndex + 1}, field "${fieldName}": example must be a JSON array`,
        );
      }
      return parsed;
    }
    default:
      return trimmed;
  }
};

const toEventForm = (event: WebhookEventDefinition): EventForm => {
  const schema = (event.schema ?? {}) as Record<string, unknown>;
  const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
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
      name: key,
      type: fieldType,
      required: requiredSet.has(key),
      description: String(def?.description ?? ""),
      example: stringifyExample(examplePayload[key], fieldType),
    } satisfies SchemaFieldForm;
  });

  return {
    name: event.name ?? "",
    description: event.description ?? "",
    group: event.group ?? "",
    fields: mappedFields.length > 0 ? mappedFields : [createDefaultField()],
    is_archived: event.is_archived ?? false,
  };
};

interface WebhookCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogToEdit?: WebhookEventCatalog | null;
}

export function WebhookCatalogModal({
  isOpen,
  onClose,
  catalogToEdit,
}: WebhookCatalogModalProps) {
  const createCatalog = useCreateWebhookEventCatalog();
  const updateCatalog = useUpdateWebhookEventCatalog();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<EventForm[]>([createDefaultEvent()]);
  const [view, setView] = useState<ModalView>("events");
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (catalogToEdit) {
      const mapped =
        (catalogToEdit.events ?? []).length > 0
          ? (catalogToEdit.events ?? []).map(toEventForm)
          : [createDefaultEvent()];
      setSlug(catalogToEdit.slug);
      setName(catalogToEdit.name);
      setDescription(catalogToEdit.description || "");
      setEvents(mapped);
      setView("events");
      setActiveEventIndex(0);
      setFormError(null);
      return;
    }

    setSlug("");
    setName("");
    setDescription("");
    setEvents([createDefaultEvent()]);
    setView("events");
    setActiveEventIndex(0);
    setFormError(null);
  }, [catalogToEdit, isOpen]);

  const isPending = useMemo(
    () => createCatalog.isPending || updateCatalog.isPending,
    [createCatalog.isPending, updateCatalog.isPending],
  );

  const activeEvent = events[activeEventIndex];

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const openEventDetail = (index: number) => {
    setActiveEventIndex(index);
    setView("event-detail");
  };

  const updateEvent = (index: number, patch: Partial<EventForm>) => {
    setEvents((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  };

  const addEvent = () => {
    setEvents((current) => {
      const next = [...current, createDefaultEvent()];
      const newIndex = next.length - 1;
      setActiveEventIndex(newIndex);
      setView("event-detail");
      return next;
    });
  };

  const removeEvent = (index: number) => {
    setEvents((current) => {
      if (current.length === 1) return current;
      const next = current.filter((_, i) => i !== index);
      if (view === "event-detail") {
        setView("events");
        setActiveEventIndex(0);
      }
      return next;
    });
  };

  const updateField = (
    eventIndex: number,
    fieldIndex: number,
    patch: Partial<SchemaFieldForm>,
  ) => {
    setEvents((current) =>
      current.map((eventItem, i) => {
        if (i !== eventIndex) return eventItem;
        return {
          ...eventItem,
          fields: eventItem.fields.map((field, j) =>
            j === fieldIndex ? { ...field, ...patch } : field,
          ),
        };
      }),
    );
  };

  const addField = (eventIndex: number) => {
    setEvents((current) =>
      current.map((eventItem, i) =>
        i === eventIndex
          ? { ...eventItem, fields: [...eventItem.fields, createDefaultField()] }
          : eventItem,
      ),
    );
  };

  const removeField = (eventIndex: number, fieldIndex: number) => {
    setEvents((current) =>
      current.map((eventItem, i) => {
        if (i !== eventIndex) return eventItem;
        if (eventItem.fields.length === 1) return eventItem;
        return {
          ...eventItem,
          fields: eventItem.fields.filter((_, j) => j !== fieldIndex),
        };
      }),
    );
  };

  const parseEvents = (): WebhookEventDefinition[] => {
    return events.map((item, eventIndex) => {
      if (!item.name.trim()) {
        throw new Error(`Event ${eventIndex + 1}: name is required`);
      }
      if (!item.description.trim()) {
        throw new Error(`Event ${eventIndex + 1}: description is required`);
      }

      const namedFields = item.fields.filter((field) => field.name.trim().length > 0);
      const required: string[] = [];
      const properties: Record<string, Record<string, unknown>> = {};
      const examplePayload: Record<string, unknown> = {};
      const duplicateCheck = new Set<string>();

      namedFields.forEach((field) => {
        const fieldName = field.name.trim();
        if (duplicateCheck.has(fieldName)) {
          throw new Error(
            `Event ${eventIndex + 1}: duplicate schema field name "${fieldName}"`,
          );
        }
        duplicateCheck.add(fieldName);

        const definition: Record<string, unknown> = { type: field.type };
        if (field.description.trim()) {
          definition.description = field.description.trim();
        }

        properties[fieldName] = definition;
        if (field.required) required.push(fieldName);

        const parsedExample = parseExample(
          field.example,
          field.type,
          eventIndex,
          fieldName,
        );
        if (parsedExample !== undefined) {
          examplePayload[fieldName] = parsedExample;
        }
      });

      const schema: Record<string, unknown> = {
        type: "object",
        properties,
      };
      if (required.length > 0) schema.required = required;

      return {
        name: item.name.trim(),
        description: item.description.trim(),
        group: item.group.trim() || undefined,
        schema,
        example_payload: examplePayload,
        is_archived: item.is_archived ?? false,
      } satisfies WebhookEventDefinition;
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      if (!name.trim()) {
        setFormError("Catalog name is required");
        return;
      }
      if (!catalogToEdit && !slug.trim()) {
        setFormError("Catalog slug is required");
        return;
      }

      const parsedEvents = parseEvents();

      if (catalogToEdit) {
        await updateCatalog.mutateAsync({
          slug: catalogToEdit.slug,
          request: {
            name: name.trim(),
            description: description.trim() || undefined,
            events: parsedEvents,
          },
        });
      } else {
        await createCatalog.mutateAsync({
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          events: parsedEvents,
        });
      }

      handleClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save event catalog",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-5xl min-h-[78vh] max-h-[92vh] overflow-hidden">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {view === "event-detail" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setView("events")}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            ) : null}
            <DialogTitle>
              {view === "event-detail"
                ? activeEvent?.name?.trim() || `Event ${activeEventIndex + 1}`
                : catalogToEdit
                  ? "Edit Event Catalog"
                  : "Create Event Catalog"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form className="flex min-h-[70vh] h-full flex-col" onSubmit={onSubmit}>
          <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {view === "events" ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    placeholder="user-events"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={!!catalogToEdit}
                    required
                  />
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
                  placeholder="Optional"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Events</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEvent}>
                    <PlusIcon className="mr-1 h-4 w-4" /> Add Event
                  </Button>
                </div>

                <div className="divide-y divide-border border-y border-border/60">
                  {events.map((eventItem, index) => (
                    <div
                      key={`event-row-${index}`}
                      className="grid grid-cols-12 items-center gap-2 px-2 py-3"
                    >
                      <div className="col-span-3 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {eventItem.name.trim() || `Untitled event ${index + 1}`}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {eventItem.group.trim() || "No group"}
                        </p>
                      </div>
                      <div className="col-span-5 min-w-0 text-xs text-muted-foreground">
                        <p className="truncate">
                          {eventItem.description.trim() || "No description"}
                        </p>
                      </div>
                      <div className="col-span-2 text-xs text-muted-foreground">
                        {eventItem.fields.length} fields
                      </div>
                      <div className="col-span-2 flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openEventDetail(index)}
                        >
                          Configure
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => removeEvent(index)}
                          disabled={events.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activeEvent ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input
                    value={activeEvent.name}
                    onChange={(e) =>
                      updateEvent(activeEventIndex, { name: e.target.value })
                    }
                    placeholder="user.created"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Input
                    value={activeEvent.group}
                    onChange={(e) =>
                      updateEvent(activeEventIndex, { group: e.target.value })
                    }
                    placeholder="user"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={activeEvent.description}
                  onChange={(e) =>
                    updateEvent(activeEventIndex, { description: e.target.value })
                  }
                  placeholder="Emitted when a user is created"
                />
              </div>

              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Schema Fields</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addField(activeEventIndex)}
                  >
                    <PlusIcon className="mr-1 h-4 w-4" /> Add Field
                  </Button>
                </div>
                <div className="rounded-lg border border-border/60">
                  <div className="hidden grid-cols-12 gap-3 border-b border-border/60 px-3 py-2 text-[11px] text-muted-foreground lg:grid">
                    <p className="col-span-2">Field</p>
                    <p className="col-span-2">Type</p>
                    <p className="col-span-3">Description</p>
                    <p className="col-span-3">Example</p>
                    <p className="col-span-1 text-center">Req</p>
                    <p className="col-span-1 text-right">Action</p>
                  </div>

                  {activeEvent.fields.map((field, fieldIndex) => (
                    <div
                      key={`field-${fieldIndex}`}
                      className="grid items-center gap-3 border-b border-border/40 px-3 py-3 last:border-b-0 lg:grid-cols-12"
                    >
                      <div className="lg:col-span-2">
                        <Label className="mb-1 text-xs lg:hidden">Field</Label>
                        <Input
                          className="h-9 text-sm"
                          value={field.name}
                          onChange={(e) =>
                            updateField(activeEventIndex, fieldIndex, {
                              name: e.target.value,
                            })
                          }
                          placeholder="email"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <Label className="mb-1 text-xs lg:hidden">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: SchemaFieldType) =>
                            updateField(activeEventIndex, fieldIndex, { type: value })
                          }
                        >
                          <SelectTrigger className="h-9 w-full text-sm">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="lg:col-span-3">
                        <Label className="mb-1 text-xs lg:hidden">Description</Label>
                        <Input
                          className="h-9 text-sm"
                          value={field.description}
                          onChange={(e) =>
                            updateField(activeEventIndex, fieldIndex, {
                              description: e.target.value,
                            })
                          }
                          placeholder="User email address"
                        />
                      </div>

                      <div className="lg:col-span-3">
                        <Label className="mb-1 text-xs lg:hidden">Example</Label>
                        <Input
                          className="h-9 text-sm"
                          value={field.example}
                          onChange={(e) =>
                            updateField(activeEventIndex, fieldIndex, {
                              example: e.target.value,
                            })
                          }
                          placeholder={
                            field.type === "object" || field.type === "array"
                              ? "JSON value"
                              : "Example value"
                          }
                        />
                      </div>

                      <div className="flex h-9 items-center lg:col-span-1 lg:justify-center">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground lg:gap-0">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              updateField(activeEventIndex, fieldIndex, {
                                required: checked === true,
                              })
                            }
                          />
                          <span className="lg:hidden">Required</span>
                        </label>
                      </div>

                      <div className="flex h-9 items-center lg:col-span-1 lg:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => removeField(activeEventIndex, fieldIndex)}
                          disabled={activeEvent.fields.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          </div>

          {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

          <DialogFooter className="mt-auto border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? catalogToEdit
                  ? "Saving..."
                  : "Creating..."
                : catalogToEdit
                  ? "Save Changes"
                  : "Create Catalog"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
