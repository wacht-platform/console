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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateRateLimitScheme,
  useUpdateRateLimitScheme,
} from "@/lib/api/hooks/use-rate-limit-schemes";
import type {
  RateLimitMode,
  RateLimitRule,
  RateLimitScheme,
  RateLimitUnit,
} from "@/types/rate-limit-scheme";

const RATE_LIMIT_UNITS: Array<{ label: string; value: RateLimitUnit }> = [
  { label: "Millisecond", value: "millisecond" },
  { label: "Second", value: "second" },
  { label: "Minute", value: "minute" },
  { label: "Hour", value: "hour" },
  { label: "Day", value: "day" },
  { label: "Calendar Day", value: "calendar_day" },
  { label: "Month", value: "month" },
  { label: "Calendar Month", value: "calendar_month" },
];

const RATE_LIMIT_MODES: Array<{ label: string; value: RateLimitMode }> = [
  { label: "Per Key", value: "per_key" },
  { label: "Per IP", value: "per_ip" },
  { label: "Per Key + IP", value: "per_key_and_ip" },
  { label: "Per App", value: "per_app" },
  { label: "Per App + IP", value: "per_app_and_ip" },
];

type RateLimitRuleForm = {
  unit: RateLimitUnit;
  duration: string;
  max_requests: string;
  mode: RateLimitMode;
  endpoints: string;
  priority: string;
};

const createDefaultRule = (): RateLimitRuleForm => ({
  unit: "minute",
  duration: "1",
  max_requests: "120",
  mode: "per_key",
  endpoints: "*",
  priority: "0",
});

const toRuleForm = (rule: RateLimitRule): RateLimitRuleForm => ({
  unit: rule.unit,
  duration: String(rule.duration ?? 1),
  max_requests: String(rule.max_requests ?? 0),
  mode: rule.mode ?? "per_key",
  endpoints: (rule.endpoints ?? ["*"]).join(", "),
  priority: String(rule.priority ?? 0),
});

interface RateLimitSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemeToEdit?: RateLimitScheme | null;
}

export function RateLimitSchemeModal({
  isOpen,
  onClose,
  schemeToEdit,
}: RateLimitSchemeModalProps) {
  const createScheme = useCreateRateLimitScheme();
  const updateScheme = useUpdateRateLimitScheme();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<RateLimitRuleForm[]>([createDefaultRule()]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (schemeToEdit) {
      setSlug(schemeToEdit.slug);
      setName(schemeToEdit.name);
      setDescription(schemeToEdit.description ?? "");
      setRules(
        schemeToEdit.rules.length > 0
          ? schemeToEdit.rules.map(toRuleForm)
          : [createDefaultRule()],
      );
      setFormError(null);
      return;
    }

    setSlug("");
    setName("");
    setDescription("");
    setRules([createDefaultRule()]);
    setFormError(null);
  }, [schemeToEdit, isOpen]);

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const updateRule = (
    index: number,
    patch: Partial<RateLimitRuleForm>,
  ): void => {
    setRules((current) =>
      current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    );
  };

  const addRule = () => {
    setRules((current) => [...current, createDefaultRule()]);
  };

  const removeRule = (index: number) => {
    setRules((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index),
    );
  };

  const parseRules = (): RateLimitRule[] | null => {
    const parsed = rules.map((rule, index) => {
      const duration = Number(rule.duration);
      const maxRequests = Number(rule.max_requests);
      const priority = Number(rule.priority || index);

      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error(`Rule ${index + 1}: Duration must be greater than 0`);
      }
      if (!Number.isFinite(maxRequests) || maxRequests <= 0) {
        throw new Error(`Rule ${index + 1}: Max requests must be greater than 0`);
      }
      if (!Number.isFinite(priority)) {
        throw new Error(`Rule ${index + 1}: Priority must be a number`);
      }

      const endpoints = rule.endpoints
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      return {
        unit: rule.unit,
        duration,
        max_requests: maxRequests,
        mode: rule.mode,
        endpoints: endpoints.length > 0 ? endpoints : ["*"],
        priority,
      } satisfies RateLimitRule;
    });

    return parsed;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      if (!name.trim()) {
        setFormError("Name is required");
        return;
      }
      if (!schemeToEdit && !slug.trim()) {
        setFormError("Slug is required");
        return;
      }

      const parsedRules = parseRules();
      if (!parsedRules || parsedRules.length === 0) {
        setFormError("At least one rule is required");
        return;
      }

      if (schemeToEdit) {
        await updateScheme.mutateAsync({
          slug: schemeToEdit.slug,
          request: {
            name: name.trim(),
            description: description.trim() || undefined,
            rules: parsedRules,
          },
        });
      } else {
        await createScheme.mutateAsync({
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          rules: parsedRules,
        });
      }

      handleClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save rate limit scheme",
      );
    }
  };

  const isPending = createScheme.isPending || updateScheme.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {schemeToEdit ? "Edit Rate Limit Scheme" : "Create Rate Limit Scheme"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="public-api-default"
                disabled={!!schemeToEdit}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Public API Defaults"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rules</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRule}>
                Add Rule
              </Button>
            </div>

            {rules.map((rule, index) => (
              <div
                key={`rule-${index}`}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Rule {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(index)}
                    disabled={rules.length === 1}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={rule.unit}
                      onValueChange={(value: RateLimitUnit) =>
                        updateRule(index, { unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {RATE_LIMIT_UNITS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      type="number"
                      min={1}
                      value={rule.duration}
                      onChange={(event) =>
                        updateRule(index, { duration: event.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Requests</Label>
                    <Input
                      type="number"
                      min={1}
                      value={rule.max_requests}
                      onChange={(event) =>
                        updateRule(index, { max_requests: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select
                      value={rule.mode}
                      onValueChange={(value: RateLimitMode) =>
                        updateRule(index, { mode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {RATE_LIMIT_MODES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      value={rule.priority}
                      onChange={(event) =>
                        updateRule(index, { priority: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Endpoints</Label>
                  <Input
                    value={rule.endpoints}
                    onChange={(event) =>
                      updateRule(index, { endpoints: event.target.value })
                    }
                    placeholder="*, /v1/users, /v1/orders/*"
                  />
                </div>
              </div>
            ))}
          </div>

          {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? schemeToEdit
                  ? "Saving..."
                  : "Creating..."
                : schemeToEdit
                  ? "Save Changes"
                  : "Create Scheme"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
