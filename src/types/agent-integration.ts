export type IntegrationType = "teams";

export interface AgentIntegration {
    id: string;
    created_at: string;
    updated_at: string;
    deployment_id: string;
    agent_id: string;
    integration_type: IntegrationType;
    name: string;
    config: Record<string, unknown>;
    enabled: boolean;
}

// Teams-specific config
export interface TeamsConfig {
    app_id: string;
    app_password: string;
    tenant_id?: string;
}

export interface CreateIntegrationRequest {
    name: string;
    integration_type: IntegrationType;
    config: Record<string, unknown>;
}

export interface UpdateIntegrationRequest {
    name?: string;
    config?: Record<string, unknown>;
    enabled?: boolean;
}
