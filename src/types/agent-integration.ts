export type IntegrationType = "teams" | "whatsapp" | "clickup";

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

// Slack-specific config
export interface SlackConfig {
    bot_token: string;
    signing_secret: string;
    app_id?: string;
}

// WhatsApp-specific config
export interface WhatsAppConfig {
    phone_number_id: string;
    access_token: string;
    verify_token: string;
}

// Discord-specific config
export interface DiscordConfig {
    bot_token: string;
    application_id: string;
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
