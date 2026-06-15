import { useState } from "react";
import { useOutletContext } from "react-router";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { InlineLoader } from "@/components/ui/loading-screen";
import {
    useActors,
    type ActorSummary,
} from "@/lib/api/hooks/use-manage-apps";
import { useAgents } from "@/lib/api/hooks/use-agents";
import { useGenerateAgentTicket } from "@/lib/hooks/use-generate-ticket";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { AppManager } from "./app-manager";
import type { ManageListContext } from "./layout";

export default function AgentActorsPage() {
    const { search } = useOutletContext<ManageListContext>();
    const { selectedDeployment } = useProjects();
    const { data, isLoading: isLoadingAgents } = useAgents({ limit: 100 });
    const agents = data?.agents ?? [];
    const generateTicket = useGenerateAgentTicket();

    const [selectedActor, setSelectedActor] = useState<ActorSummary | null>(null);

    const openSession = async (agentId: string) => {
        if (!selectedActor || !selectedDeployment) return;
        try {
            const result = await generateTicket.mutateAsync({
                deployment_id: String(selectedDeployment.id),
                agent_ids: [agentId],
                selected_agent_id: agentId,
                actor_id: selectedActor.id,
                expires_in: 60 * 60 * 12,
            });
            window.open(
                `https://${selectedDeployment.backend_host}/vanity/agents?ticket=${result.ticket}`,
                "_blank",
            );
            setSelectedActor(null);
        } catch (e) {
            console.error("Failed to open agent session", e);
        }
    };

    const actorLabel =
        selectedActor?.display_name?.trim() || selectedActor?.external_key;

    return (
        <>
            <AppManager
                search={search}
                useApps={useActors}
                onRowClick={(actor) => setSelectedActor(actor)}
                getKey={(a) => a.id}
                getTitle={(a) => a.display_name?.trim() || a.external_key}
                getIdentifier={(a) => a.external_key}
                getActive={(a) => !a.archived_at}
                getSubtitle={(a) => a.subject_type}
                appHeader="Actor"
                identifierHeader="External key"
                activeLabel="active"
                inactiveLabel="archived"
                emptyTitle="No actors"
                emptyMessage="Actors will appear here once your agents start acting on behalf of subjects."
                searchEmptyTitle="No actors found"
                searchEmptyMessage="No actor matches that search."
            />

            <Dialog
                open={!!selectedActor}
                onOpenChange={(open) => !open && setSelectedActor(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Open a session</DialogTitle>
                        <DialogDescription>
                            Choose an agent to open a session as{" "}
                            <span className="font-medium text-foreground">
                                {actorLabel}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {isLoadingAgents ? (
                            <InlineLoader />
                        ) : agents.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Create an agent first to open a session.
                            </p>
                        ) : (
                            <div className="max-h-80 space-y-0.5 overflow-y-auto">
                                {agents.map((agent) => (
                                    <button
                                        key={agent.id}
                                        type="button"
                                        disabled={generateTicket.isPending}
                                        onClick={() => openSession(agent.id)}
                                        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <span className="truncate">
                                            {agent.name}
                                        </span>
                                        <ChevronRightIcon className="size-4 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    );
}
