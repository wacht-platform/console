import {
    useState,
    useEffect,
    useMemo,
    type ComponentProps,
    type FormEvent,
    type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Field, Label } from "@/components/ui/fieldset";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import {
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import SavePopup from "@/components/save-popup";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useTour } from "@/lib/tour";
import GoogleLogo from "@/assets/google.svg";
import OpenAiLogo from "@/assets/openai-logo.svg";
import OpenRouterLogo from "@/assets/openrouter-logo.svg";
import {
    type AiProviderProfile,
    type CreateAiProviderProfileRequest,
    type UpdateAiProviderProfileRequest,
    useAiProviderProfiles,
    useCreateAiProviderProfile,
    useDeleteAiProviderProfile,
    useUpdateAiProviderProfile,
} from "@/lib/api/hooks/use-ai-provider-profiles";

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
    return { gemini: "Gemini", openai: "OpenAI", openrouter: "OpenRouter" }[
        provider
    ];
}

function defaultEmbeddingModelFor(provider: EmbeddingProvider): string {
    return {
        gemini: "gemini-embedding-2-preview",
        openai: "text-embedding-3-small",
        openrouter: "openai/text-embedding-3-small",
    }[provider];
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
    const [openrouterKey, setOpenrouterKey] = useState("");
    const [openrouterRequireParameters, setOpenrouterRequireParameters] =
        useState(true);
    const [strongLlmProvider, setStrongLlmProvider] =
        useState<LlmProvider>("gemini");
    const [weakLlmProvider, setWeakLlmProvider] =
        useState<LlmProvider>("gemini");
    const [openaiKey, setOpenaiKey] = useState("");
    const [strongModel, setStrongModel] = useState("");
    const [weakModel, setWeakModel] = useState("");
    const [embeddingProvider, setEmbeddingProvider] =
        useState<EmbeddingProvider>("gemini");
    const [embeddingModel, setEmbeddingModel] = useState("");
    const [embeddingDimension, setEmbeddingDimension] =
        useState<EmbeddingDimension>(1536);
    const [storageBucket, setStorageBucket] = useState("");
    const [storageRegion, setStorageRegion] = useState("");
    const [storageEndpoint, setStorageEndpoint] = useState("");
    const [storageRootPrefix, setStorageRootPrefix] = useState("");
    const [storageAccessKeyId, setStorageAccessKeyId] = useState("");
    const [storageSecretAccessKey, setStorageSecretAccessKey] = useState("");
    const [forcePathStyle, setForcePathStyle] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] =
        useState<AiProviderProfile | null>(null);
    const [deletingProfile, setDeletingProfile] =
        useState<AiProviderProfile | null>(null);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["ai-settings", selectedDeployment?.id],
        queryFn: () => fetchAISettings(selectedDeployment!.id),
        enabled: !!selectedDeployment,
    });
    const { data: providerProfiles = [], isLoading: profilesLoading } =
        useAiProviderProfiles();
    const createProfileMutation = useCreateAiProviderProfile();
    const updateProfileMutation = useUpdateAiProviderProfile();
    const deleteProfileMutation = useDeleteAiProviderProfile();

    useTour("first-ai-settings", !isLoading);

    const updateMutation = useMutation({
        mutationFn: (updates: UpdateAISettingsRequest) =>
            updateAISettings(selectedDeployment!.id, updates),
        onSuccess: (updatedSettings) => {
            queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
            toast.success("AI settings updated successfully");
            setIsDirty(false);
            setGeminiKey("");
            setOpenrouterKey("");
            setOpenrouterRequireParameters(
                updatedSettings.openrouter_require_parameters,
            );
            setStrongLlmProvider(updatedSettings.strong_llm_provider);
            setWeakLlmProvider(updatedSettings.weak_llm_provider);
            setOpenaiKey("");
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

    const handleProfileSave = async (
        request:
            | CreateAiProviderProfileRequest
            | UpdateAiProviderProfileRequest,
    ) => {
        try {
            if (editingProfile) {
                await updateProfileMutation.mutateAsync({
                    profileId: editingProfile.id,
                    profile: request,
                });
                toast.success("Provider profile updated");
            } else {
                await createProfileMutation.mutateAsync(
                    request as CreateAiProviderProfileRequest,
                );
                toast.success("Provider profile created");
            }
            setProfileDialogOpen(false);
            setEditingProfile(null);
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    };

    const handleProfileDelete = async () => {
        if (!deletingProfile) return;
        try {
            await deleteProfileMutation.mutateAsync(deletingProfile.id);
            toast.success("Provider profile deleted");
            setDeletingProfile(null);
        } catch (error) {
            toast.error(extractErrorMessage(error));
        }
    };

    // Compute whether the selected provider has a key available (saved or newly entered)
    const providerKeyAvailable = useMemo(() => {
        const hasKey = (provider: LlmProvider): boolean => {
            switch (provider) {
                case "gemini":
                    return (
                        settings?.gemini_api_key_set ||
                        Boolean(geminiKey.trim())
                    );
                case "openai":
                    return (
                        settings?.openai_api_key_set ||
                        Boolean(openaiKey.trim())
                    );
                case "openrouter":
                    return (
                        settings?.openrouter_api_key_set ||
                        Boolean(openrouterKey.trim())
                    );
            }
        };
        return {
            strong: hasKey(strongLlmProvider),
            weak: hasKey(weakLlmProvider),
        };
    }, [
        settings,
        strongLlmProvider,
        weakLlmProvider,
        geminiKey,
        openaiKey,
        openrouterKey,
    ]);

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
        if (openrouterKey.trim())
            updates.openrouter_api_key = openrouterKey.trim();
        if (
            openrouterRequireParameters !==
            (settings?.openrouter_require_parameters ?? true)
        ) {
            updates.openrouter_require_parameters = openrouterRequireParameters;
        }
        if (openaiKey.trim()) updates.openai_api_key = openaiKey.trim();
        if (strongModel.trim() !== (settings?.strong_model ?? ""))
            updates.strong_model = strongModel.trim() || undefined;
        if (weakModel.trim() !== (settings?.weak_model ?? ""))
            updates.weak_model = weakModel.trim() || undefined;

        const trimmedEmbeddingModel = embeddingModel.trim();
        const embeddingProviderChanged =
            embeddingProvider !== settings?.embedding_provider;
        const embeddingModelChanged =
            trimmedEmbeddingModel !== (settings?.embedding_model ?? "");
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
            const resolvedBucket =
                trimmedBucket || currentStorage?.bucket || "";
            const resolvedEndpoint =
                trimmedEndpoint || currentStorage?.endpoint || "";
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
                toast.error(
                    "Storage endpoint must be a valid http or https URL",
                );
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

            const storageUpdates: UpdateAIStorageSettingsRequest = {
                provider: "s3",
            };
            if (
                forcePathStyle !== (currentStorage?.force_path_style ?? false)
            ) {
                storageUpdates.force_path_style = forcePathStyle;
            }
            if (trimmedBucket) storageUpdates.bucket = trimmedBucket;
            if (trimmedRegion) storageUpdates.region = trimmedRegion;
            if (trimmedEndpoint) storageUpdates.endpoint = trimmedEndpoint;
            if (trimmedRootPrefix)
                storageUpdates.root_prefix = trimmedRootPrefix;
            if (trimmedAccessKeyId)
                storageUpdates.access_key_id = trimmedAccessKeyId;
            if (trimmedSecretAccessKey)
                storageUpdates.secret_access_key = trimmedSecretAccessKey;
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
        setOpenrouterRequireParameters(
            settings?.openrouter_require_parameters ?? true,
        );
        setStrongLlmProvider(settings?.strong_llm_provider ?? "gemini");
        setWeakLlmProvider(settings?.weak_llm_provider ?? "gemini");
        setOpenaiKey("");
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
            openrouterRequireParameters !==
                (settings?.openrouter_require_parameters ?? true) ||
            strongLlmProvider !== (settings?.strong_llm_provider ?? "gemini") ||
            weakLlmProvider !== (settings?.weak_llm_provider ?? "gemini") ||
            openaiKey.trim() ||
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
        <div className="w-full pb-20" data-tour-id="llm-ai-settings-page">
            <div className="mb-5">
                <Heading className="text-xl font-semibold tracking-[-0.01em]">
                    Configuration
                </Heading>
                <Text className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">
                    Bring your own LLM, embedding, and storage credentials. Keys
                    here bypass platform billing.
                </Text>
            </div>

            <SavePopup
                isDirty={isDirty}
                isSaving={updateMutation.isPending}
                onSave={handleSave}
                onCancel={handleCancel}
            />

            <div className="divide-y divide-border/70">
                <section className="pb-5" data-tour-id="ai-settings-storage">
                    <SectionHeader
                        title="Storage"
                        description="S3-compatible bucket."
                    />
                    <div className="grid gap-x-3.5 gap-y-3 sm:grid-cols-2">
                        <CompactField label="Bucket">
                            <CompactInput
                                placeholder={
                                    settings?.storage.bucket ??
                                    "customer-ai-storage"
                                }
                                value={storageBucket}
                                onChange={(e) =>
                                    setStorageBucket(e.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Region">
                            <CompactInput
                                placeholder={
                                    settings?.storage.region ??
                                    "Optional, for example us-east-1"
                                }
                                value={storageRegion}
                                onChange={(e) =>
                                    setStorageRegion(e.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Endpoint" full>
                            <CompactInput
                                placeholder={
                                    settings?.storage.endpoint ??
                                    "https://s3.amazonaws.com"
                                }
                                value={storageEndpoint}
                                onChange={(e) =>
                                    setStorageEndpoint(e.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Root prefix" full>
                            <CompactInput
                                placeholder={
                                    settings?.storage.root_prefix ??
                                    "Optional, for example /agents"
                                }
                                value={storageRootPrefix}
                                onChange={(e) =>
                                    setStorageRootPrefix(e.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Access key ID">
                            <CompactInput
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
                        </CompactField>
                        <CompactField label="Secret access key">
                            <CompactInput
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
                        </CompactField>
                    </div>
                    <ToggleRow
                        title="Force path-style requests"
                        description="Enable for providers that expect path-style bucket addressing."
                        checked={forcePathStyle}
                        onCheckedChange={setForcePathStyle}
                    />
                </section>

                <section className="py-5" data-tour-id="ai-settings-models">
                    <SectionHeader
                        title="Model routing"
                        description="Strong for planning, weak for tool calls."
                    />

                    {(!providerKeyAvailable.strong ||
                        !providerKeyAvailable.weak ||
                        openrouterStrongWithoutRequireParams) && (
                        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            <ExclamationTriangleIcon className="h-3 w-3 shrink-0" />
                            <span>
                                {!providerKeyAvailable.strong
                                    ? `${providerLabel(strongLlmProvider)} has no strong-provider key`
                                    : !providerKeyAvailable.weak
                                      ? `${providerLabel(weakLlmProvider)} has no weak-provider key`
                                      : "OpenRouter require parameters must stay enabled for strong routing"}
                            </span>
                        </div>
                    )}

                    <div className="grid gap-x-3.5 gap-y-3 sm:grid-cols-2">
                        <CompactField label="Strong provider">
                            <ProviderSelect
                                value={strongLlmProvider}
                                onValueChange={(v) =>
                                    setStrongLlmProvider(v as LlmProvider)
                                }
                            />
                        </CompactField>
                        <CompactField label="Strong model">
                            <CompactInput
                                placeholder={
                                    settings?.strong_model ??
                                    "provider/strong-model"
                                }
                                value={strongModel}
                                onChange={(e) => setStrongModel(e.target.value)}
                            />
                        </CompactField>
                        <CompactField label="Weak provider">
                            <ProviderSelect
                                value={weakLlmProvider}
                                onValueChange={(v) =>
                                    setWeakLlmProvider(v as LlmProvider)
                                }
                            />
                        </CompactField>
                        <CompactField label="Weak model">
                            <CompactInput
                                placeholder={
                                    settings?.weak_model ??
                                    "provider/weak-model"
                                }
                                value={weakModel}
                                onChange={(e) => setWeakModel(e.target.value)}
                            />
                        </CompactField>
                    </div>
                </section>

                <section className="py-5" data-tour-id="ai-settings-embeddings">
                    <SectionHeader
                        title="Embeddings"
                        description="Semantic search over knowledge bases."
                        action={
                            (embeddingProvider !==
                                (settings?.embedding_provider ?? "gemini") ||
                                embeddingModel.trim() !==
                                    (settings?.embedding_model ?? "") ||
                                embeddingDimension !==
                                    (settings?.embedding_dimension ?? 1536)) && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                    <ExclamationTriangleIcon className="h-3 w-3" />
                                    Invalidates vector store
                                </span>
                            )
                        }
                    />
                    <div className="grid gap-x-3.5 gap-y-3 sm:grid-cols-3">
                        <CompactField label="Provider">
                            <Select
                                value={embeddingProvider}
                                onValueChange={(v) => {
                                    const next = v as EmbeddingProvider;
                                    setEmbeddingProvider(next);
                                    const prevDefault =
                                        defaultEmbeddingModelFor(
                                            embeddingProvider,
                                        );
                                    if (
                                        !embeddingModel.trim() ||
                                        embeddingModel.trim() === prevDefault
                                    ) {
                                        setEmbeddingModel(
                                            defaultEmbeddingModelFor(next),
                                        );
                                    }
                                }}
                            >
                                <CompactSelectTrigger>
                                    <SelectValue placeholder="Select provider" />
                                </CompactSelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">
                                        Gemini
                                    </SelectItem>
                                    <SelectItem value="openai">
                                        OpenAI
                                    </SelectItem>
                                    <SelectItem value="openrouter">
                                        OpenRouter
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </CompactField>
                        <CompactField label="Model">
                            <CompactInput
                                placeholder={defaultEmbeddingModelFor(
                                    embeddingProvider,
                                )}
                                value={embeddingModel}
                                onChange={(e) =>
                                    setEmbeddingModel(e.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Dimension">
                            <Select
                                value={String(embeddingDimension)}
                                onValueChange={(v) =>
                                    setEmbeddingDimension(
                                        Number(v) as EmbeddingDimension,
                                    )
                                }
                            >
                                <CompactSelectTrigger>
                                    <SelectValue placeholder="Select dimension" />
                                </CompactSelectTrigger>
                                <SelectContent>
                                    {SUPPORTED_EMBEDDING_DIMENSIONS.map((d) => (
                                        <SelectItem key={d} value={String(d)}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CompactField>
                    </div>
                </section>

                <section className="py-5" data-tour-id="ai-settings-provider-keys">
                    <SectionHeader
                        title="Provider keys"
                        description="Leave blank to keep saved value."
                    />
                    <div className="space-y-4">
                        <ProviderKeyRow
                            logo={<GeminiProviderLogo />}
                            name="Google Gemini"
                            statusSet={settings?.gemini_api_key_set ?? false}
                            subtext={
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border-b border-border text-foreground"
                                >
                                    Google AI Studio
                                </a>
                            }
                        >
                            <CompactInput
                                type="password"
                                placeholder={
                                    settings?.gemini_api_key_set
                                        ? "••••••••••••••••"
                                        : "Enter Gemini API key"
                                }
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                autoComplete="new-password"
                            />
                        </ProviderKeyRow>

                        <ProviderKeyRow
                            logo={<OpenRouterProviderLogo />}
                            name="OpenRouter"
                            statusSet={
                                settings?.openrouter_api_key_set ?? false
                            }
                        >
                            <CompactInput
                                type="password"
                                placeholder={
                                    settings?.openrouter_api_key_set
                                        ? "••••••••••••••••"
                                        : "Enter OpenRouter API key"
                                }
                                value={openrouterKey}
                                onChange={(e) =>
                                    setOpenrouterKey(e.target.value)
                                }
                                autoComplete="new-password"
                            />
                            <ToggleRow
                                title="Require parameters"
                                description="Skip endpoints that drop params."
                                checked={openrouterRequireParameters}
                                onCheckedChange={
                                    setOpenrouterRequireParameters
                                }
                            />
                        </ProviderKeyRow>

                        <ProviderKeyRow
                            logo={<OpenAiProviderLogo />}
                            name="OpenAI"
                            statusSet={settings?.openai_api_key_set ?? false}
                        >
                            <CompactInput
                                type="password"
                                placeholder={
                                    settings?.openai_api_key_set
                                        ? "••••••••••••••••"
                                        : "sk-..."
                                }
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                autoComplete="new-password"
                            />
                        </ProviderKeyRow>
                    </div>
                </section>

                <section className="py-5" data-tour-id="ai-settings-openai-profiles">
                    <SectionHeader
                        title="OpenAI profiles"
                        description="Per-agent keys and endpoints."
                        action={
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    setEditingProfile(null);
                                    setProfileDialogOpen(true);
                                }}
                            >
                                <PlusIcon className="h-3.5 w-3.5" />
                                New profile
                            </Button>
                        }
                    />
                    {profilesLoading ? (
                        <InlineLoader />
                    ) : providerProfiles.length > 0 ? (
                        <div className="space-y-3">
                            {providerProfiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="grid gap-2 sm:grid-cols-[1fr_auto]"
                                >
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="truncate text-[12.5px] font-medium text-foreground">
                                                {profile.name}
                                            </span>
                                            <StatusBadge
                                                isSet={profile.enabled}
                                                onLabel="Enabled"
                                                offLabel="Disabled"
                                            />
                                        </div>
                                        <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                            {profile.slug}
                                            {profile.default_model
                                                ? ` · ${profile.default_model}`
                                                : ""}
                                            {profile.base_url
                                                ? ` · ${profile.base_url}`
                                                : ""}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => {
                                                setEditingProfile(profile);
                                                setProfileDialogOpen(true);
                                            }}
                                        >
                                            <PencilIcon className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                                setDeletingProfile(profile)
                                            }
                                        >
                                            <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 py-1">
                            <div className="text-[11.5px] text-muted-foreground">
                                No profiles yet.
                            </div>
                        </div>
                    )}
                </section>

            </div>

            <ProviderProfileDialog
                open={profileDialogOpen}
                profile={editingProfile}
                isSaving={
                    createProfileMutation.isPending ||
                    updateProfileMutation.isPending
                }
                onClose={() => {
                    setProfileDialogOpen(false);
                    setEditingProfile(null);
                }}
                onSave={handleProfileSave}
            />
            <ConfirmationDialog
                isOpen={!!deletingProfile}
                onClose={() => setDeletingProfile(null)}
                onConfirm={handleProfileDelete}
                title="Delete OpenAI profile"
                message={
                    deletingProfile
                        ? `Delete "${deletingProfile.name}"? Agents using this profile will fall back once the database clears the reference.`
                        : "Delete this profile?"
                }
                confirmText="Delete"
                isDestructive
                isLoading={deleteProfileMutation.isPending}
            />
        </div>
    );
}

function SectionHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-3.5 flex items-baseline gap-2.5">
            <h3 className="m-0 text-sm font-semibold leading-5 tracking-[-0.005em] text-foreground">
                {title}
            </h3>
            <p className="m-0 text-xs leading-5 text-muted-foreground">
                {description}
            </p>
            {action && <div className="ml-auto shrink-0">{action}</div>}
        </div>
    );
}

function CompactField({
    label,
    full,
    children,
}: {
    label: string;
    full?: boolean;
    children: ReactNode;
}) {
    return (
        <label
            className={cn(
                "flex min-w-0 flex-col gap-1.5",
                full && "sm:col-span-full",
            )}
        >
            <span className="text-[11.5px] font-medium leading-none text-foreground">
                {label}
            </span>
            {children}
        </label>
    );
}

function CompactInput({ className, ...props }: ComponentProps<typeof Input>) {
    return (
        <Input
            className={cn(
                "h-[30px] rounded-md border-input bg-input/40 px-2.5 text-[12.5px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-2",
                className,
            )}
            {...props}
        />
    );
}

function CompactSelectTrigger({
    className,
    children,
}: ComponentProps<typeof SelectTrigger>) {
    return (
        <SelectTrigger
            className={cn(
                "h-[30px] w-full rounded-md border-input bg-input/40 px-2.5 text-[12.5px] shadow-none focus:ring-2",
                className,
            )}
        >
            {children}
        </SelectTrigger>
    );
}

function ProviderSelect({
    value,
    onValueChange,
}: {
    value: LlmProvider;
    onValueChange: (value: string) => void;
}) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <CompactSelectTrigger>
                <SelectValue placeholder="Select provider" />
            </CompactSelectTrigger>
            <SelectContent>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
            </SelectContent>
        </Select>
    );
}

function ToggleRow({
    title,
    description,
    checked,
    onCheckedChange,
}: {
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-3 py-1 pt-3">
            <div className="min-w-0 flex-1">
                <div className="text-xs font-medium leading-4 text-foreground">
                    {title}
                </div>
                <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    {description}
                </div>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    );
}

function ProviderKeyRow({
    logo,
    name,
    statusSet,
    subtext,
    children,
}: {
    logo: ReactNode;
    name: string;
    statusSet: boolean;
    subtext?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] border border-border/60 bg-white">
                    {logo}
                </div>
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium leading-4 text-foreground">
                        <span className="truncate">{name}</span>
                        <StatusBadge isSet={statusSet} />
                    </div>
                    {subtext && (
                        <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                            {subtext}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function GeminiProviderLogo() {
    return <img src={GoogleLogo} alt="" className="h-3.5 w-3.5" />;
}

function OpenRouterProviderLogo() {
    return (
        <img src={OpenRouterLogo} alt="" className="h-4 w-4" />
    );
}

function OpenAiProviderLogo() {
    return <img src={OpenAiLogo} alt="" className="h-4 w-4" />;
}

interface ProviderProfileForm {
    name: string;
    slug: string;
    apiKey: string;
    baseUrl: string;
    organization: string;
    project: string;
    defaultModel: string;
    enabled: boolean;
    disablePromptCaching: boolean;
}

function ProviderProfileDialog({
    open,
    profile,
    isSaving,
    onClose,
    onSave,
}: {
    open: boolean;
    profile: AiProviderProfile | null;
    isSaving: boolean;
    onClose: () => void;
    onSave: (
        request:
            | CreateAiProviderProfileRequest
            | UpdateAiProviderProfileRequest,
    ) => Promise<void>;
}) {
    const [form, setForm] = useState<ProviderProfileForm>({
        name: "",
        slug: "",
        apiKey: "",
        baseUrl: "",
        organization: "",
        project: "",
        defaultModel: "",
        enabled: true,
        disablePromptCaching: false,
    });

    useEffect(() => {
        if (!open) return;
        setForm({
            name: profile?.name ?? "",
            slug: profile?.slug ?? "",
            apiKey: "",
            baseUrl: profile?.base_url ?? "",
            organization: profile?.organization ?? "",
            project: profile?.project ?? "",
            defaultModel: profile?.default_model ?? "",
            enabled: profile?.enabled ?? true,
            disablePromptCaching: profile?.disable_prompt_caching ?? false,
        });
    }, [open, profile]);

    const isEditing = !!profile;

    const handleNameChange = (name: string) => {
        setForm((prev) => ({
            ...prev,
            name,
            slug: prev.slug || slugify(name),
        }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const name = form.name.trim();
        const slug = form.slug.trim();
        const apiKey = form.apiKey.trim();

        if (!name) {
            toast.error("Profile name is required");
            return;
        }
        if (!slug) {
            toast.error("Profile slug is required");
            return;
        }
        if (!isEditing && !apiKey) {
            toast.error("API key is required for a new profile");
            return;
        }

        const common = {
            name,
            slug,
            base_url: optionalString(form.baseUrl),
            organization: optionalString(form.organization),
            project: optionalString(form.project),
            default_model: optionalString(form.defaultModel),
            enabled: form.enabled,
            disable_prompt_caching: form.disablePromptCaching,
        };

        if (isEditing) {
            await onSave({
                ...common,
                api_key: apiKey || undefined,
            });
        } else {
            await onSave({
                ...common,
                provider: "openai",
                api_key: apiKey,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? "Edit OpenAI profile"
                                : "New OpenAI profile"}
                        </DialogTitle>
                        <DialogDescription>
                            Profiles store separate OpenAI credentials and can
                            be selected by individual agents.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <Label>Name</Label>
                            <Input
                                value={form.name}
                                onChange={(event) =>
                                    handleNameChange(event.target.value)
                                }
                                placeholder="Production OpenAI"
                            />
                        </Field>
                        <Field>
                            <Label>Slug</Label>
                            <Input
                                value={form.slug}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        slug: slugify(event.target.value),
                                    })
                                }
                                placeholder="production-openai"
                            />
                        </Field>
                    </div>

                    <Field>
                        <Label>API key</Label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            value={form.apiKey}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    apiKey: event.target.value,
                                })
                            }
                            placeholder={
                                isEditing && profile?.api_key_set
                                    ? "Leave blank to keep current key"
                                    : "sk-..."
                            }
                        />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <Label>Default model</Label>
                            <Input
                                value={form.defaultModel}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        defaultModel: event.target.value,
                                    })
                                }
                                placeholder="gpt-5.1"
                            />
                        </Field>
                        <Field>
                            <Label>Base URL</Label>
                            <Input
                                value={form.baseUrl}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        baseUrl: event.target.value,
                                    })
                                }
                                placeholder="https://api.openai.com/v1"
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <Label>Organization</Label>
                            <Input
                                value={form.organization}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        organization: event.target.value,
                                    })
                                }
                                placeholder="Optional"
                            />
                        </Field>
                        <Field>
                            <Label>Project</Label>
                            <Input
                                value={form.project}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        project: event.target.value,
                                    })
                                }
                                placeholder="Optional"
                            />
                        </Field>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                        <div>
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Enabled
                            </div>
                            <div className="text-xs text-zinc-500">
                                Disabled profiles cannot be selected by agents.
                            </div>
                        </div>
                        <Switch
                            checked={form.enabled}
                            onCheckedChange={(enabled) =>
                                setForm({ ...form, enabled })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                        <div>
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                Disable prompt caching
                            </div>
                            <div className="text-xs text-zinc-500">
                                Skips the prompt_cache_key sent to this endpoint.
                                Turn on for OpenAI-compatible base URLs that
                                reject it.
                            </div>
                        </div>
                        <Switch
                            checked={form.disablePromptCaching}
                            onCheckedChange={(disablePromptCaching) =>
                                setForm({ ...form, disablePromptCaching })
                            }
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function optionalString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed || undefined;
}

function StatusBadge({
    isSet,
    onLabel = "Configured",
    offLabel = "Not set",
}: {
    isSet: boolean;
    onLabel?: string;
    offLabel?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-[10.5px] font-medium leading-4",
                isSet
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground",
            )}
        >
            <span
                className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isSet
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-muted-foreground",
                )}
            />
            {isSet ? onLabel : offLabel}
        </span>
    );
}
