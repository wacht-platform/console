import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface SessionTicketResult {
    ticket: string;
    expires_at: number;
    url: string;
}

interface GenerateTicketRequest {
    deployment_id: string;
    agent_ids: string[];
    selected_agent_id?: string;
    expires_in?: number;
}

/**
 * Console preview ticket (pins to the deployment debug actor). Used by the
 * "Test agent" flow.
 */
export function useGenerateAgentTicket() {
    return useMutation({
        mutationFn: async (
            req: GenerateTicketRequest,
        ): Promise<SessionTicketResult> => {
            const response = await apiClient.post(
                `/deployments/${req.deployment_id}/session/tickets`,
                {
                    ticket_type: "agent_access",
                    agent_ids: req.agent_ids,
                    selected_agent_id: req.selected_agent_id,
                    expires_in: req.expires_in,
                },
            );
            return response.data;
        },
    });
}

interface AccessSessionTicketRequest {
    deployment_id: string;
    ticket_type:
        | "agent_access"
        | "webhook_app_access"
        | "api_auth_access"
        | "impersonation";
    agent_ids?: string[];
    actor_id?: string;
    webhook_app_slug?: string;
    api_auth_app_slug?: string;
    expires_in?: number;
}

/**
 * Deployment-scoped (backend-kind) session ticket for the selected deployment —
 * honors actor_id and uses the real deployment. Used across the Access page.
 */
export function useGenerateAccessSessionTicket() {
    return useMutation({
        mutationFn: async ({
            deployment_id,
            ...body
        }: AccessSessionTicketRequest): Promise<SessionTicketResult> => {
            const response = await apiClient.post(
                `/deployments/${deployment_id}/access/session-ticket`,
                body,
            );
            return response.data;
        },
    });
}
