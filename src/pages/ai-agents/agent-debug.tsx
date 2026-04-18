import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useGenerateAgentTicket } from "@/lib/hooks/use-generate-ticket";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import { useParams } from "react-router";

export default function AgentDebugPage() {
    const { agentId } = useParams<{ agentId: string }>();
    const { data: agent } = useAgentById(agentId || "");
    const { selectedDeployment } = useProjects();
    const generateTicketMutation = useGenerateAgentTicket();

    const handleTestAgent = async () => {
        if (!agent || !selectedDeployment) return;

        try {
            const result = await generateTicketMutation.mutateAsync({
                deployment_id: String(selectedDeployment.id),
                agent_ids: [agent.id],
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
        <div className="space-y-3 flex justify-between">
            <div className="space-y-1">
                <h2 className="text-[14px] font-medium tracking-tight">
                    Test agent
                </h2>
                <p className="text-[13px] leading-5 text-muted-foreground">
                    Opens a debug session scoped to this deployment.
                </p>
            </div>

            <Button
                className="h-9 px-3 text-[12px]"
                disabled={
                    generateTicketMutation.isPending ||
                    !selectedDeployment ||
                    !agent
                }
                onClick={handleTestAgent}
            >
                {generateTicketMutation.isPending ? "Opening..." : "Test agent"}
            </Button>
        </div>
    );
}
