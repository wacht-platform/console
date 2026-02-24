import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { apiClient } from "@/lib/api/client";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import SavePopup from "@/components/save-popup";
import { InlineLoader } from "@/components/ui/loading-screen";

interface AISettingsResponse {
    gemini_api_key_set: boolean;
    openai_api_key_set: boolean;
    anthropic_api_key_set: boolean;
}

interface UpdateAISettingsRequest {
    gemini_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
}

async function fetchAISettings(deploymentId: string): Promise<AISettingsResponse> {
    const { data } = await apiClient.get<AISettingsResponse>(
        `/deployments/${deploymentId}/ai/settings`
    );
    return data;
}

async function updateAISettings(
    deploymentId: string,
    settings: UpdateAISettingsRequest
): Promise<AISettingsResponse> {
    const { data } = await apiClient.put<AISettingsResponse>(
        `/deployments/${deploymentId}/ai/settings`,
        settings
    );
    return data;
}

export default function AISettingsPage() {
    const { selectedDeployment } = useProjects();
    const queryClient = useQueryClient();

    const [geminiKey, setGeminiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");
    const [anthropicKey, setAnthropicKey] = useState("");
    const [isDirty, setIsDirty] = useState(false);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["ai-settings", selectedDeployment?.id],
        queryFn: () => fetchAISettings(selectedDeployment!.id),
        enabled: !!selectedDeployment,
    });

    const updateMutation = useMutation({
        mutationFn: (updates: UpdateAISettingsRequest) =>
            updateAISettings(selectedDeployment!.id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
            toast.success("AI settings updated successfully");
            setIsDirty(false);
            setGeminiKey("");
            setOpenaiKey("");
            setAnthropicKey("");
        },
        onError: (error: Error) => {
            toast.error(`Failed to update settings: ${error.message}`);
        },
    });

    const handleSave = () => {
        const updates: UpdateAISettingsRequest = {};
        if (geminiKey.trim()) updates.gemini_api_key = geminiKey.trim();
        if (openaiKey.trim()) updates.openai_api_key = openaiKey.trim();
        if (anthropicKey.trim()) updates.anthropic_api_key = anthropicKey.trim();

        if (Object.keys(updates).length === 0) {
            toast.error("Please enter at least one API key to save");
            return;
        }

        updateMutation.mutate(updates);
    };

    const handleCancel = () => {
        setGeminiKey("");
        setOpenaiKey("");
        setAnthropicKey("");
        setIsDirty(false);
    };

    useEffect(() => {
        if (geminiKey.trim() || openaiKey.trim() || anthropicKey.trim()) {
            setIsDirty(true);
        } else {
            setIsDirty(false);
        }
    }, [geminiKey, openaiKey, anthropicKey]);

    if (isLoading) {
        return <InlineLoader />;
    }

    return (
        <div>
            <Heading>AI Settings</Heading>
            <Text className="mt-2 text-zinc-500">
                Configure your own API keys to bypass platform usage billing for AI agents.
                When you provide your own keys, you won't be billed for AI usage on our platform.
            </Text>

            <SavePopup
                isDirty={isDirty}
                isSaving={updateMutation.isPending}
                onSave={handleSave}
                onCancel={handleCancel}
            />

            <div className="mt-8 space-y-10">
                {/* Google Gemini */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>Google Gemini</Subheading>
                            <StatusBadge isSet={settings?.gemini_api_key_set ?? false} />
                        </div>
                        <Text>Powers your AI agent's core reasoning and response generation.</Text>
                        <Text className="text-xs">
                            Get your key from the{" "}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </Text>
                    </div>
                    <div className="space-y-1">
                        <Input
                            type="password"
                            placeholder={settings?.gemini_api_key_set ? "••••••••••••••••" : "Enter Gemini API Key"}
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>
                </section>

                <Divider soft />

                {/* OpenAI */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start opacity-70">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>OpenAI</Subheading>
                            <StatusBadge isSet={settings?.openai_api_key_set ?? false} />
                        </div>
                        <Text>Support for OpenAI models is coming soon.</Text>
                    </div>
                    <div className="space-y-1">
                        <Input
                            type="password"
                            placeholder="Coming soon"
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            disabled
                        />
                    </div>
                </section>

                <Divider soft />

                {/* Anthropic */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start opacity-70">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>Anthropic</Subheading>
                            <StatusBadge isSet={settings?.anthropic_api_key_set ?? false} />
                        </div>
                        <Text>Support for Claude models is coming soon.</Text>
                    </div>
                    <div className="space-y-1">
                        <Input
                            type="password"
                            placeholder="Coming soon"
                            value={anthropicKey}
                            onChange={(e) => setAnthropicKey(e.target.value)}
                            disabled
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatusBadge({ isSet }: { isSet: boolean }) {
    if (isSet) {
        return (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span>Configured</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
            <XCircleIcon className="h-3.5 w-3.5" />
            <span>Not set</span>
        </div>
    );
}
