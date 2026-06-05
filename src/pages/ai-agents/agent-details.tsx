import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { InlineLoader } from "@/components/ui/loading-screen";
import { MarkdownEditor } from "@/components/markdown-editor";
import SavePopup from "@/components/save-popup";
import { cn } from "@/lib/utils";
import {
  useAgentById,
  useUpdateAgent,
  type Agent,
  type AgentModelOverride,
} from "@/lib/api/hooks/use-agents";
import { useAiProviderProfiles } from "@/lib/api/hooks/use-ai-provider-profiles";

function DefRow({
  label,
  value,
  accent,
  mute,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mute?: boolean;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-baseline gap-3 py-[7px]">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span
        title={value}
        className={cn(
          "min-w-0 truncate font-mono text-xs",
          accent
            ? "text-primary"
            : mute
              ? "text-muted-foreground"
              : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function AgentDetailsPage() {
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

  const modelLabel = (
    override: AgentModelOverride | null | undefined,
    fallback?: string | null,
  ) => {
    if (override?.model) return override.model;
    if (override?.profile_id) {
      const profile = profiles.find(
        (p) => String(p.id) === String(override.profile_id),
      );
      if (profile) return profile.default_model || profile.name;
    }
    return fallback || "deployment default";
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  const subAgentCount = agent.sub_agents?.length ?? 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Left: system prompt */}
      <div className="space-y-5">
        <SystemPrompt agent={agent} />
      </div>

      {/* Right: configuration */}
      <aside className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Configuration</h3>
        <div className="rounded-lg border border-border bg-card px-4 py-2">
          <DefRow
            label="Strong model"
            value={modelLabel(agent.strong_model, aiDefaults?.strong_model)}
            accent
          />
          <DefRow
            label="Weak model"
            value={modelLabel(agent.weak_model, aiDefaults?.weak_model)}
          />
          <DefRow label="Tools" value={String(agent.tools_count)} />
          <DefRow
            label="Knowledge bases"
            value={String(agent.knowledge_bases_count)}
          />
          <DefRow label="Sub-agents" value={String(subAgentCount)} />
          <DefRow
            label="MCP approval"
            value={agent.require_approval_mcp ? "required" : "none"}
            mute={!agent.require_approval_mcp}
          />
          <DefRow
            label="Virtual approval"
            value={agent.require_approval_virtual ? "required" : "none"}
            mute={!agent.require_approval_virtual}
          />
        </div>
      </aside>
    </div>
  );
}

function SystemPrompt({ agent }: { agent: Agent }) {
  // `baseline` is the editor's normalized markdown for the current saved value;
  // dirtiness is draft vs baseline (not vs the raw stored string) to avoid a
  // false "unsaved" from Milkdown re-serialising on load.
  const [draft, setDraft] = useState(agent.description || "");
  const [baseline, setBaseline] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const updateAgent = useUpdateAgent();

  const isDirty = baseline !== null && draft.trim() !== baseline.trim();

  const save = async () => {
    try {
      await updateAgent.mutateAsync({
        agentId: String(agent.id),
        agent: { name: agent.name, description: draft },
      });
      setBaseline(draft);
    } catch {
      // surfaced by hook
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">System prompt</h3>
      <div className="rounded-lg border border-border bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
        <MarkdownEditor
          key={editorKey}
          value={baseline ?? agent.description ?? ""}
          onChange={setDraft}
          onReady={(markdown) => {
            setBaseline(markdown);
            setDraft(markdown);
          }}
          placeholder="Describe how this agent should behave. This is injected as the system prompt on every run…"
        />
      </div>
      <SavePopup
        isDirty={isDirty}
        isSaving={updateAgent.isPending}
        onSave={save}
        onCancel={() => {
          setDraft(baseline ?? agent.description ?? "");
          setEditorKey((k) => k + 1);
        }}
      />
    </section>
  );
}
