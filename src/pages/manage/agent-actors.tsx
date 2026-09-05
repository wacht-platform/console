import { useMemo, useState } from "react";
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
import { useGenerateAccessSessionTicket } from "@/lib/hooks/use-generate-ticket";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { AppManager } from "./app-manager";
import type { ManageListContext } from "./layout";

export default function AgentActorsPage() {
    const { search } = useOutletContext<ManageListContext>();
    const { selectedDeployment } = useProjects();
    const { data, isLoading: isLoadingAgents } = useAgents({ limit: 100 });
    const generateTicket = useGenerateAccessSessionTicket();

    const agentOptions = useMemo(
        () =>
            (data?.agents ?? []).map((a) => ({
                id: a.id,
                name: a.name,
            })),
        [data?.agents],
    );

    const [selectedActor, setSelectedActor] = useState<ActorSummary | null>(
        null,
    );
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    const closeDialog = () => {
        setSelectedActor(null);
        setSelectedAgentIds([]);
    };

    const openSession = async () => {
        if (
            !selectedActor ||
            !selectedDeployment ||
            selectedAgentIds.length === 0
        )
            return;
        try {
            const result = await generateTicket.mutateAsync({
                deployment_id: String(selectedDeployment.id),
                ticket_type: "agent_access",
                agent_ids: selectedAgentIds,
                actor_id: selectedActor.id,
                expires_in: 60 * 60 * 12,
            });
            window.open(result.url, "_blank");
            closeDialog();
        } catch (e) {
            console.error("Failed to open agent session", e);
        }
    };

    const noAgents = !isLoadingAgents && agentOptions.length === 0;

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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Open a session</DialogTitle>
                        <DialogDescription>
                            Choose which agents should join this session.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <MultiSelect
                            label="Agents"
                            options={agentOptions}
                            selectedValues={selectedAgentIds}
                            onChange={setSelectedAgentIds}
                            placeholder={
                                isLoadingAgents
                                    ? "Loading agents…"
                                    : noAgents
                                      ? "No agents available"
                                      : "Select agents…"
                            }
                            disabled={isLoadingAgents || noAgents}
                            modal
                        />
                        {noAgents ? (
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
