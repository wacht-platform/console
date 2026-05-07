import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  BoltIcon,
  BookOpenIcon,
  ChevronDownIcon,
  CpuChipIcon,
  QueueListIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InlineLoader } from "@/components/ui/loading-screen";
import { buildAgentResourcePath } from "@/components/ai-agents/agent-routes";
import { cn } from "@/lib/utils";
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
    <div className="space-y-4">
      <AgentDescription description={agent.description} />
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
    </div>
  );
}

function AgentDescription({ description }: { description?: string }) {
  const [expanded, setExpanded] = useState(true);
  const trimmed = description?.trim();
  if (!trimmed) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-background">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="sticky top-0 z-10 flex w-full items-center justify-between gap-2 rounded-t-lg border-b border-border/60 bg-background/95 px-4 py-2 text-left backdrop-blur transition-colors hover:bg-muted/30"
      >
        <span className="text-[13px] font-medium">Description</span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </button>
      {expanded ? (
        <div className="space-y-3 px-4 py-3 text-[13px] leading-6 text-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-base font-semibold tracking-tight">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[15px] font-semibold tracking-tight">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[14px] font-semibold">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-[13px] leading-6 text-foreground">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc space-y-1 pl-5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal space-y-1 pl-5">{children}</ol>
              ),
              li: ({ children }) => <li className="leading-6">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              code: (props) => {
                const inline = !String(props.className || "").includes("language-");
                return inline ? (
                  <code className="mx-0.5 inline rounded-md border border-border/70 bg-muted/80 px-1.5 py-0.5 font-mono text-[0.82em] font-medium leading-none">
                    {props.children}
                  </code>
                ) : (
                  <code className="block overflow-x-auto rounded-md border border-border/70 bg-muted/60 p-3 font-mono text-[12px] leading-6">
                    {props.children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-md">{children}</pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted/40">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-border px-3 py-2 text-left font-medium">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-3 py-2 align-top">{children}</td>
              ),
            }}
          >
            {trimmed}
          </ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
