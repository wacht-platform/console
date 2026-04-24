import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { apiClient } from "@/lib/api/client";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Description, Field, Label } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { toast } from "sonner";
import SavePopup from "@/components/save-popup";
import { InlineLoader } from "@/components/ui/loading-screen";

type LlmProvider = "gemini" | "openai" | "openrouter";
type EmbeddingProvider = "gemini" | "openai" | "openrouter";
type EmbeddingDimension = 1536 | 768;
type AIStorageProvider = "s3";

const SUPPORTED_EMBEDDING_DIMENSIONS: EmbeddingDimension[] = [1536, 768];

interface AISettingsResponse {
    strong_llm_provider: LlmProvider;
    weak_llm_provider: LlmProvider;
    gemini_api_key_set: boolean;
    openrouter_api_key_set: boolean;
    openrouter_require_parameters: boolean;
    openai_api_key_set: boolean;
    anthropic_api_key_set: boolean;
    strong_model: string | null;
    weak_model: string | null;
    embedding_provider: EmbeddingProvider;
    embedding_model: string;
    embedding_dimension: EmbeddingDimension;
    storage: AIStorageSettingsResponse;
}

interface UpdateAISettingsRequest {
    strong_llm_provider?: LlmProvider;
    weak_llm_provider?: LlmProvider;
    gemini_api_key?: string;
    openrouter_api_key?: string;
    openrouter_require_parameters?: boolean;
    openai_api_key?: string;
    anthropic_api_key?: string;
    strong_model?: string;
    weak_model?: string;
    embedding_provider?: EmbeddingProvider;
    embedding_model?: string;
    embedding_dimension?: EmbeddingDimension;
    storage?: UpdateAIStorageSettingsRequest;
}

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

function extractErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
            response?: { data?: { errors?: Array<{ message: string }> } };
        };
        const msg = axiosError.response?.data?.errors?.[0]?.message;
        if (msg) return msg;
    }
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred";
}

function providerLabel(provider: LlmProvider): string {
    return { gemini: "Gemini", openai: "OpenAI", openrouter: "OpenRouter" }[provider];
}

function defaultEmbeddingModelFor(provider: EmbeddingProvider): string {
    return {
        gemini: "gemini-embedding-2-preview",
        openai: "text-embedding-3-small",
        openrouter: "openai/text-embedding-3-small",
    }[provider];
}

async function fetchAISettings(deploymentId: string): Promise<AISettingsResponse> {
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
    const [openrouterKey, setOpenrouterKey] = useState("");
    const [openrouterRequireParameters, setOpenrouterRequireParameters] = useState(true);
    const [strongLlmProvider, setStrongLlmProvider] = useState<LlmProvider>("gemini");
    const [weakLlmProvider, setWeakLlmProvider] = useState<LlmProvider>("gemini");
    const [openaiKey, setOpenaiKey] = useState("");
    const [anthropicKey, setAnthropicKey] = useState("");
    const [strongModel, setStrongModel] = useState("");
    const [weakModel, setWeakModel] = useState("");
    const [embeddingProvider, setEmbeddingProvider] = useState<EmbeddingProvider>("gemini");
    const [embeddingModel, setEmbeddingModel] = useState("");
    const [embeddingDimension, setEmbeddingDimension] = useState<EmbeddingDimension>(1536);
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
            setOpenrouterKey("");
            setOpenrouterRequireParameters(updatedSettings.openrouter_require_parameters);
            setStrongLlmProvider(updatedSettings.strong_llm_provider);
            setWeakLlmProvider(updatedSettings.weak_llm_provider);
            setOpenaiKey("");
            setAnthropicKey("");
            setStrongModel(updatedSettings.strong_model ?? "");
            setWeakModel(updatedSettings.weak_model ?? "");
            setEmbeddingProvider(updatedSettings.embedding_provider);
            setEmbeddingModel(updatedSettings.embedding_model);
            setEmbeddingDimension(updatedSettings.embedding_dimension);
            setStorageBucket("");
            setStorageRegion("");
            setStorageEndpoint("");
            setStorageRootPrefix("");
            setStorageAccessKeyId("");
            setStorageSecretAccessKey("");
            setForcePathStyle(updatedSettings.storage.force_path_style);
        },
        onError: (error: unknown) => {
            toast.error(extractErrorMessage(error));
        },
    });

    // Compute whether the selected provider has a key available (saved or newly entered)
    const providerKeyAvailable = useMemo(() => {
        const hasKey = (provider: LlmProvider): boolean => {
            switch (provider) {
                case "gemini":
                    return settings?.gemini_api_key_set || Boolean(geminiKey.trim());
                case "openai":
                    return settings?.openai_api_key_set || Boolean(openaiKey.trim());
                case "openrouter":
                    return settings?.openrouter_api_key_set || Boolean(openrouterKey.trim());
            }
        };
        return {
            strong: hasKey(strongLlmProvider),
            weak: hasKey(weakLlmProvider),
        };
    }, [settings, strongLlmProvider, weakLlmProvider, geminiKey, openaiKey, openrouterKey]);

    // Warn if OpenRouter is strong provider and require_parameters is being turned off
    const openrouterStrongWithoutRequireParams =
        strongLlmProvider === "openrouter" && !openrouterRequireParameters;

    const handleSave = () => {
        // Client-side provider/key consistency check (mirrors backend validation)
        if (!providerKeyAvailable.strong) {
            toast.error(
                `Strong provider is set to ${providerLabel(strongLlmProvider)} but no ${providerLabel(strongLlmProvider)} API key is configured`,
            );
            return;
        }
        if (!providerKeyAvailable.weak) {
            toast.error(
                `Weak provider is set to ${providerLabel(weakLlmProvider)} but no ${providerLabel(weakLlmProvider)} API key is configured`,
            );
            return;
        }
        if (openrouterStrongWithoutRequireParams) {
            toast.error(
                "OpenRouter is selected as the strong model provider but 'require parameters' is disabled. Enable it to ensure JSON schema output works correctly.",
            );
            return;
        }

        const updates: UpdateAISettingsRequest = {};
        if (strongLlmProvider !== settings?.strong_llm_provider) {
            updates.strong_llm_provider = strongLlmProvider;
        }
        if (weakLlmProvider !== settings?.weak_llm_provider) {
            updates.weak_llm_provider = weakLlmProvider;
        }
        if (geminiKey.trim()) updates.gemini_api_key = geminiKey.trim();
        if (openrouterKey.trim()) updates.openrouter_api_key = openrouterKey.trim();
        if (openrouterRequireParameters !== (settings?.openrouter_require_parameters ?? true)) {
            updates.openrouter_require_parameters = openrouterRequireParameters;
        }
        if (openaiKey.trim()) updates.openai_api_key = openaiKey.trim();
        if (anthropicKey.trim()) updates.anthropic_api_key = anthropicKey.trim();
        if (strongModel.trim() !== (settings?.strong_model ?? ""))
            updates.strong_model = strongModel.trim() || undefined;
        if (weakModel.trim() !== (settings?.weak_model ?? ""))
            updates.weak_model = weakModel.trim() || undefined;

        const trimmedEmbeddingModel = embeddingModel.trim();
        const embeddingProviderChanged = embeddingProvider !== settings?.embedding_provider;
        const embeddingModelChanged = trimmedEmbeddingModel !== (settings?.embedding_model ?? "");
        if (embeddingProviderChanged || embeddingModelChanged) {
            if (!trimmedEmbeddingModel) {
                toast.error("Embedding model cannot be empty");
                return;
            }
            // Backend requires provider and model to be sent together when either changes.
            updates.embedding_provider = embeddingProvider;
            updates.embedding_model = trimmedEmbeddingModel;
        }
        if (embeddingDimension !== settings?.embedding_dimension) {
            updates.embedding_dimension = embeddingDimension;
        }

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
            const hasAccessKeyId = Boolean(trimmedAccessKeyId || currentStorage?.access_key_id_set);
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
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
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

            const storageUpdates: UpdateAIStorageSettingsRequest = { provider: "s3" };
            if (forcePathStyle !== (currentStorage?.force_path_style ?? false)) {
                storageUpdates.force_path_style = forcePathStyle;
            }
            if (trimmedBucket) storageUpdates.bucket = trimmedBucket;
            if (trimmedRegion) storageUpdates.region = trimmedRegion;
            if (trimmedEndpoint) storageUpdates.endpoint = trimmedEndpoint;
            if (trimmedRootPrefix) storageUpdates.root_prefix = trimmedRootPrefix;
            if (trimmedAccessKeyId) storageUpdates.access_key_id = trimmedAccessKeyId;
            if (trimmedSecretAccessKey) storageUpdates.secret_access_key = trimmedSecretAccessKey;
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
        setOpenrouterKey("");
        setOpenrouterRequireParameters(settings?.openrouter_require_parameters ?? true);
        setStrongLlmProvider(settings?.strong_llm_provider ?? "gemini");
        setWeakLlmProvider(settings?.weak_llm_provider ?? "gemini");
        setOpenaiKey("");
        setAnthropicKey("");
        setStrongModel(settings?.strong_model ?? "");
        setWeakModel(settings?.weak_model ?? "");
        setEmbeddingProvider(settings?.embedding_provider ?? "gemini");
        setEmbeddingModel(settings?.embedding_model ?? "");
        setEmbeddingDimension(settings?.embedding_dimension ?? 1536);
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
        if (!settings) return;
        setForcePathStyle(settings.storage.force_path_style);
        setStrongLlmProvider(settings.strong_llm_provider);
        setWeakLlmProvider(settings.weak_llm_provider);
        setOpenrouterRequireParameters(settings.openrouter_require_parameters);
        setStrongModel(settings.strong_model ?? "");
        setWeakModel(settings.weak_model ?? "");
        setEmbeddingProvider(settings.embedding_provider);
        setEmbeddingModel(settings.embedding_model);
        setEmbeddingDimension(settings.embedding_dimension);
    }, [settings]);

    useEffect(() => {
        const currentStorage = settings?.storage;
        const hasApiKeyChanges = Boolean(
            geminiKey.trim() ||
                openrouterKey.trim() ||
                openrouterRequireParameters !== (settings?.openrouter_require_parameters ?? true) ||
                strongLlmProvider !== (settings?.strong_llm_provider ?? "gemini") ||
                weakLlmProvider !== (settings?.weak_llm_provider ?? "gemini") ||
                openaiKey.trim() ||
                anthropicKey.trim() ||
                strongModel.trim() !== (settings?.strong_model ?? "") ||
                weakModel.trim() !== (settings?.weak_model ?? "") ||
                embeddingProvider !== (settings?.embedding_provider ?? "gemini") ||
                embeddingModel.trim() !== (settings?.embedding_model ?? "") ||
                embeddingDimension !== (settings?.embedding_dimension ?? 1536),
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
        openrouterKey,
        openrouterRequireParameters,
        strongLlmProvider,
        weakLlmProvider,
        openaiKey,
        anthropicKey,
        strongModel,
        weakModel,
        embeddingProvider,
        embeddingModel,
        embeddingDimension,
        storageBucket,
        storageRegion,
        storageEndpoint,
        storageRootPrefix,
        storageAccessKeyId,
        storageSecretAccessKey,
        forcePathStyle,
    ]);

    if (isLoading) return <InlineLoader />;

    return (
        <div>
            <Heading>Configuration</Heading>
            <Text className="mt-2 text-zinc-500">
                Bring your own LLM, embedding, and storage credentials. Keys set here bypass
                platform billing.
            </Text>

            <SavePopup
                isDirty={isDirty}
                isSaving={updateMutation.isPending}
                onSave={handleSave}
                onCancel={handleCancel}
            />

            <div className="mt-8 space-y-10">
                {/* Storage */}
                <section className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Subheading>Storage</Subheading>
                            <StorageProviderBadge
                                provider={settings?.storage.provider ?? "s3"}
                                configured={Boolean(
                                    settings?.storage.bucket && settings?.storage.endpoint,
                                )}
                            />
                        </div>
                        <Text>
                            S3-compatible bucket for workspaces, uploads, and vector tables.
                        </Text>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-2">
                        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Connection
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                                Must match your provider exactly. Region mismatches fail silently.
                            </div>
                            <div className="mt-4 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field>
                                        <Label>Bucket</Label>
                                        <Input
                                            placeholder={
                                                settings?.storage.bucket ?? "customer-ai-storage"
                                            }
                                            value={storageBucket}
                                            onChange={(e) => setStorageBucket(e.target.value)}
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
                                            onChange={(e) => setStorageRegion(e.target.value)}
                                        />
                                    </Field>
                                </div>
                                <Field>
                                    <Label>Endpoint</Label>
                                    <Input
                                        placeholder={
                                            settings?.storage.endpoint ?? "https://s3.amazonaws.com"
                                        }
                                        value={storageEndpoint}
                                        onChange={(e) => setStorageEndpoint(e.target.value)}
                                    />
                                    <Description>
                                        Full `http` or `https` URL for the S3 endpoint.
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
                                        onChange={(e) => setStorageRootPrefix(e.target.value)}
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
                                Leave a credential field blank to keep the currently saved value.
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
                                        onChange={(e) => setStorageAccessKeyId(e.target.value)}
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
                                <div className="border-zinc-200 pt-10 dark:border-zinc-800">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                Force path-style requests
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Enable this for providers that expect path-style
                                                bucket addressing.
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

                {/* Model selection */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                    <div className="space-y-1">
                        <Subheading>Model Selection</Subheading>
                        <Text>
                            Agents route requests to a strong or weak tier per call.
                        </Text>
                        <Text className="text-xs text-zinc-500 mt-1">
                            <strong>Strong</strong>: JSON-schema output (planning, decisions).
                            Requires structured-output support.
                        </Text>
                        <Text className="text-xs text-zinc-500 mt-1">
                            <strong>Weak</strong>: tool calls, summaries, iteration. Requires
                            function-calling support.
                        </Text>
                    </div>
                    <div className="space-y-4">
                        {/* Provider/key warnings */}
                        {(!providerKeyAvailable.strong || !providerKeyAvailable.weak) && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
                                <div className="flex items-start gap-2">
                                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                                        {!providerKeyAvailable.strong && (
                                            <p>
                                                Strong provider ({providerLabel(strongLlmProvider)})
                                                has no API key — agents requiring structured output
                                                will fail.
                                            </p>
                                        )}
                                        {!providerKeyAvailable.weak &&
                                            weakLlmProvider !== strongLlmProvider && (
                                                <p>
                                                    Weak provider ({providerLabel(weakLlmProvider)})
                                                    has no API key — agents requiring tool calls will
                                                    fail.
                                                </p>
                                            )}
                                        {!providerKeyAvailable.weak &&
                                            weakLlmProvider === strongLlmProvider && (
                                                <p>
                                                    {providerLabel(strongLlmProvider)} has no API key
                                                    — configure the key below before saving.
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OpenRouter + require_parameters warning */}
                        {openrouterStrongWithoutRequireParams && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
                                <div className="flex items-start gap-2">
                                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300">
                                        OpenRouter is the strong provider but 'require parameters'
                                        is disabled — JSON schema output may route to models that
                                        don't support it.
                                    </p>
                                </div>
                            </div>
                        )}

                        <Field>
                            <Label>Strong provider</Label>
                            <Select
                                value={strongLlmProvider}
                                onValueChange={(v) => setStrongLlmProvider(v as LlmProvider)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field>
                            <Label>Weak provider</Label>
                            <Select
                                value={weakLlmProvider}
                                onValueChange={(v) => setWeakLlmProvider(v as LlmProvider)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field>
                            <Label>Strong model</Label>
                            <Input
                                placeholder={settings?.strong_model ?? "provider/strong-model"}
                                value={strongModel}
                                onChange={(e) => setStrongModel(e.target.value)}
                            />
                            <Description>Needs structured-output support.</Description>
                        </Field>
                        <Field>
                            <Label>Weak model</Label>
                            <Input
                                placeholder={settings?.weak_model ?? "provider/weak-model"}
                                value={weakModel}
                                onChange={(e) => setWeakModel(e.target.value)}
                            />
                            <Description>Needs function-calling support.</Description>
                        </Field>
                    </div>
                </section>

                <Divider soft />

                {/* Embeddings */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                    <div className="space-y-1">
                        <Subheading>Embeddings</Subheading>
                        <Text>
                            Powers semantic search over knowledge bases and agent memory.
                        </Text>
                        <Text className="text-xs text-zinc-500 mt-1">
                            Changing any field invalidates the vector store. All KB docs and
                            memories must be reindexed.
                        </Text>
                    </div>
                    <div className="space-y-4">
                        {(embeddingProvider !== (settings?.embedding_provider ?? "gemini") ||
                            embeddingModel.trim() !== (settings?.embedding_model ?? "") ||
                            embeddingDimension !== (settings?.embedding_dimension ?? 1536)) && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
                                <div className="flex items-start gap-2">
                                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300">
                                        Saving resets the vector store. Reindex all KB docs and
                                        memories before retrieval works again.
                                    </p>
                                </div>
                            </div>
                        )}
                        <Field>
                            <Label>Provider</Label>
                            <Select
                                value={embeddingProvider}
                                onValueChange={(v) => {
                                    const next = v as EmbeddingProvider;
                                    setEmbeddingProvider(next);
                                    // Suggest the provider's default model when the current model
                                    // is empty or matches the previous provider's default.
                                    const prevDefault = defaultEmbeddingModelFor(embeddingProvider);
                                    if (!embeddingModel.trim() || embeddingModel.trim() === prevDefault) {
                                        setEmbeddingModel(defaultEmbeddingModelFor(next));
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                                </SelectContent>
                            </Select>
                            <Description>Uses the provider's API key below.</Description>
                        </Field>
                        <Field>
                            <Label>Model</Label>
                            <Input
                                placeholder={defaultEmbeddingModelFor(embeddingProvider)}
                                value={embeddingModel}
                                onChange={(e) => setEmbeddingModel(e.target.value)}
                            />
                            <Description>Provider-specific model string.</Description>
                        </Field>
                        <Field>
                            <Label>Dimension</Label>
                            <Select
                                value={String(embeddingDimension)}
                                onValueChange={(v) =>
                                    setEmbeddingDimension(Number(v) as EmbeddingDimension)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select dimension" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_EMBEDDING_DIMENSIONS.map((d) => (
                                        <SelectItem key={d} value={String(d)}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Description>Must match the model's native output size.</Description>
                        </Field>
                    </div>
                </section>

                <Divider soft />

                {/* Google Gemini */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>Google Gemini</Subheading>
                            <StatusBadge isSet={settings?.gemini_api_key_set ?? false} />
                        </div>
                        <Text>Used when Gemini is selected above.</Text>
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

                {/* OpenRouter */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>OpenRouter</Subheading>
                            <StatusBadge isSet={settings?.openrouter_api_key_set ?? false} />
                        </div>
                        <Text>Used when OpenRouter is selected above.</Text>
                    </div>
                    <div className="space-y-4">
                        <Field>
                            <Label>API key</Label>
                            <Input
                                type="password"
                                placeholder={
                                    settings?.openrouter_api_key_set
                                        ? "••••••••••••••••"
                                        : "Enter OpenRouter API Key"
                                }
                                value={openrouterKey}
                                onChange={(e) => setOpenrouterKey(e.target.value)}
                                autoComplete="new-password"
                            />
                        </Field>
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    Require parameters
                                </div>
                                <div className="text-xs text-zinc-500">
                                    Skip endpoints that drop requested parameters. Required for
                                    strong-model routing.
                                </div>
                            </div>
                            <Switch
                                checked={openrouterRequireParameters}
                                onCheckedChange={setOpenrouterRequireParameters}
                            />
                        </div>
                    </div>
                </section>

                <Divider soft />

                {/* OpenAI */}
                <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2 items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>OpenAI</Subheading>
                            <StatusBadge isSet={settings?.openai_api_key_set ?? false} />
                        </div>
                        <Text>Used when OpenAI is selected above.</Text>
                    </div>
                    <Field>
                        <Label>API key</Label>
                        <Input
                            type="password"
                            placeholder={
                                settings?.openai_api_key_set
                                    ? "••••••••••••••••"
                                    : "Enter OpenAI API Key"
                            }
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            autoComplete="new-password"
                        />
                    </Field>
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

function StorageProviderBadge({
    provider,
    configured,
}: {
    provider: AIStorageProvider;
    configured: boolean;
}) {
    if (!configured) {
        return (
            <div className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Not configured
            </div>
        );
    }
    return (
        <div className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            {provider === "s3" ? "Customer S3" : "Customer S3"}
        </div>
    );
}
