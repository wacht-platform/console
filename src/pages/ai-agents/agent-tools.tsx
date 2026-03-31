import { useParams } from "react-router";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import { useAttachTool, useDetachTool, useTools, useAgentTools } from "@/lib/api/hooks/use-tools";

export default function AgentToolsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: toolsData } = useTools({ limit: 200 });
  const { data: attachedTools = [] } = useAgentTools(agentId || "");
  const attachTool = useAttachTool(agentId || "");
  const detachTool = useDetachTool(agentId || "");

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return <div className="py-12 text-center text-destructive">{error?.message || "Agent not found"}</div>;
  }

  const attachedIds = new Set(attachedTools.map((tool) => String(tool.id)));
  const allTools = toolsData?.tools || [];

  return (
    <div>
      {allTools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">No tools exist in this deployment yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {allTools.map((tool) => {
            const attached = attachedIds.has(String(tool.id));
            return (
              <div key={tool.id} className="flex items-start gap-3 rounded-lg border border-border/60 px-3.5 py-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate text-[14px] font-medium leading-5">{tool.name}</span>
                    <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[11px] font-medium">
                      {tool.tool_type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="line-clamp-1 text-[13px] leading-5 text-muted-foreground">{tool.description || "No description"}</p>
                </div>
                <Button
                  variant={attached ? "outline" : "default"}
                  size="sm"
                  className="h-8 px-3 text-[12px]"
                  disabled={attachTool.isPending || detachTool.isPending}
                  onClick={() => attached ? detachTool.mutate(String(tool.id)) : attachTool.mutate(String(tool.id))}
                >
                  {attached ? "Remove" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
