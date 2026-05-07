import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { InlineLoader } from "@/components/ui/loading-screen";
import {
  type AgentModelOverride,
  useAgentById,
  useUpdateAgent,
} from "@/lib/api/hooks/use-agents";

const PROVIDER_CHOICES = [
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "gemini", label: "Google Gemini" },
] as const;

interface ModelFormState {
  enabled: boolean;
  provider: string;
  model: string;
}

const EMPTY_FORM: ModelFormState = { enabled: false, provider: "", model: "" };

function fromOverride(override?: AgentModelOverride): ModelFormState {
  if (!override) return EMPTY_FORM;
  return { enabled: true, provider: override.provider, model: override.model };
}

export default function AgentModelsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const updateAgent = useUpdateAgent();

  const [strong, setStrong] = useState<ModelFormState>(EMPTY_FORM);
  const [weak, setWeak] = useState<ModelFormState>(EMPTY_FORM);

  useEffect(() => {
    if (!agent) return;
    setStrong(fromOverride(agent.strong_model));
    setWeak(fromOverride(agent.weak_model));
  }, [agent]);

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  const isDirty = (() => {
    const original = {
      strong: fromOverride(agent.strong_model),
      weak: fromOverride(agent.weak_model),
    };
    return (
      original.strong.enabled !== strong.enabled ||
      original.strong.provider !== strong.provider ||
      original.strong.model !== strong.model ||
      original.weak.enabled !== weak.enabled ||
      original.weak.provider !== weak.provider ||
      original.weak.model !== weak.model
    );
  })();

  const formInvalid =
    (strong.enabled && (!strong.provider.trim() || !strong.model.trim())) ||
    (weak.enabled && (!weak.provider.trim() || !weak.model.trim()));

  const onSave = async () => {
    if (formInvalid) return;
    const update: Parameters<typeof updateAgent.mutate>[0]["agent"] = {};
    if (strong.enabled) {
      update.strong_model = {
        provider: strong.provider.trim(),
        model: strong.model.trim(),
      };
      update.clear_strong_model = false;
    } else {
      update.clear_strong_model = true;
    }
    if (weak.enabled) {
      update.weak_model = {
        provider: weak.provider.trim(),
        model: weak.model.trim(),
      };
      update.clear_weak_model = false;
    } else {
      update.clear_weak_model = true;
    }

    try {
      await updateAgent.mutateAsync({ agentId: agent.id, agent: update });
      toast.success("Models updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update models",
      );
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-[13px] leading-5 text-muted-foreground">
        Falls back to deployment defaults when unset. Only the provider and model name are
        overridden here — keys and other knobs always come from the deployment.{" "}
        <a
          href="https://wacht.dev/docs/guides/agents/model-overrides"
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
        .
      </p>

      <ModelOverrideRow
        id="strong"
        title="Strong model"
        description="Main reasoning loop and high-quality calls."
        state={strong}
        onChange={setStrong}
      />

      <div className="border-t border-border/40" />

      <ModelOverrideRow
        id="weak"
        title="Weak model"
        description="Cheap/fast calls — terminal review, summarisation, classification."
        state={weak}
        onChange={setWeak}
      />

      <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-5">
        <Button
          variant="outline"
          onClick={() => {
            setStrong(fromOverride(agent.strong_model));
            setWeak(fromOverride(agent.weak_model));
          }}
          disabled={!isDirty || updateAgent.isPending}
        >
          Reset
        </Button>
        <Button
          onClick={onSave}
          disabled={!isDirty || formInvalid || updateAgent.isPending}
        >
          {updateAgent.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function ModelOverrideRow({
  id,
  title,
  description,
  state,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  state: ModelFormState;
  onChange: (next: ModelFormState) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-medium leading-5">{title}</div>
          <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span>Override</span>
          <Switch
            checked={state.enabled}
            onCheckedChange={(checked) => onChange({ ...state, enabled: checked })}
          />
        </div>
      </div>

      {state.enabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-provider`}>Provider</Label>
            <Select
              value={state.provider}
              onValueChange={(value) => onChange({ ...state, provider: value })}
            >
              <SelectTrigger id={`${id}-provider`} className="w-full">
                <SelectValue placeholder="Pick a provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_CHOICES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-model`}>Model</Label>
            <Input
              id={`${id}-model`}
              value={state.model}
              placeholder={modelPlaceholder(state.provider)}
              onChange={(e) => onChange({ ...state, model: e.target.value })}
            />
            <p className="text-[12px] leading-4 text-muted-foreground">
              Exact identifier accepted by the provider's API.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">Using deployment default.</p>
      )}
    </div>
  );
}

function modelPlaceholder(provider: string): string {
  switch (provider) {
    case "openai":
      return "gpt-5.1";
    case "openrouter":
      return "anthropic/claude-4-7-sonnet";
    case "gemini":
      return "gemini-3.1-pro-preview";
    default:
      return "model identifier";
  }
}
