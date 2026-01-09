import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Field, Label, Description } from "../ui/fieldset";
import {
    Dialog,
    DialogActions,
    DialogBody,
    DialogDescription,
    DialogTitle,
} from "../ui/dialog";
import { useCreateIntegration, useUpdateIntegration } from "../../lib/api/hooks/use-integrations";
import type { AgentIntegration, IntegrationType, CreateIntegrationRequest } from "@/types/agent-integration";
import { SiWhatsapp, SiClickup } from "react-icons/si";
import { BsMicrosoftTeams } from "react-icons/bs";

interface CreateIntegrationDialogProps {
    open: boolean;
    onClose: () => void;
    agentId: string;
    integration?: AgentIntegration;
}

interface IntegrationFormData {
    name: string;
    integration_type: IntegrationType;
    // Common config fields based on type
    app_id: string; // Used for Teams App ID, WhatsApp Phone ID, ClickUp Client ID
    app_password: string; // Used for Teams Password, WhatsApp Access Token, ClickUp Client Secret
    tenant_id: string; // Used for Teams Tenant ID
    bot_token: string; // 
    signing_secret: string; // Used for WhatsApp Verify Token, ClickUp Webhook Secret
    // ClickUp specfic
    api_token: string;
    team_id: string;
}

const getDefaultFormData = (): IntegrationFormData => ({
    name: "",
    integration_type: "teams",
    app_id: "",
    app_password: "",
    tenant_id: "",
    bot_token: "",
    signing_secret: "",
    api_token: "",
    team_id: "",
});

export function CreateIntegrationDialog({
    open,
    onClose,
    agentId,
    integration,
}: CreateIntegrationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<IntegrationFormData>(getDefaultFormData());
    const createMutation = useCreateIntegration(agentId);
    const updateMutation = useUpdateIntegration(agentId);

    const isEditing = !!integration;

    useEffect(() => {
        if (integration) {
            const config = integration.config as Record<string, string>;
            setFormData({
                name: integration.name,
                integration_type: integration.integration_type,
                app_id: config.app_id || config.client_id || config.phone_number_id || "",
                app_password: config.app_password || config.client_secret || config.access_token || "",
                tenant_id: config.tenant_id || "",
                bot_token: config.bot_token || "",
                signing_secret: config.signing_secret || config.verify_token || config.webhook_secret || "",
                api_token: config.api_token || "",
                team_id: config.team_id || "",
            });
        } else {
            setFormData(getDefaultFormData());
        }
    }, [integration, open]);

    const buildConfig = (): Record<string, unknown> => {
        switch (formData.integration_type) {
            case "teams":
                return {
                    app_id: formData.app_id,
                    app_password: formData.app_password,
                    tenant_id: formData.tenant_id,
                };
            case "whatsapp":
                return {
                    phone_number_id: formData.app_id,
                    access_token: formData.app_password,
                    verify_token: formData.signing_secret,
                };
            case "clickup":
                return {
                    api_token: formData.api_token,
                    team_id: formData.team_id,
                    // If using OAuth later:
                    // client_id: formData.app_id,
                    // client_secret: formData.app_password,
                };
            default:
                return {};
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isEditing && integration) {
                await updateMutation.mutateAsync({
                    id: integration.id,
                    name: formData.name,
                    config: buildConfig(),
                });
            } else {
                const request: CreateIntegrationRequest = {
                    name: formData.name,
                    integration_type: formData.integration_type,
                    config: buildConfig(),
                };
                await createMutation.mutateAsync(request);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save integration:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderConfigFields = () => {
        switch (formData.integration_type) {
            case "teams":
                return (
                    <>
                        <div className="rounded-md bg-indigo-50 p-4 mb-4 dark:bg-indigo-900/20">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <BsMicrosoftTeams className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                                        Microsoft Teams Setup
                                    </h3>
                                    <div className="mt-2 text-sm text-indigo-700 dark:text-indigo-200">
                                        <p>
                                            You need to register an Azure Bot to get these credentials.{" "}
                                            <a
                                                href="https://portal.azure.com/#create/Microsoft.AzureBot"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-indigo-600 dark:hover:text-indigo-100"
                                            >
                                                Create Azure Bot &rarr;
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Field>
                            <Label>Microsoft App ID (Client ID)</Label>
                            <Input
                                required
                                placeholder="e.g. 3a5f7c2d-..."
                                value={formData.app_id}
                                onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <Label>Client Secret</Label>
                            <Description>From "Certificates & secrets" in Azure Portal</Description>
                            <Input
                                required
                                type="password"
                                placeholder="Value from Client secrets"
                                value={formData.app_password}
                                onChange={(e) => setFormData({ ...formData, app_password: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <Label>Tenant ID</Label>
                            <Description>Your Azure AD tenant ID (required for Single-Tenant bots)</Description>
                            <Input
                                required
                                placeholder="e.g. b7d70e3b-d7ba-44aa-91ac-..."
                                value={formData.tenant_id}
                                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                            />
                        </Field>
                    </>
                );

            case "whatsapp":
                return (
                    <>
                        <div className="rounded-md bg-green-50 p-4 mb-4 dark:bg-green-900/20">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <SiWhatsapp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                                        WhatsApp Business API
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700 dark:text-green-200">
                                        <p>
                                            <a
                                                href="https://developers.facebook.com/apps/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-green-600 dark:hover:text-green-100"
                                            >
                                                Go to Meta Developers &rarr;
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Field>
                            <Label>Phone Number ID</Label>
                            <Input
                                required
                                placeholder="From Meta Developer Portal"
                                value={formData.app_id}
                                onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <Label>System User Access Token</Label>
                            <Description>Permanent token from System User</Description>
                            <Input
                                required
                                type="password"
                                placeholder="EAAG..."
                                value={formData.app_password}
                                onChange={(e) => setFormData({ ...formData, app_password: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <Label>Verify Token</Label>
                            <Description>Used for webhook verification</Description>
                            <Input
                                required
                                placeholder="Your custom verify token"
                                value={formData.signing_secret}
                                onChange={(e) => setFormData({ ...formData, signing_secret: e.target.value })}
                            />
                        </Field>
                    </>
                );

            case "clickup":
                return (
                    <>
                        <div className="rounded-md bg-purple-50 p-4 mb-4 dark:bg-purple-900/20">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <SiClickup className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                        ClickUp Integration
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <Field>
                            <Label>API Token (Personal Access Token)</Label>
                            <Description>Your personal API token from ClickUp Settings</Description>
                            <Input
                                required
                                type="password"
                                placeholder="pk_..."
                                value={formData.api_token}
                                onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <Label>Team ID (Workspace ID)</Label>
                            <Description>The ID of the ClickUp Workspace (numeric)</Description>
                            <Input
                                required
                                placeholder="e.g. 12345678"
                                value={formData.team_id}
                                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                            />
                        </Field>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} size="lg">
            <form onSubmit={handleSubmit}>
                <DialogTitle>{isEditing ? "Edit Integration" : "Add Integration"}</DialogTitle>
                <DialogDescription>
                    Connect your AI agents to external platforms
                </DialogDescription>

                <DialogBody className="space-y-4">
                    <Field>
                        <Label>Name</Label>
                        <Input
                            required
                            placeholder="My Integration"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </Field>

                    <Field>
                        <Label>Platform</Label>
                        <div className="relative">
                            <Select
                                value={formData.integration_type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        integration_type: e.target.value as IntegrationType,
                                        // Reset config
                                        app_id: "",
                                        app_password: "",
                                        tenant_id: "",
                                        bot_token: "",
                                        signing_secret: "",
                                        api_token: "",
                                        team_id: "",
                                    })
                                }
                                disabled={isEditing}
                            >
                                <option value="teams">Microsoft Teams</option>
                                <option value="clickup">ClickUp</option>
                                <option value="whatsapp">WhatsApp</option>
                            </Select>
                        </div>
                    </Field>

                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4 space-y-4">
                        {renderConfigFields()}
                    </div>
                </DialogBody>

                <DialogActions>
                    <Button type="button" outline onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
