import { useEffect, useMemo, useState } from "react";
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
import { RadioGroup, Radio } from "@/components/ui/radio";
import { SimpleCombobox } from "@/components/ui/simple-combobox";
import { InlineLoader } from "@/components/ui/loading-screen";
import { cn } from "@/lib/utils";
import { useAiProviderProfiles } from "@/lib/api/hooks/use-ai-provider-profiles";
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

export default function AgentModelsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: profiles = [], isLoading: profilesLoading } =
    useAiProviderProfiles();
  const updateAgent = useUpdateAgent();

  const [strong, setStrong] = useState<ModelFormState>(EMPTY_FORM);
  const [weak, setWeak] = useState<ModelFormState>(EMPTY_FORM);

  const enabledProfiles = useMemo(
    () => profiles.filter((profile) => profile.enabled),
    [profiles],
  );

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

  const original = {
    strong: fromOverride(agent.strong_model),
    weak: fromOverride(agent.weak_model),
  };
  const isDirty =
    !sameModelState(original.strong, strong) ||
    !sameModelState(original.weak, weak);

  const formInvalid =
    isModelStateInvalid(strong) || isModelStateInvalid(weak);

  const onSave = async () => {
    if (formInvalid) return;
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
        Falls back to deployment defaults when unset. Overrides can use a direct
        provider/model pair or an OpenAI profile defined in deployment settings.
      </p>

      <ModelOverrideRow
        id="strong"
        title="Strong model"
        description="Main reasoning loop and high-quality calls."
        state={strong}
        onChange={setStrong}
        profiles={enabledProfiles}
        profilesLoading={profilesLoading}
      />

      <div className="border-t border-border/40" />

      <ModelOverrideRow
        id="weak"
        title="Weak model"
        description="Cheap/fast calls: terminal review, summarisation, classification."
        state={weak}
        onChange={setWeak}
        profiles={enabledProfiles}
        profilesLoading={profilesLoading}
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
          {updateAgent.isPending ? "Saving..." : "Save"}
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
  profiles,
  profilesLoading,
}: {
  id: string;
  title: string;
  description: string;
  state: ModelFormState;
  onChange: (next: ModelFormState) => void;
  profiles: Array<{
    id: string;
    name: string;
    slug: string;
    default_model?: string | null;
  }>;
  profilesLoading: boolean;
}) {
  const selectedProfile = profiles.find(
    (profile) => profile.id === state.profileId,
  );

  const profileOptions = useMemo(
    () =>
      profiles.map((profile) => ({
        value: profile.id,
        label: profile.name,
        keywords: [profile.slug, profile.default_model ?? ""].filter(Boolean),
      })),
    [profiles],
  );

  const renderProfileOption = (option: { value: string; label: string }) => {
    const profile = profiles.find((p) => p.id === option.value);
    const subtitle = profile?.default_model
      ? `${profile.default_model} · ${profile.slug}`
      : profile?.slug;
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[13px]">{option.label}</span>
        {subtitle ? (
          <span className="truncate text-[11.5px] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    );
  };

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
            onCheckedChange={(checked) =>
              onChange({ ...state, enabled: checked })
            }
          />
        </div>
      </div>

      {state.enabled ? (
        <RadioGroup
          value={state.mode}
          onValueChange={(value) =>
            onChange({
              ...state,
              mode: value as ModelMode,
              provider: value === "profile" ? "" : state.provider,
              profileId: value === "provider" ? "" : state.profileId,
            })
          }
          className="gap-2"
        >
          <div className="rounded-lg border border-border p-3">
            <label
              htmlFor={`${id}-mode-provider`}
              className="flex cursor-pointer items-center gap-2"
            >
              <Radio id={`${id}-mode-provider`} value="provider" />
              <span className="text-[13px] font-medium leading-none">
                Provider and model
              </span>
            </label>
            {state.mode === "provider" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-provider`}>Provider</Label>
                  <Select
                    value={state.provider}
                    onValueChange={(value) =>
                      onChange({ ...state, provider: value })
                    }
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
                  <Label htmlFor={`${id}-provider-model`}>Model</Label>
                  <Input
                    id={`${id}-provider-model`}
                    value={state.model}
                    placeholder={modelPlaceholder(state.provider)}
                    onChange={(e) =>
                      onChange({ ...state, model: e.target.value })
                    }
                  />
                  <p className="text-[12px] leading-4 text-muted-foreground">
                    Exact identifier accepted by the provider API.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border p-3">
            <label
              htmlFor={`${id}-mode-profile`}
              className={cn(
                "flex items-center gap-2",
                profiles.length
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              <Radio
                id={`${id}-mode-profile`}
                value="profile"
                disabled={!profiles.length}
              />
              <span className="text-[13px] font-medium leading-none">
                Profile
              </span>
            </label>
            {state.mode === "profile" ? (
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label>Profile</Label>
                  <SimpleCombobox
                    options={profileOptions}
                    value={state.profileId}
                    onChange={(value) =>
                      onChange({
                        ...state,
                        profileId: value,
                        model:
                          state.model ||
                          profiles.find((profile) => profile.id === value)
                            ?.default_model ||
                          "",
                      })
                    }
                    placeholder={
                      profilesLoading
                        ? "Loading profiles"
                        : "Search by name or slug"
                    }
                    emptyText="No matching profile."
                    renderItem={renderProfileOption}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-profile-model`}>Model override</Label>
                  <Input
                    id={`${id}-profile-model`}
                    value={state.model}
                    placeholder={
                      selectedProfile?.default_model || "Use profile default"
                    }
                    onChange={(e) =>
                      onChange({ ...state, model: e.target.value })
                    }
                  />
                  <p className="text-[12px] leading-4 text-muted-foreground">
                    Leave blank to use the profile default model.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </RadioGroup>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          Using deployment default.
        </p>
      )}
    </div>
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
