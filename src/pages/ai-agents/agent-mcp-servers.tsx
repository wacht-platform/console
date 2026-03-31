import { useParams } from "react-router";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import { useAgentMcpServers, useAttachMcpServer, useDetachMcpServer, useMcpServers } from "@/lib/api/hooks/use-mcp-servers";

export default function AgentMcpServersPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: mcpServersData } = useMcpServers({ limit: 200, offset: 0 });
  const { data: attachedMcpServers = [] } = useAgentMcpServers(agentId || "");
  const attachMcpServer = useAttachMcpServer(agentId || "");
  const detachMcpServer = useDetachMcpServer(agentId || "");

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return <div className="py-12 text-center text-destructive">{error?.message || "Agent not found"}</div>;
  }

  const attachedIds = new Set(attachedMcpServers.map((server) => String(server.id)));
  const allServers = mcpServersData?.mcpServers || [];

  return (
    <div>
      {allServers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">No MCP servers exist in this deployment yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {allServers.map((server) => {
            const attached = attachedIds.has(String(server.id));
            return (
              <div key={server.id} className="flex items-start gap-3 rounded-lg border border-border/60 px-3.5 py-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-600">
                  <CodeBracketIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="block truncate text-[14px] font-medium leading-5">{server.name}</span>
                  <p className="truncate text-[13px] leading-5 text-muted-foreground">{server.config.endpoint}</p>
                </div>
                <Button
                  variant={attached ? "outline" : "default"}
                  size="sm"
                  className="h-8 px-3 text-[12px]"
                  disabled={attachMcpServer.isPending || detachMcpServer.isPending}
                  onClick={() => attached ? detachMcpServer.mutate(String(server.id)) : attachMcpServer.mutate(String(server.id))}
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
