import { FormEvent, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRateLimitScheme, useRateLimitSchemes } from "@/lib/api/hooks/use-rate-limit-schemes";
import type { RateLimitRule } from "@/types/rate-limit-scheme";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

const DEFAULT_RULES_JSON = JSON.stringify(
  [
    {
      unit: "minute",
      duration: 1,
      max_requests: 120,
      mode: "per_key",
      endpoints: ["*"],
      priority: 0,
    },
  ],
  null,
  2,
);

export default function ApiKeyRateLimitSchemesPage() {
  const { data: schemes = [], isLoading } = useRateLimitSchemes();
  const createScheme = useCreateRateLimitScheme();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rulesJson, setRulesJson] = useState(DEFAULT_RULES_JSON);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedSchemes = useMemo(
    () => [...schemes].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [schemes],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      const parsed = JSON.parse(rulesJson) as RateLimitRule[];
      if (!Array.isArray(parsed)) {
        setFormError("rules JSON must be an array");
        return;
      }
      await createScheme.mutateAsync({
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        rules: parsed,
      });
      setSlug("");
      setName("");
      setDescription("");
      setRulesJson(DEFAULT_RULES_JSON);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create rate limit scheme",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Heading>Rate Limit Schemes</Heading>
        <Text className="text-sm text-muted-foreground">
          Define reusable API auth rate-limit policies and assign them to apps.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Create Scheme</CardTitle>
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
                  Rules definition JSON array
                </Text>
                <Textarea
                  className="min-h-[260px] font-mono text-xs"
                  value={rulesJson}
                  onChange={(event) => setRulesJson(event.target.value)}
                />
              </div>
              {formError ? (
                <p className="text-sm text-red-500">{formError}</p>
              ) : null}
              <Button type="submit" disabled={createScheme.isPending}>
                {createScheme.isPending ? "Creating..." : "Create Scheme"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Existing Schemes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading schemes...</p>
            ) : sortedSchemes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schemes found.</p>
            ) : (
              <div className="space-y-2">
                {sortedSchemes.map((scheme) => (
                  <div
                    key={scheme.slug}
                    className="rounded-lg border border-border/60 px-3 py-2.5 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{scheme.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{scheme.slug}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {scheme.rules?.length ?? 0} rules
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
