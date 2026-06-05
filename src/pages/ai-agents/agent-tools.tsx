import { useParams } from "react-router";
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import {
  type ApprovalAction,
  useAttachTool,
  useDetachTool,
  useTools,
  useAgentTools,
  useSetAgentToolApprovalAction,
} from "@/lib/api/hooks/use-tools";
import type { AiToolType } from "@/types/ai-tool";

const APPROVAL_OPTIONS: { value: ApprovalAction; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "review", label: "Review" },
  { value: "deny", label: "Deny" },
];

const kindTone = (type: AiToolType): "info" | "mute" | "warn" =>
  type === "api" ? "info" : type === "platform_event" ? "warn" : "mute";

export default function AgentToolsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { data: toolsData, isLoading: toolsLoading } = useTools({ limit: 200 });
  const { data: attachedTools = [], isLoading: attachedLoading } =
    useAgentTools(agentId || "");
  const attachTool = useAttachTool(agentId || "");
  const detachTool = useDetachTool(agentId || "");
  const setApprovalAction = useSetAgentToolApprovalAction();

  if (isLoading || toolsLoading || attachedLoading) {
    return <ToolCardGridSkeleton />;
  }
  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  const attachedById = new Map(
    attachedTools.map((tool) => [String(tool.id), tool]),
  );
  const allTools = toolsData?.tools || [];
  const attachedList = allTools.filter((t) => attachedById.has(String(t.id)));
  const availableList = allTools.filter(
    (t) => !attachedById.has(String(t.id)),
  );

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
            icon={<WrenchScrewdriverIcon />}
            title="No tools attached"
            description="Attach a tool below to let this agent call it."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {attachedList.map((tool) => {
              const attached = attachedById.get(String(tool.id))!;
              const action = (attached.approval_action ??
                "allow") as ApprovalAction;
              return (
                <div
                  key={tool.id}
                  className="flex flex-col rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <WrenchScrewdriverIcon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-sm font-medium text-foreground">
                          {tool.name}
                        </span>
                        <Pill tone={kindTone(tool.tool_type)}>
                          {tool.tool_type.replace(/_/g, " ")}
                        </Pill>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => detachTool.mutate(String(tool.id))}
                      disabled={detachTool.isPending}
                      title="Detach"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {tool.description || "No description"}
                  </p>
                  <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      enabled
                    </span>
                    <div className="flex-1" />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      approval
                    </span>
                    <Select
                      value={action}
                      onValueChange={(value) =>
                        setApprovalAction.mutate({
                          agentId: agentId || "",
                          toolId: String(tool.id),
                          payload: { approval_action: value as ApprovalAction },
                        })
                      }
                      disabled={setApprovalAction.isPending}
                    >
                      <SelectTrigger className="h-7 w-[104px] text-[12px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPROVAL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
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
        {allTools.length === 0 ? (
          <EmptyState
            compact
            icon={<WrenchScrewdriverIcon />}
            title="No tools yet"
            description="Create tools in the Tools section, then attach them here."
          />
        ) : availableList.length === 0 ? (
          <EmptyState
            compact
            icon={<WrenchScrewdriverIcon />}
            title="All tools attached"
            description="Every tool in this deployment is already attached to this agent."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {availableList.map((tool) => (
              <div
                key={tool.id}
                className="flex flex-col rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <WrenchScrewdriverIcon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm font-medium text-foreground">
                        {tool.name}
                      </span>
                      <Pill tone={kindTone(tool.tool_type)}>
                        {tool.tool_type.replace(/_/g, " ")}
                      </Pill>
                    </div>
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-2 line-clamp-2 flex-1 text-xs leading-relaxed",
                    tool.description
                      ? "text-muted-foreground"
                      : "italic text-muted-foreground/70",
                  )}
                >
                  {tool.description || "No description"}
                </p>
                <div className="mt-3 flex items-center justify-end border-t border-border pt-3">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 px-3 text-[12px]"
                    onClick={() => attachTool.mutate(String(tool.id))}
                    disabled={attachTool.isPending}
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Attach
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ToolCardGridSkeleton() {
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
