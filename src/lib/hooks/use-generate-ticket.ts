import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface GenerateTicketRequest {
    deployment_id: string;
    agent_ids: string[];
    selected_agent_id?: string;
    actor_id?: string;
    expires_in?: number;
}

interface GenerateTicketResponse {
    ticket: string;
    expires_at: number;
}

export function useGenerateAgentTicket() {
    return useMutation({
        mutationFn: async (req: GenerateTicketRequest): Promise<GenerateTicketResponse> => {
            const response = await apiClient.post(`/deployments/${req.deployment_id}/session/tickets`, {
                ticket_type: "agent_access",
                agent_ids: req.agent_ids,
                selected_agent_id: req.selected_agent_id,
                actor_id: req.actor_id,
                expires_in: req.expires_in,
            });
            return response.data;
        },
    });
}
