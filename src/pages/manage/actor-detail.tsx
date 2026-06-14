import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
    ArrowLeftIcon,
    CheckIcon,
    ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/ui/page-head";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { VanityEmbedShell } from "@/components/vanity-embed-shell";
import { useAgents } from "@/lib/api/hooks/use-agents";
import { cn } from "@/lib/utils";

export default function ActorDetailPage() {
    const navigate = useNavigate();
    const { actorId } = useParams();
    const { data, isLoading } = useAgents({ limit: 100 });
    const agents = data?.agents ?? [];

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

    const triggerLabel = isLoading
        ? "Loading agents…"
        : agents.length === 0
          ? "No agents"
          : (selectedAgent?.name ?? "Select an agent");

    return (
        <div className="flex flex-col gap-4">
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 w-fit gap-1.5 text-muted-foreground"
                onClick={() => navigate("..")}
            >
                <ArrowLeftIcon className="size-4" />
                Back to Agent Actors
            </Button>
            <PageHead
                className="mb-0"
                eyebrow="Agent Actors"
                title="Agent Sessions"
                sub="Open a session for this actor as one of your agents."
                actions={
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoading || agents.length === 0}
                                className="w-56 justify-between gap-1.5"
                            >
                                <span className="truncate">{triggerLabel}</span>
                                <ChevronUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-1">
                            <div className="max-h-72 space-y-0.5 overflow-y-auto">
                                {agents.map((agent) => {
                                    const active = agent.id === selectedAgentId;
                                    return (
                                        <button
                                            key={agent.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedAgentId(agent.id);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition-colors",
                                                active
                                                    ? "bg-accent text-foreground"
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                            )}
                                        >
                                            <span className="truncate">
                                                {agent.name}
                                            </span>
                                            {active && (
                                                <CheckIcon className="size-3.5 text-primary" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                }
            />
            <div className="min-h-[600px] overflow-hidden rounded-lg border border-border">
                {!selectedAgentId ? (
                    <div className="p-10 text-center text-sm text-muted-foreground">
                        Select an agent to open a session for this actor.
                    </div>
                ) : (
                    <VanityEmbedShell
                        kind="agent"
                        actorId={actorId}
                        agentIds={[selectedAgentId]}
                    />
                )}
            </div>
        </div>
    );
}
