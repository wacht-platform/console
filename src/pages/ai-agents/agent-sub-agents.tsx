import { useParams } from "react-router";
import {
    UserGroupIcon,
    PlusIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import {
    CheckBadgeIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
    useAgentById,
    useAgents,
    type Agent,
} from "@/lib/api/hooks/use-agents";
import {
    useAgentSubAgents,
    useAttachSubAgent,
    useDetachSubAgent,
    useSetAgentRoleAgent,
} from "@/lib/api/hooks/use-sub-agents";

export default function AgentSubAgentsPage() {
    const { agentId } = useParams<{ agentId: string }>();
    const { data: agent, isLoading, error } = useAgentById(agentId || "");
    const { data: agentsData, isLoading: agentsLoading } = useAgents({
        limit: 200,
    });
    const { data: attachedSubAgents = [], isLoading: subsLoading } =
        useAgentSubAgents(agentId || "");
    const attachSubAgent = useAttachSubAgent();
    const detachSubAgent = useDetachSubAgent();
    const setRoleAgent = useSetAgentRoleAgent();

    if (isLoading || agentsLoading || subsLoading) {
        return <SubAgentGridSkeleton />;
    }
    if (error || !agent) {
        return (
            <div className="py-12 text-center text-destructive">
                {error?.message || "Agent not found"}
            </div>
        );
    }

    const attachedIds = new Set(
        attachedSubAgents.map((subAgent) => String(subAgent.id)),
    );
    const candidates = (agentsData?.agents || []).filter(
        (candidate) => candidate.id !== agent.id,
    );
    const attachedList = candidates.filter((c) =>
        attachedIds.has(String(c.id)),
    );
    const availableList = candidates.filter(
        (c) => !attachedIds.has(String(c.id)),
    );

    const currentReviewerId = agent.reviewer_agent_id
        ? String(agent.reviewer_agent_id)
        : null;
    const currentConversationId = agent.conversation_agent_id
        ? String(agent.conversation_agent_id)
        : null;
    const attachBusy = attachSubAgent.isPending || detachSubAgent.isPending;

    const renderCard = (subAgent: Agent, attached: boolean) => {
        const subId = String(subAgent.id);
        return (
            <SubAgentCard
                key={subAgent.id}
                subAgent={subAgent}
                attached={attached}
                isReviewer={currentReviewerId === subId}
                isConversation={currentConversationId === subId}
                attachBusy={attachBusy}
                roleBusy={setRoleAgent.isPending}
                onToggleAttach={() =>
                    attached
                        ? detachSubAgent.mutate({
                              agentId: agent.id,
                              subAgentId: subId,
                          })
                        : attachSubAgent.mutate({
                              agentId: agent.id,
                              subAgentId: subId,
                          })
                }
                onSetRole={(role, on) =>
                    setRoleAgent.mutate({
                        agentId: agent.id,
                        role,
                        targetAgentId: on ? null : subId,
                    })
                }
            />
        );
    };

    if (candidates.length === 0) {
        return (
            <EmptyState
                icon={<UserGroupIcon />}
                title="No agents to delegate to"
                description="Create another agent in this deployment and it will show up here, ready to be attached as a sub-agent."
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
                        icon={<UserGroupIcon />}
                        title="No sub-agents attached"
                        description="Add an agent below to delegate work to it."
                    />
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {attachedList.map((c) => renderCard(c, true))}
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
                        icon={<UserGroupIcon />}
                        title="All agents attached"
                        description="Every other agent in this deployment is already a sub-agent."
                    />
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {availableList.map((c) => renderCard(c, false))}
                    </div>
                )}
            </section>
        </div>
    );
}

function SubAgentGridSkeleton() {
    return (
        <div className="space-y-8">
            {[0, 1].map((section) => (
                <div key={section} className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Array.from({ length: section === 0 ? 2 : 4 }).map(
                            (_, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col rounded-lg border border-border bg-card p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3.5 w-1/2" />
                                        </div>
                                        <Skeleton className="h-8 w-16 rounded-md" />
                                    </div>
                                    <Skeleton className="mt-3 h-3 w-full" />
                                    <Skeleton className="mt-2 h-3 w-2/3" />
                                </div>
                            ),
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function SubAgentCard({
    subAgent,
    attached,
    isReviewer,
    isConversation,
    attachBusy,
    roleBusy,
    onToggleAttach,
    onSetRole,
}: {
    subAgent: Agent;
    attached: boolean;
    isReviewer: boolean;
    isConversation: boolean;
    attachBusy: boolean;
    roleBusy: boolean;
    onToggleAttach: () => void;
    onSetRole: (role: "reviewer" | "conversation", on: boolean) => void;
}) {
    return (
        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserGroupIcon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium leading-tight text-foreground">
                            {subAgent.name}
                        </span>
                        {isReviewer ? (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-primary">
                                <CheckBadgeIcon className="h-3 w-3" />
                                reviewer
                            </span>
                        ) : null}
                        {isConversation ? (
                            <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-primary">
                                <ChatBubbleLeftRightIcon className="h-3 w-3" />
                                conversation
                            </span>
                        ) : null}
                    </div>
                </div>
                <Button
                    variant={attached ? "outline" : "default"}
                    size="sm"
                    className="h-8 shrink-0 px-3 text-[12px]"
                    disabled={attachBusy}
                    onClick={onToggleAttach}
                >
                    {attached ? (
                        <>
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Remove
                        </>
                    ) : (
                        <>
                            <PlusIcon className="h-3.5 w-3.5" />
                            Add
                        </>
                    )}
                </Button>
            </div>

            <p
                className={cn(
                    "mt-2 line-clamp-2 flex-1 text-xs leading-relaxed",
                    subAgent.description
                        ? "text-muted-foreground"
                        : "italic text-muted-foreground/70",
                )}
            >
                {subAgent.description || "No description"}
            </p>

            {attached ? (
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                        delegate as
                    </span>
                    <Button
                        variant={isReviewer ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2.5 text-[12px]"
                        disabled={roleBusy}
                        onClick={() => onSetRole("reviewer", isReviewer)}
                    >
                        Reviewer
                    </Button>
                    <Button
                        variant={isConversation ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2.5 text-[12px]"
                        disabled={roleBusy}
                        onClick={() =>
                            onSetRole("conversation", isConversation)
                        }
                    >
                        Conversation
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
