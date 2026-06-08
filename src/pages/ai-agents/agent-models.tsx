import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import SavePopup from "@/components/save-popup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from "@/components/ui/tag";
import { Segmented } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/section-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useAiProviderProfiles } from "@/lib/api/hooks/use-ai-provider-profiles";
import {
  type AgentLimits,
  type AgentModelOverride,
  useAgentById,
  useUpdateAgent,
} from "@/lib/api/hooks/use-agents";

const PROVIDER_CHOICES = [
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "gemini", label: "Google Gemini" },
] as const;

type ModelMode = "provider" | "profile";

interface ModelFormState {
  enabled: boolean;
  mode: ModelMode;
  provider: string;
  model: string;
  profileId: string;
}

const EMPTY_FORM: ModelFormState = {
  enabled: false,
  mode: "provider",
  provider: "",
  model: "",
  profileId: "",
};

function fromOverride(override?: AgentModelOverride): ModelFormState {
  if (!override) return EMPTY_FORM;
  if (override.profile_id) {
    return {
      enabled: true,
      mode: "profile",
      provider: "",
      model: override.model ?? "",
      profileId: String(override.profile_id),
    };
  }
  return {
    enabled: true,
    mode: "provider",
    provider: override.provider ?? "",
    model: override.model ?? "",
    profileId: "",
  };
}

type ProfileOption = {
  id: string;
  name: string;
  slug: string;
  default_model?: string | null;
};

export default function AgentModelsPage() {
  const { agentId, deploymentId } = useParams<{
    agentId: string;
    deploymentId: string;
  }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: profiles = [] } = useAiProviderProfiles();
  const { data: aiDefaults } = useQuery({
    queryKey: ["ai-settings", deploymentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        strong_model: string | null;
        weak_model: string | null;
      }>(`/deployments/${deploymentId}/ai/settings`);
      return data;
    },
    enabled: !!deploymentId,
  });
  const updateAgent = useUpdateAgent();

  const [strong, setStrong] = useState<ModelFormState>(EMPTY_FORM);
  const [weak, setWeak] = useState<ModelFormState>(EMPTY_FORM);
  const [limits, setLimits] = useState({ contextWindow: "", runTokenBudget: "" });

  const enabledProfiles = useMemo(
    () => profiles.filter((profile) => profile.enabled),
    [profiles],
  );

  useEffect(() => {
    if (!agent) return;
    setStrong(fromOverride(agent.strong_model));
    setWeak(fromOverride(agent.weak_model));
    setLimits(fromLimits(agent.limits));
  }, [agent]);

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  const original = {
    strong: fromOverride(agent.strong_model),
    weak: fromOverride(agent.weak_model),
    limits: fromLimits(agent.limits),
  };
  const isDirty =
    !sameModelState(original.strong, strong) ||
    !sameModelState(original.weak, weak) ||
    limits.contextWindow !== original.limits.contextWindow ||
    limits.runTokenBudget !== original.limits.runTokenBudget;
  const formInvalid = isModelStateInvalid(strong) || isModelStateInvalid(weak);

  const onSave = async () => {
    if (formInvalid) {
      toast.error(
        "Enabled overrides need a provider + model, or a selected profile.",
      );
      return;
    }
    const update: Parameters<typeof updateAgent.mutate>[0]["agent"] = {};
    if (strong.enabled) {
      update.strong_model = toOverride(strong);
      update.clear_strong_model = false;
    } else {
      update.clear_strong_model = true;
    }
    if (weak.enabled) {
      update.weak_model = toOverride(weak);
      update.clear_weak_model = false;
    } else {
      update.clear_weak_model = true;
    }

    const nextLimits: AgentLimits = {};
    const cw = Number.parseInt(limits.contextWindow, 10);
    if (limits.contextWindow.trim() && Number.isFinite(cw) && cw > 0) {
      nextLimits.context_window_tokens = cw;
    }
    const rb = Number.parseInt(limits.runTokenBudget, 10);
    if (limits.runTokenBudget.trim() && Number.isFinite(rb) && rb > 0) {
      nextLimits.run_token_budget = rb;
    }
    update.limits = nextLimits;

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
    <div>
      <div className="mb-2">
        <h3 className="text-base font-medium tracking-tight text-foreground">
          Model overrides
        </h3>
        <p className="mt-1 max-w-[640px] text-[13px] leading-6 text-muted-foreground">
          This agent uses the deployment's default models unless you override
          them here. Each override accepts a direct provider/model pair or a
          saved profile.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-10">
        <ModelRow
          id="strong"
          title="Strong model"
          badge="planner"
          description="Main reasoning loop and high-quality calls."
          state={strong}
          onChange={setStrong}
          profiles={enabledProfiles}
          defaultModel={aiDefaults?.strong_model}
        />
        <ModelRow
          id="weak"
          title="Weak model"
          badge="executor"
          description="Cheap, fast calls — review, summarisation, classification."
          state={weak}
          onChange={setWeak}
          profiles={enabledProfiles}
          defaultModel={aiDefaults?.weak_model}
        />

        <section className="flex flex-col gap-4">
          <SectionLabel>Runtime limits</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="context-window">Context window (tokens)</Label>
              <Input
                id="context-window"
                type="number"
                min={0}
                inputMode="numeric"
                value={limits.contextWindow}
                placeholder="150000 (default)"
                className="font-mono"
                onChange={(e) =>
                  setLimits({ ...limits, contextWindow: e.target.value })
                }
              />
              <p className="text-xs leading-5 text-muted-foreground">
                History compacts once the prompt reaches this many tokens. Blank
                = engine default (150k).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="run-token-budget">Run token budget</Label>
              <Input
                id="run-token-budget"
                type="number"
                min={0}
                inputMode="numeric"
                value={limits.runTokenBudget}
                placeholder="Unlimited"
                className="font-mono"
                onChange={(e) =>
                  setLimits({ ...limits, runTokenBudget: e.target.value })
                }
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Max total tokens per execution run before it's preempted. Blank =
                uncapped.
              </p>
            </div>
          </div>
        </section>
      </div>

      <SavePopup
        isDirty={isDirty}
        isSaving={updateAgent.isPending}
        onSave={onSave}
        onCancel={() => {
          setStrong(fromOverride(agent.strong_model));
          setWeak(fromOverride(agent.weak_model));
          setLimits(fromLimits(agent.limits));
        }}
      />
    </div>
  );
}

function ModelRow({
  id,
  title,
  badge,
  description,
  state,
  onChange,
  profiles,
  defaultModel,
}: {
  id: string;
  title: string;
  badge: string;
  description: string;
  state: ModelFormState;
  onChange: (next: ModelFormState) => void;
  profiles: ProfileOption[];
  defaultModel?: string | null;
}) {
  const selectedProfile = profiles.find((p) => p.id === state.profileId);
  const modelPlaceholder =
    state.mode === "profile"
      ? selectedProfile?.default_model || "Use profile default"
      : providerModelPlaceholder(state.provider);

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>{title}</SectionLabel>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Override default model
            </span>
            <Tag>{badge}</Tag>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <Switch
          checked={state.enabled}
          onCheckedChange={(checked) =>
            onChange({ ...state, enabled: checked })
          }
          className="mt-0.5 shrink-0"
        />
      </div>

      {state.enabled ? (
        <div className="space-y-3">
          <Segmented
            value={state.mode}
            onChange={(mode) =>
              onChange({
                ...state,
                mode: mode as ModelMode,
                provider: mode === "profile" ? "" : state.provider,
                profileId: mode === "provider" ? "" : state.profileId,
              })
            }
            options={[
              { value: "provider", label: "Provider & model" },
              { value: "profile", label: "Profile" },
            ]}
          />

          {state.mode === "provider" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-provider`}>Provider</Label>
                <Select
                  value={state.provider}
                  onValueChange={(v) => onChange({ ...state, provider: v })}
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
                  placeholder={modelPlaceholder}
                  className="font-mono"
                  onChange={(e) => onChange({ ...state, model: e.target.value })}
                />
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-[13px] leading-6 text-muted-foreground">
              No provider profiles defined yet — create one under{" "}
              <span className="font-medium text-foreground">Configuration</span>.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-profile`}>Profile</Label>
                <Select
                  value={state.profileId}
                  onValueChange={(v) => {
                    const profile = profiles.find((p) => p.id === v);
                    onChange({
                      ...state,
                      profileId: v,
                      model: state.model || profile?.default_model || "",
                    });
                  }}
                >
                  <SelectTrigger id={`${id}-profile`} className="w-full">
                    <SelectValue placeholder="Pick a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-model`}>Model override</Label>
                <Input
                  id={`${id}-model`}
                  value={state.model}
                  placeholder={modelPlaceholder}
                  className="font-mono"
                  onChange={(e) => onChange({ ...state, model: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[12px] leading-5 text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
          deployment default
          {defaultModel ? (
            <span className="text-foreground">· {defaultModel}</span>
          ) : null}
        </div>
      )}
    </section>
  );
}

function sameModelState(a: ModelFormState, b: ModelFormState): boolean {
  return (
    a.enabled === b.enabled &&
    a.mode === b.mode &&
    a.provider === b.provider &&
    a.model === b.model &&
    a.profileId === b.profileId
  );
}

function isModelStateInvalid(state: ModelFormState): boolean {
  if (!state.enabled) return false;
  if (state.mode === "profile") return !state.profileId.trim();
  return !state.provider.trim() || !state.model.trim();
}

function toOverride(state: ModelFormState): AgentModelOverride {
  if (state.mode === "profile") {
    return {
      profile_id: state.profileId.trim(),
      model: state.model.trim() || undefined,
    };
  }
  return {
    provider: state.provider.trim(),
    model: state.model.trim(),
  };
}

function fromLimits(limits?: AgentLimits): {
  contextWindow: string;
  runTokenBudget: string;
} {
  return {
    contextWindow:
      limits?.context_window_tokens != null
        ? String(limits.context_window_tokens)
        : "",
    runTokenBudget:
      limits?.run_token_budget != null ? String(limits.run_token_budget) : "",
  };
}

function providerModelPlaceholder(provider: string): string {
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
