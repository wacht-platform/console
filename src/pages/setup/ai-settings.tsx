import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { apiClient } from "@/lib/api/client";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import { Description, Field, Label } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import SavePopup from "@/components/save-popup";
import { InlineLoader } from "@/components/ui/loading-screen";

interface AISettingsResponse {
    gemini_api_key_set: boolean;
    openai_api_key_set: boolean;
    anthropic_api_key_set: boolean;
    storage: AIStorageSettingsResponse;
}

interface UpdateAISettingsRequest {
    gemini_api_key?: string;
    openai_api_key?: string;
    anthropic_api_key?: string;
    storage?: UpdateAIStorageSettingsRequest;
}

type AIStorageProvider = "s3";

interface AIStorageSettingsResponse {
    provider: AIStorageProvider;
    bucket: string | null;
    region: string | null;
    endpoint: string | null;
    root_prefix: string | null;
    force_path_style: boolean;
    access_key_id_set: boolean;
    secret_access_key_set: boolean;
}

interface UpdateAIStorageSettingsRequest {
    provider?: AIStorageProvider;
    bucket?: string;
    region?: string;
    endpoint?: string;
    root_prefix?: string;
    force_path_style?: boolean;
    access_key_id?: string;
    secret_access_key?: string;
}

async function fetchAISettings(
    deploymentId: string,
): Promise<AISettingsResponse> {
    const { data } = await apiClient.get<AISettingsResponse>(
        `/deployments/${deploymentId}/ai/settings`,
    );
    return data;
}

async function updateAISettings(
    deploymentId: string,
    settings: UpdateAISettingsRequest,
): Promise<AISettingsResponse> {
    const { data } = await apiClient.put<AISettingsResponse>(
        `/deployments/${deploymentId}/ai/settings`,
        settings,
    );
    return data;
}

export default function AISettingsPage() {
    const { selectedDeployment } = useProjects();
    const queryClient = useQueryClient();

    const [geminiKey, setGeminiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");
    const [anthropicKey, setAnthropicKey] = useState("");
    const [storageBucket, setStorageBucket] = useState("");
    const [storageRegion, setStorageRegion] = useState("");
    const [storageEndpoint, setStorageEndpoint] = useState("");
    const [storageRootPrefix, setStorageRootPrefix] = useState("");
    const [storageAccessKeyId, setStorageAccessKeyId] = useState("");
    const [storageSecretAccessKey, setStorageSecretAccessKey] = useState("");
    const [forcePathStyle, setForcePathStyle] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["ai-settings", selectedDeployment?.id],
        queryFn: () => fetchAISettings(selectedDeployment!.id),
        enabled: !!selectedDeployment,
    });

    const updateMutation = useMutation({
        mutationFn: (updates: UpdateAISettingsRequest) =>
            updateAISettings(selectedDeployment!.id, updates),
        onSuccess: (updatedSettings) => {
            queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
            toast.success("AI settings updated successfully");
            setIsDirty(false);
            setGeminiKey("");
            setOpenaiKey("");
            setAnthropicKey("");
            setStorageBucket("");
            setStorageRegion("");
            setStorageEndpoint("");
            setStorageRootPrefix("");
            setStorageAccessKeyId("");
            setStorageSecretAccessKey("");
            setForcePathStyle(updatedSettings.storage.force_path_style);
        },
        onError: (error: Error) => {
            toast.error(`Failed to update settings: ${error.message}`);
        },
    });

    const handleSave = () => {
        const updates: UpdateAISettingsRequest = {};
        if (geminiKey.trim()) updates.gemini_api_key = geminiKey.trim();
        if (openaiKey.trim()) updates.openai_api_key = openaiKey.trim();
        if (anthropicKey.trim())
            updates.anthropic_api_key = anthropicKey.trim();

        const currentStorage = settings?.storage;
        const trimmedBucket = storageBucket.trim();
        const trimmedRegion = storageRegion.trim();
        const trimmedEndpoint = storageEndpoint.trim();
        const trimmedRootPrefix = storageRootPrefix.trim();
        const trimmedAccessKeyId = storageAccessKeyId.trim();
        const trimmedSecretAccessKey = storageSecretAccessKey.trim();

        const storageChanged =
            forcePathStyle !== (currentStorage?.force_path_style ?? false) ||
            Boolean(
                trimmedBucket ||
                    trimmedRegion ||
                    trimmedEndpoint ||
                    trimmedRootPrefix ||
                    trimmedAccessKeyId ||
                    trimmedSecretAccessKey,
            );

        if (storageChanged) {
            const resolvedBucket = trimmedBucket || currentStorage?.bucket || "";
            const resolvedEndpoint = trimmedEndpoint || currentStorage?.endpoint || "";
            const hasAccessKeyId = Boolean(
                trimmedAccessKeyId || currentStorage?.access_key_id_set,
            );
            const hasSecretAccessKey = Boolean(
                trimmedSecretAccessKey || currentStorage?.secret_access_key_set,
            );

            if (!resolvedBucket) {
                toast.error("Customer S3 storage requires a bucket");
                return;
            }

            if (!resolvedEndpoint) {
                toast.error("Customer S3 storage requires an endpoint");
                return;
            }

            try {
                const parsed = new URL(resolvedEndpoint);
                if (
                    parsed.protocol !== "http:" &&
                    parsed.protocol !== "https:"
                ) {
                    throw new Error("invalid protocol");
                }
            } catch {
                toast.error("Storage endpoint must be a valid http or https URL");
                return;
            }

            if (!hasAccessKeyId) {
                toast.error("Customer S3 storage requires an access key ID");
                return;
            }

            if (!hasSecretAccessKey) {
                toast.error("Customer S3 storage requires a secret access key");
                return;
            }

            const storageUpdates: UpdateAIStorageSettingsRequest = {};
            storageUpdates.provider = "s3";
            if (forcePathStyle !== (currentStorage?.force_path_style ?? false)) {
                storageUpdates.force_path_style = forcePathStyle;
            }
            if (trimmedBucket) storageUpdates.bucket = trimmedBucket;
            if (trimmedRegion) storageUpdates.region = trimmedRegion;
            if (trimmedEndpoint) storageUpdates.endpoint = trimmedEndpoint;
            if (trimmedRootPrefix) storageUpdates.root_prefix = trimmedRootPrefix;
            if (trimmedAccessKeyId) {
                storageUpdates.access_key_id = trimmedAccessKeyId;
            }
            if (trimmedSecretAccessKey) {
                storageUpdates.secret_access_key = trimmedSecretAccessKey;
            }
            updates.storage = storageUpdates;
        }

        if (Object.keys(updates).length === 0) {
            toast.error("Please make at least one change before saving");
            return;
        }

        updateMutation.mutate(updates);
    };

    const handleCancel = () => {
        setGeminiKey("");
        setOpenaiKey("");
        setAnthropicKey("");
        setStorageBucket("");
        setStorageRegion("");
        setStorageEndpoint("");
        setStorageRootPrefix("");
        setStorageAccessKeyId("");
        setStorageSecretAccessKey("");
        setForcePathStyle(settings?.storage.force_path_style ?? false);
        setIsDirty(false);
    };

    useEffect(() => {
        if (!settings) {
            return;
        }

        setForcePathStyle(settings.storage.force_path_style);
    }, [settings]);

    useEffect(() => {
        const currentStorage = settings?.storage;
        const hasApiKeyChanges = Boolean(
            geminiKey.trim() || openaiKey.trim() || anthropicKey.trim(),
        );
        const hasStorageChanges =
            forcePathStyle !== (currentStorage?.force_path_style ?? false) ||
            Boolean(
                storageBucket.trim() ||
                    storageRegion.trim() ||
                    storageEndpoint.trim() ||
                    storageRootPrefix.trim() ||
                    storageAccessKeyId.trim() ||
                    storageSecretAccessKey.trim(),
            );

        setIsDirty(hasApiKeyChanges || hasStorageChanges);
    }, [
        settings,
        geminiKey,
        openaiKey,
        anthropicKey,
        storageBucket,
        storageRegion,
        storageEndpoint,
        storageRootPrefix,
        storageAccessKeyId,
        storageSecretAccessKey,
        forcePathStyle,
    ]);

    if (isLoading) {
        return <InlineLoader />;
    }

    return (
        <div>
            <Heading>AI Settings</Heading>
            <Text className="mt-2 text-zinc-500">
                Configure your own API keys to bypass platform usage billing for
                AI agents. When you provide your own keys, you won't be billed
                for AI usage on our platform.
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
                            <StatusBadge
                                isSet={settings?.gemini_api_key_set ?? false}
                            />
                        </div>
                        <Text>
                            Powers your AI agent's core reasoning and response
                            generation.
                        </Text>
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
                            placeholder={
                                settings?.gemini_api_key_set
                                    ? "••••••••••••••••"
                                    : "Enter Gemini API Key"
                            }
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>
                </section>

                <Divider soft />

                <section className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Subheading>Storage</Subheading>
                            <StorageProviderBadge
                                provider={settings?.storage.provider ?? "s3"}
                            />
                        </div>
                        <Text>
                            Configure the customer-managed S3 bucket used for
                            durable AI workspace data.
                        </Text>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-2">
                        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Connection
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                                Use the bucket and endpoint exactly as your S3
                                provider expects them.
                            </div>
                            <div className="mt-4 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field>
                                        <Label>Bucket</Label>
                                        <Input
                                            placeholder={
                                                settings?.storage.bucket ??
                                                "customer-ai-storage"
                                            }
                                            value={storageBucket}
                                            onChange={(e) =>
                                                setStorageBucket(e.target.value)
                                            }
                                        />
                                    </Field>

                                    <Field>
                                        <Label>Region</Label>
                                        <Input
                                            placeholder={
                                                settings?.storage.region ??
                                                "Optional, for example us-east-1"
                                            }
                                            value={storageRegion}
                                            onChange={(e) =>
                                                setStorageRegion(e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>

                                <Field>
                                    <Label>Endpoint</Label>
                                    <Input
                                        placeholder={
                                            settings?.storage.endpoint ??
                                            "https://s3.amazonaws.com"
                                        }
                                        value={storageEndpoint}
                                        onChange={(e) =>
                                            setStorageEndpoint(e.target.value)
                                        }
                                    />
                                    <Description>
                                        Full `http` or `https` URL for the S3
                                        endpoint.
                                    </Description>
                                </Field>

                                <Field>
                                    <Label>Root prefix</Label>
                                    <Input
                                        placeholder={
                                            settings?.storage.root_prefix ??
                                            "Optional, for example wacht"
                                        }
                                        value={storageRootPrefix}
                                        onChange={(e) =>
                                            setStorageRootPrefix(e.target.value)
                                        }
                                    />
                                    <Description>
                                        Optional folder prefix under the bucket.
                                    </Description>
                                </Field>
                            </div>
                        </div>

                        <div className="pt-6 lg:pl-8 lg:pt-0">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Credentials
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                                Leave a credential field blank to keep the currently
                                saved value.
                            </div>
                            <div className="mt-4 space-y-4">
                                <Field>
                                    <Label>Access key ID</Label>
                                    <Input
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder={
                                            settings?.storage.access_key_id_set
                                                ? "••••••••••••••••"
                                                : "Enter access key ID"
                                        }
                                        value={storageAccessKeyId}
                                        onChange={(e) =>
                                            setStorageAccessKeyId(e.target.value)
                                        }
                                    />
                                </Field>

                                <Field>
                                    <Label>Secret access key</Label>
                                    <Input
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder={
                                            settings?.storage.secret_access_key_set
                                                ? "••••••••••••••••"
                                                : "Enter secret access key"
                                        }
                                        value={storageSecretAccessKey}
                                        onChange={(e) =>
                                            setStorageSecretAccessKey(e.target.value)
                                        }
                                    />
                                </Field>

                                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                Force path-style requests
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Enable this for providers that expect
                                                path-style bucket addressing.
                                            </div>
                                        </div>
                                        <Switch
                                            checked={forcePathStyle}
                                            onCheckedChange={setForcePathStyle}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Divider soft />

                {/* OpenAI */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start opacity-70">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>OpenAI</Subheading>
                            <StatusBadge
                                isSet={settings?.openai_api_key_set ?? false}
                            />
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
                            <StatusBadge
                                isSet={settings?.anthropic_api_key_set ?? false}
                            />
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

function StorageProviderBadge({ provider }: { provider: AIStorageProvider }) {
    return (
        <div className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {provider === "s3" ? "Customer S3" : "Customer S3"}
        </div>
    );
}
