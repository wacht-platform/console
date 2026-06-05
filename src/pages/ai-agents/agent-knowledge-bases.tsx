import { useParams } from "react-router";
import { BookOpenIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import {
  useAgentKnowledgeBases,
  useAttachKnowledgeBase,
  useDetachKnowledgeBase,
  useKnowledgeBases,
} from "@/lib/api/hooks/use-knowledge-bases";

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

type KnowledgeBaseRow = {
  id: string | number;
  name: string;
  description?: string;
  documents_count: number;
  total_size: number;
  updated_at?: string;
};

function relativeUpdated(updatedAt?: string): string | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  return `updated ${formatDistanceToNow(date, { addSuffix: true })}`;
}

export default function AgentKnowledgeBasesPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: knowledgeBasesData, isLoading: kbsLoading } = useKnowledgeBases({
    limit: 200,
  });
  const { data: attachedKnowledgeBases = [], isLoading: attachedLoading } =
    useAgentKnowledgeBases(agentId || "");
  const attachKnowledgeBase = useAttachKnowledgeBase(agentId || "");
  const detachKnowledgeBase = useDetachKnowledgeBase(agentId || "");

  if (isLoading || kbsLoading || attachedLoading) {
    return <KbCardGridSkeleton />;
  }
  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  const attachedIds = new Set(
    attachedKnowledgeBases.map((kb) => String(kb.id)),
  );
  const all = (knowledgeBasesData?.data || []) as KnowledgeBaseRow[];
  const attachedList = all.filter((kb) => attachedIds.has(String(kb.id)));
  const availableList = all.filter((kb) => !attachedIds.has(String(kb.id)));

  const busy = attachKnowledgeBase.isPending || detachKnowledgeBase.isPending;

  if (all.length === 0) {
    return (
      <EmptyState
        icon={<BookOpenIcon />}
        title="No knowledge bases yet"
        description="Create a knowledge base in the Knowledge base section, then attach it here to give this agent retrieval."
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Attached */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Attached{" "}
          <span className="font-normal text-muted-foreground">
            · {attachedList.length}
          </span>
        </h3>
        {attachedList.length === 0 ? (
          <EmptyState
            compact
            icon={<BookOpenIcon />}
            title="No knowledge bases attached"
            description="Attach one below to give this agent retrieval."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {attachedList.map((kb) => (
              <KbCard
                key={kb.id}
                kb={kb}
                attached
                busy={busy}
                onToggle={() => detachKnowledgeBase.mutate(String(kb.id))}
              />
            ))}
          </div>
        )}
      </section>

      {/* Available */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Available{" "}
          <span className="font-normal text-muted-foreground">
            · {availableList.length}
          </span>
        </h3>
        {availableList.length === 0 ? (
          <EmptyState
            compact
            icon={<BookOpenIcon />}
            title="All knowledge bases attached"
            description="Every knowledge base in this deployment is already attached."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {availableList.map((kb) => (
              <KbCard
                key={kb.id}
                kb={kb}
                busy={busy}
                onToggle={() => attachKnowledgeBase.mutate(String(kb.id))}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KbCardGridSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KbCard({
  kb,
  attached,
  busy,
  onToggle,
}: {
  kb: KnowledgeBaseRow;
  attached?: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const updated = relativeUpdated(kb.updated_at);
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpenIcon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {kb.name}
            </span>
            {attached ? <Tag>attached</Tag> : null}
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {kb.documents_count} docs · {formatFileSize(kb.total_size)}
          </p>
        </div>
      </div>
      <p
        className={cn(
          "mt-2.5 line-clamp-2 flex-1 text-xs leading-relaxed",
          kb.description
            ? "text-muted-foreground"
            : "italic text-muted-foreground/70",
        )}
      >
        {kb.description || "No description"}
      </p>
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
        {updated ? (
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {updated}
          </span>
        ) : null}
        <div className="flex-1" />
        <Button
          variant={attached ? "outline" : "default"}
          size="sm"
          className="h-7 shrink-0 px-3 text-[12px]"
          disabled={busy}
          onClick={onToggle}
        >
          {attached ? (
            <>
              <XMarkIcon className="h-3.5 w-3.5" />
              Detach
            </>
          ) : (
            <>
              <PlusIcon className="h-3.5 w-3.5" />
              Attach
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
