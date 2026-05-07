import { useNavigate, useParams } from "react-router";
import {
  BoltIcon,
  BookOpenIcon,
  CpuChipIcon,
  QueueListIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { InlineLoader } from "@/components/ui/loading-screen";
import { buildAgentResourcePath } from "@/components/ai-agents/agent-routes";
import { useAgentById } from "@/lib/api/hooks/use-agents";

const resourceCards = [
  {
    key: "skills",
    title: "Skills",
    description: "Browse default skills and manage agent-local skill bundles.",
    icon: QueueListIcon,
    suffix: "/skills",
    countKey: null,
  },
  {
    key: "tools",
    title: "Tools",
    description: "Attach or remove tools for this agent.",
    icon: WrenchScrewdriverIcon,
    suffix: "/tools",
    countKey: "tools_count" as const,
  },
  {
    key: "knowledge-bases",
    title: "Knowledge bases",
    description: "Manage the knowledge bases this agent can use.",
    icon: BookOpenIcon,
    suffix: "/knowledge-bases",
    countKey: "knowledge_bases_count" as const,
  },
  {
    key: "sub-agents",
    title: "Sub-agents",
    description: "Manage delegated agents and spawn settings.",
    icon: UserGroupIcon,
    suffix: "/sub-agents",
    countKey: null,
  },
  {
    key: "models",
    title: "Models",
    description: "Override the strong and weak model.",
    icon: CpuChipIcon,
    suffix: "/models",
    countKey: null,
  },
  {
    key: "hooks",
    title: "Hooks",
    description: "Tools to run on execution start and end.",
    icon: BoltIcon,
    suffix: "/hooks",
    countKey: null,
  },
  {
    key: "approvals",
    title: "Approvals",
    description: "Per-tool, MCP, virtual, and regex approval policy.",
    icon: ShieldCheckIcon,
    suffix: "/approvals",
    countKey: null,
  },
] as const;

export default function AgentDetailsPage() {
  const navigate = useNavigate();
  const { agentId, projectId, deploymentId } = useParams<{
    agentId: string;
    projectId: string;
    deploymentId: string;
  }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");

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

  return (
    <div className="grid gap-2.5 lg:grid-cols-2">
        {resourceCards.map((card) => {
          const Icon = card.icon;
          const href = buildAgentResourcePath(
            { projectId, deploymentId, agentId: String(agent.id) },
            card.suffix,
          );
          const count = card.countKey ? Number(agent[card.countKey] || 0) : undefined;

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => navigate(href)}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-3 text-left transition-colors hover:border-border hover:bg-muted/20"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium leading-5">{card.title}</span>
                  {typeof count === "number" ? (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {count}
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] leading-5 text-muted-foreground">{card.description}</p>
              </div>
            </button>
          );
        })}
    </div>
  );
}
