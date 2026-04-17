import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useGenerateAgentTicket } from "@/lib/hooks/use-generate-ticket";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import { useParams } from "react-router";

export default function AgentDebugPage() {
    const { agentId } = useParams<{ agentId: string }>();
    const { data: agent } = useAgentById(agentId || "");
    const { selectedDeployment } = useProjects();
    const generateTicketMutation = useGenerateAgentTicket();
    const [actorId, setActorId] = useState("");

    const handleTestAgent = async () => {
        if (!actorId || !agent || !selectedDeployment) return;

        try {
            const result = await generateTicketMutation.mutateAsync({
                deployment_id: String(selectedDeployment.id),
                agent_ids: [agent.id],
                actor_id: actorId,
                selected_agent_id: agent.id,
                expires_in: 60 * 60 * 12,
            });
            const testUrl = `https://${selectedDeployment.backend_host}/vanity/agents?ticket=${result.ticket}`;
            window.open(testUrl, "_blank");
        } catch (err) {
            console.error("Failed to generate ticket:", err);
        }
    };

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <h2 className="text-[14px] font-medium tracking-tight">
                    Test agent
                </h2>
                <p className="text-[13px] leading-5 text-muted-foreground">
                    Enter an actor ID. Missing actors are created automatically.
                </p>
            </div>

            <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                    <Label className="text-[13px]">Actor ID</Label>
                    <Input
                        className="h-9"
                        type="text"
                        value={actorId}
                        onChange={(e) => setActorId(e.target.value)}
                        placeholder="e.g. 123456789012345678"
                    />
                </div>
                <Button
                    className="h-9 px-3 text-[12px]"
                    disabled={
                        !actorId ||
                        generateTicketMutation.isPending ||
                        !selectedDeployment
                    }
                    onClick={handleTestAgent}
                >
                    {generateTicketMutation.isPending
                        ? "Opening..."
                        : "Test agent"}
                </Button>
            </div>
        </div>
    );
}
