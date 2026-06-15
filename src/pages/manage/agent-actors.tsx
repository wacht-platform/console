import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/fieldset";
import {
    useActors,
    type ActorSummary,
} from "@/lib/api/hooks/use-manage-apps";
import { useAgents } from "@/lib/api/hooks/use-agents";
import { useGenerateAgentTicket } from "@/lib/hooks/use-generate-ticket";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { AppManager } from "./app-manager";
import type { ManageListContext } from "./layout";

type AgentOption = { id: string; name: string };

export default function AgentActorsPage() {
    const { search } = useOutletContext<ManageListContext>();
    const { selectedDeployment } = useProjects();
    const { data, isLoading: isLoadingAgents } = useAgents({ limit: 100 });
    const generateTicket = useGenerateAgentTicket();
    const anchor = useComboboxAnchor();

    const agentOptions = useMemo<AgentOption[]>(
        () => (data?.agents ?? []).map((a) => ({ id: a.id, name: a.name })),
        [data?.agents],
    );

    const [selectedActor, setSelectedActor] = useState<ActorSummary | null>(null);
    const [selectedAgents, setSelectedAgents] = useState<AgentOption[]>([]);

    const closeDialog = () => {
        setSelectedActor(null);
        setSelectedAgents([]);
    };

    const openSession = async () => {
        if (!selectedActor || !selectedDeployment || selectedAgents.length === 0)
            return;
        try {
            const agentIds = selectedAgents.map((a) => a.id);
            const result = await generateTicket.mutateAsync({
                deployment_id: String(selectedDeployment.id),
                agent_ids: agentIds,
                selected_agent_id: agentIds[0],
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
                    </DialogHeader>
                    <DialogBody>
                        <div className="flex flex-col gap-1.5">
                            <Label>Agents</Label>
                            <Combobox
                                items={agentOptions}
                                multiple
                                value={selectedAgents}
                                onValueChange={setSelectedAgents}
                                isItemEqualToValue={(a, b) => a.id === b.id}
                                itemToStringLabel={(a) => a.name}
                            >
                                <ComboboxChips ref={anchor}>
                                    <ComboboxValue>
                                        {(value: AgentOption[]) =>
                                            value.map((item) => (
                                                <ComboboxChip key={item.id}>
                                                    {item.name}
                                                </ComboboxChip>
                                            ))
                                        }
                                    </ComboboxValue>
                                    <ComboboxChipsInput
                                        placeholder={
                                            isLoadingAgents
                                                ? "Loading agents…"
                                                : "Select agents…"
                                        }
                                        disabled={
                                            isLoadingAgents ||
                                            agentOptions.length === 0
                                        }
                                    />
                                </ComboboxChips>
                                <ComboboxContent anchor={anchor}>
                                    <ComboboxEmpty>
                                        No agents found.
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: AgentOption) => (
                                            <ComboboxItem
                                                key={item.id}
                                                value={item}
                                            >
                                                {item.name}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                        {!isLoadingAgents && agentOptions.length === 0 ? (
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
                                selectedAgents.length === 0 ||
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
