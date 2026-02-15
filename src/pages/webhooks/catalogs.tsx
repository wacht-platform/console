import { FormEvent, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWebhookEventCatalog, useWebhookEventCatalogs } from "@/lib/api/hooks/use-webhook-event-catalogs";
import type { WebhookEventDefinition } from "@/types/webhook-catalog";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

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

export default function WebhookCatalogsPage() {
  const { data: catalogs = [], isLoading } = useWebhookEventCatalogs();
  const createCatalog = useCreateWebhookEventCatalog();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventsJson, setEventsJson] = useState(DEFAULT_EVENTS_JSON);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedCatalogs = useMemo(
    () => [...catalogs].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [catalogs],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      const parsed = JSON.parse(eventsJson) as WebhookEventDefinition[];
      if (!Array.isArray(parsed)) {
        setFormError("events JSON must be an array");
        return;
      }
      await createCatalog.mutateAsync({
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        events: parsed,
      });
      setSlug("");
      setName("");
      setDescription("");
      setEventsJson(DEFAULT_EVENTS_JSON);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create event catalog",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Heading>Event Catalogs</Heading>
        <Text className="text-sm text-muted-foreground">
          Create shared webhook event catalogs and reuse them across apps.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Create Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  required
                />
                <Input
                  placeholder="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <Input
                placeholder="description (optional)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              <div className="space-y-2">
                <Text className="text-xs text-muted-foreground">
                  Events definition JSON array
                </Text>
                <Textarea
                  className="min-h-[260px] font-mono text-xs"
                  value={eventsJson}
                  onChange={(event) => setEventsJson(event.target.value)}
                />
              </div>
              {formError ? (
                <p className="text-sm text-red-500">{formError}</p>
              ) : null}
              <Button type="submit" disabled={createCatalog.isPending}>
                {createCatalog.isPending ? "Creating..." : "Create Catalog"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Existing Catalogs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading catalogs...</p>
            ) : sortedCatalogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No catalogs found.</p>
            ) : (
              <div className="space-y-2">
                {sortedCatalogs.map((catalog) => (
                  <div
                    key={catalog.slug}
                    className="rounded-lg border border-border/60 px-3 py-2.5 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{catalog.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{catalog.slug}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {catalog.events?.length ?? 0} events
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
