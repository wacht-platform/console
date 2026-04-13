import { useMemo } from "react";
import { useParams } from "react-router";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useAgentById, useAgents } from "@/lib/api/hooks/use-agents";
import { useAgentSubAgents, useAttachSubAgent, useDetachSubAgent } from "@/lib/api/hooks/use-sub-agents";

export default function AgentSubAgentsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: agentsData } = useAgents({ limit: 200 });
  const { data: attachedSubAgents = [] } = useAgentSubAgents(agentId || "");
  const attachSubAgent = useAttachSubAgent();
  const detachSubAgent = useDetachSubAgent();

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return <div className="py-12 text-center text-destructive">{error?.message || "Agent not found"}</div>;
  }

  const attachedIds = new Set(attachedSubAgents.map((subAgent) => String(subAgent.id)));
  const availableAgents = (agentsData?.agents || []).filter((candidate) => candidate.id !== agent.id);
  const attachedCount = useMemo(() => attachedSubAgents.length, [attachedSubAgents]);

  return (
    <div>
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3 border-b border-border/50 pb-5 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5">
          <div className="rounded-lg border border-border/60 px-4 py-4">
            <div className="text-[13px] font-medium">Delegation Scope</div>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
              Select which agents this coordinator can delegate work to. These agents will be available as sub-agents during execution.
            </p>
            <div className="mt-3 text-[12px] text-muted-foreground">
              {attachedCount} sub-agent{attachedCount === 1 ? "" : "s"} attached
            </div>
          </div>
        </div>

        {availableAgents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
            <p className="text-[13px] text-muted-foreground">No other agents exist in this deployment yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[13px] font-medium text-muted-foreground">
              Available Agents
            </div>
            <div className="space-y-1.5">
              {availableAgents.map((subAgent) => {
                const attached = attachedIds.has(String(subAgent.id));
                return (
                  <div
                    key={subAgent.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 px-3.5 py-2.5"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="block truncate text-[14px] font-medium leading-5">
                        {subAgent.name}
                      </span>
                      <p className="line-clamp-1 text-[13px] leading-5 text-muted-foreground">
                        {subAgent.description || "No description"}
                      </p>
                    </div>
                    <Button
                      variant={attached ? "outline" : "default"}
                      size="sm"
                      className="h-8 px-3 text-[12px]"
                      disabled={attachSubAgent.isPending || detachSubAgent.isPending}
                      onClick={() =>
                        attached
                          ? detachSubAgent.mutate({
                              agentId: agent.id,
                              subAgentId: String(subAgent.id),
                            })
                          : attachSubAgent.mutate({
                              agentId: agent.id,
                              subAgentId: String(subAgent.id),
                            })
                      }
                    >
                      {attached ? "Remove" : "Add"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
