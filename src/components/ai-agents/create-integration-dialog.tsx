import React, { useEffect, useState } from "react";
import { BsMicrosoftTeams } from "react-icons/bs";
import {
    useCreateIntegration,
    useUpdateIntegration,
} from "../../lib/api/hooks/use-integrations";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import type {
    AgentIntegration,
    CreateIntegrationRequest,
    IntegrationType,
} from "@/types/agent-integration";

interface CreateIntegrationDialogProps {
    open: boolean;
    onClose: () => void;
    agentId: string;
    integration?: AgentIntegration;
}

interface IntegrationFormData {
    name: string;
    integration_type: IntegrationType;
    app_id: string;
    app_password: string;
    tenant_id: string;
}

interface FormErrors {
    name?: string;
    app_id?: string;
    app_password?: string;
    tenant_id?: string;
}

const getDefaultFormData = (): IntegrationFormData => ({
    name: "",
    integration_type: "teams",
    app_id: "",
    app_password: "",
    tenant_id: "",
});

export function CreateIntegrationDialog({
    open,
    onClose,
    agentId,
    integration,
}: CreateIntegrationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] =
        useState<IntegrationFormData>(getDefaultFormData());
    const [errors, setErrors] = useState<FormErrors>({});
    const createMutation = useCreateIntegration(agentId);
    const updateMutation = useUpdateIntegration(agentId);
    const isEditing = !!integration;

    useEffect(() => {
        if (!open) {
            setFormData(getDefaultFormData());
            setErrors({});
            return;
        }

        if (!integration) {
            setFormData(getDefaultFormData());
            setErrors({});
            return;
        }

        const config = integration.config as Record<string, string>;
        setFormData({
            name: integration.name,
            integration_type: integration.integration_type,
            app_id: config.app_id || "",
            app_password: config.app_password || "",
            tenant_id: config.tenant_id || "",
        });
        setErrors({});
    }, [integration, open]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Integration name is required";
        } else if (formData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        if (!formData.app_id.trim()) {
            newErrors.app_id = "Microsoft App ID is required";
        }

        if (!formData.app_password.trim()) {
            newErrors.app_password = "Client Secret is required";
        }

        if (!formData.tenant_id.trim()) {
            newErrors.tenant_id = "Tenant ID is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const buildConfig = (): Record<string, unknown> => {
        return {
            app_id: formData.app_id.trim(),
            app_password: formData.app_password.trim(),
            tenant_id: formData.tenant_id.trim(),
        };
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && integration) {
                await updateMutation.mutateAsync({
                    id: integration.id,
                    name: formData.name.trim(),
                    config: buildConfig(),
                });
                toast.success("Integration updated successfully!");
            } else {
                const request: CreateIntegrationRequest = {
                    name: formData.name.trim(),
                    integration_type: formData.integration_type,
                    config: buildConfig(),
                };
                await createMutation.mutateAsync(request);
                toast.success("Integration created successfully!");
            }
            onClose();
        } catch (error) {
            console.error("Failed to save integration:", error);
            toast.error(
                `Failed to ${isEditing ? "update" : "create"} integration`,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (
        field: keyof IntegrationFormData,
        value: string,
    ) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field as keyof FormErrors]) {
            setErrors({ ...errors, [field]: undefined });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>
                        {isEditing ? "Edit Integration" : "Add Integration"}
                    </DialogTitle>
                    <DialogDescription>
                        Connect this agent to external platforms and services.
                    </DialogDescription>
                    {!isEditing && (
                        <p className="text-sm text-amber-600">
                            Integrations are a beta feature. Please email us to get access.
                        </p>
                    )}
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-hidden flex flex-col"
                >
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Integration Name{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    required
                                    placeholder="e.g. Production Teams Bot"
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "name",
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform</Label>
                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                    <BsMicrosoftTeams className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    <div>
                                        <div className="font-medium text-sm">
                                            Microsoft Teams
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Bot Framework integration
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Section */}
                        <div className="border-t pt-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <BsMicrosoftTeams className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                                    Teams Configuration
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="app_id">
                                        Microsoft App ID (Client ID){" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="app_id"
                                        required
                                        placeholder="e.g. 12345678-1234-1234-1234-123456789012"
                                        value={formData.app_id}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "app_id",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.app_id && (
                                        <p className="text-sm text-destructive">
                                            {errors.app_id}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Found in Azure Portal under App
                                        registrations
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="app_password">
                                        Client Secret{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="app_password"
                                        required
                                        type="password"
                                        placeholder="Enter your client secret"
                                        value={formData.app_password}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "app_password",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.app_password && (
                                        <p className="text-sm text-destructive">
                                            {errors.app_password}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Created in Azure Portal under
                                        Certificates & secrets
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tenant_id">
                                        Tenant ID{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="tenant_id"
                                        required
                                        placeholder="e.g. contoso.onmicrosoft.com"
                                        value={formData.tenant_id}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "tenant_id",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.tenant_id && (
                                        <p className="text-sm text-destructive">
                                            {errors.tenant_id}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Your Azure AD tenant identifier
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/40 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isEditing}>
                            {isSubmitting
                                ? isEditing
                                    ? "Updating..."
                                    : "Creating..."
                                : isEditing
                                  ? "Update Integration"
                                  : "Create Integration"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
