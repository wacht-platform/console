import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateWebhookEventCatalog,
  useUpdateWebhookEventCatalog,
} from "@/lib/api/hooks/use-webhook-event-catalogs";
import type {
  WebhookEventCatalog,
  WebhookEventDefinition,
} from "@/types/webhook-catalog";

const DEFAULT_EVENTS_JSON = JSON.stringify(
  [
    {
      name: "user.created",
      description: "Emitted when a user is created",
      schema: {},
      example_payload: {},
      is_archived: false,
    },
  ],
  null,
  2,
);

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
  const [eventsJson, setEventsJson] = useState(DEFAULT_EVENTS_JSON);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (catalogToEdit) {
      setSlug(catalogToEdit.slug);
      setName(catalogToEdit.name);
      setDescription(catalogToEdit.description || "");
      setEventsJson(JSON.stringify(catalogToEdit.events ?? [], null, 2));
      setFormError(null);
      return;
    }

    setSlug("");
    setName("");
    setDescription("");
    setEventsJson(DEFAULT_EVENTS_JSON);
    setFormError(null);
  }, [catalogToEdit, isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const parsed = JSON.parse(eventsJson) as WebhookEventDefinition[];
      if (!Array.isArray(parsed)) {
        setFormError("Events JSON must be an array");
        return;
      }

      if (catalogToEdit) {
        await updateCatalog.mutateAsync({
          slug: catalogToEdit.slug,
          request: {
            name: name.trim(),
            description: description.trim() || undefined,
            events: parsed,
          },
        });
      } else {
        await createCatalog.mutateAsync({
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          events: parsed,
        });
      }

      handleClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save event catalog",
      );
    }
  };

  const isPending = createCatalog.isPending || updateCatalog.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {catalogToEdit ? "Edit Event Catalog" : "Create Event Catalog"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                placeholder="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={!!catalogToEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="description (optional)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Events JSON Array</Label>
            <Textarea
              className="min-h-[260px] font-mono text-xs"
              value={eventsJson}
              onChange={(event) => setEventsJson(event.target.value)}
            />
          </div>
          {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
          <DialogFooter>
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
