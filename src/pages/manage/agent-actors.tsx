import { useState } from "react";
import { useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
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
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    const closeDialog = () => {
        setSelectedActor(null);
        setSelectedAgentIds([]);
    };

    const openSession = async () => {
        if (!selectedActor || !selectedDeployment || selectedAgentIds.length === 0)
            return;
        try {
            const result = await generateTicket.mutateAsync({
                deployment_id: String(selectedDeployment.id),
                agent_ids: selectedAgentIds,
                selected_agent_id: selectedAgentIds[0],
                actor_id: selectedActor.id,
                expires_in: 60 * 60 * 12,
            });
            window.open(
                `https://${selectedDeployment.backend_host}/vanity/agents?ticket=${result.ticket}`,
                "_blank",
            );
            closeDialog();
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
                onOpenChange={(open) => !open && closeDialog()}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Open a session</DialogTitle>
                        <DialogDescription>
                            Choose the agents to open a session as{" "}
                            <span className="font-medium text-foreground">
                                {actorLabel}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <MultiSelect
                            label="Agents"
                            modal
                            options={agents.map((agent) => ({
                                id: agent.id,
                                name: agent.name,
                                description: agent.description,
                            }))}
                            selectedValues={selectedAgentIds}
                            onChange={setSelectedAgentIds}
                            placeholder={
                                isLoadingAgents
                                    ? "Loading agents…"
                                    : "Select agents…"
                            }
                            disabled={isLoadingAgents || agents.length === 0}
                        />
                        {!isLoadingAgents && agents.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Create an agent first to open a session.
                            </p>
                        ) : null}
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button
                            onClick={openSession}
                            disabled={
                                selectedAgentIds.length === 0 ||
                                generateTicket.isPending
                            }
                        >
                            {generateTicket.isPending
                                ? "Opening…"
                                : "Open session"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
