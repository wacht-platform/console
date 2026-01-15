import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface GenerateTicketRequest {
    deployment_id: string;
    agent_ids: string[];
    context_group: string;
    expires_in?: number;
}

interface GenerateTicketResponse {
    ticket: string;
    expires_at: number;
}

export function useGenerateAgentTicket() {
    return useMutation({
        mutationFn: async (req: GenerateTicketRequest): Promise<GenerateTicketResponse> => {
            const response = await apiClient.post(`/deployments/${req.deployment_id}/agent/tickets`, {
                agent_ids: req.agent_ids,
                context_group: req.context_group,
                expires_in: req.expires_in,
            });
            return response.data;
        },
    });
}
