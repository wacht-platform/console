import { useParams } from "react-router";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import { useAgentKnowledgeBases, useAttachKnowledgeBase, useDetachKnowledgeBase, useKnowledgeBases } from "@/lib/api/hooks/use-knowledge-bases";

export default function AgentKnowledgeBasesPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: knowledgeBasesData } = useKnowledgeBases({ limit: 200 });
  const { data: attachedKnowledgeBases = [] } = useAgentKnowledgeBases(agentId || "");
  const attachKnowledgeBase = useAttachKnowledgeBase(agentId || "");
  const detachKnowledgeBase = useDetachKnowledgeBase(agentId || "");

  if (isLoading) return <InlineLoader />;
  if (error || !agent) {
    return <div className="py-12 text-center text-destructive">{error?.message || "Agent not found"}</div>;
  }

  const attachedIds = new Set(attachedKnowledgeBases.map((kb) => String(kb.id)));
  const allKnowledgeBases = knowledgeBasesData?.data || [];

  return (
    <div>
      {allKnowledgeBases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">No knowledge bases exist in this deployment yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {allKnowledgeBases.map((kb) => {
            const attached = attachedIds.has(String(kb.id));
            return (
              <div key={kb.id} className="flex items-start gap-3 rounded-lg border border-border/60 px-3.5 py-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                  <BookOpenIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="block truncate text-[14px] font-medium leading-5">{kb.name}</span>
                  <p className="text-[13px] leading-5 text-muted-foreground">{kb.documents_count} documents</p>
                </div>
                <Button
                  variant={attached ? "outline" : "default"}
                  size="sm"
                  className="h-8 px-3 text-[12px]"
                  disabled={attachKnowledgeBase.isPending || detachKnowledgeBase.isPending}
                  onClick={() => attached ? detachKnowledgeBase.mutate(String(kb.id)) : attachKnowledgeBase.mutate(String(kb.id))}
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
