import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/20/solid";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Description, Field, Label } from "@/components/ui/fieldset";
import { InlineLoader } from "@/components/ui/loading-screen";
import { useProjects } from "@/lib/api/hooks/use-projects";
import {
    useComposioConfig,
    useDisableComposioApp,
    useUpdateComposioConfig,
} from "@/lib/api/hooks/use-composio-config";
import {
    ComposioAppPicker,
    ToolkitLogo,
} from "@/components/setup/composio-app-picker";
import type { ComposioEnabledApp } from "@/types/composio";

export default function ExtensionsPage() {
    const { selectedDeployment } = useProjects();
    const { data: composio, isLoading } = useComposioConfig();
    const isProduction = selectedDeployment?.mode === "production";

    if (isLoading) return <InlineLoader />;

    return (
        <div>
            <Heading>External extensions</Heading>
            <Text className="mt-2 text-zinc-500">
                Enable third-party integration providers for this deployment.
                Each extension exposes its apps to your agents.
            </Text>

            <div className="mt-8 space-y-4">
                <ComposioExtensionCard
                    enabled={composio?.enabled ?? false}
                    isProduction={isProduction ?? false}
                />
            </div>
        </div>
    );
}

function ComposioExtensionCard({
    enabled,
    isProduction,
}: {
    enabled: boolean;
    isProduction: boolean;
}) {
    const updateMutation = useUpdateComposioConfig();

    const handleToggle = (next: boolean) => {
        updateMutation.mutate({ enabled: next });
    };

    return (
        <div className="space-y-8">
            <header className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 px-5 py-4 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                        <ComposioMark />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Subheading>Composio</Subheading>
                            {enabled ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                    Enabled
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-zinc-500">
                                    Disabled
                                </span>
                            )}
                        </div>
                        <Text className="text-sm">
                            Give agents access to 1000+ SaaS integrations
                            (Gmail, GitHub, Slack, and more).
                        </Text>
                    </div>
                </div>
                <Switch
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={updateMutation.isPending}
                />
            </header>

            {enabled && <ComposioConfigPanel isProduction={isProduction} />}
        </div>
    );
}

function ComposioConfigPanel({ isProduction }: { isProduction: boolean }) {
    const { data: composio } = useComposioConfig();
    const updateMutation = useUpdateComposioConfig();
    const disableAppMutation = useDisableComposioApp();

    const [usePlatformKey, setUsePlatformKey] = useState(
        composio?.use_platform_key ?? true,
    );
    const [apiKey, setApiKey] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        if (!composio) return;
        setUsePlatformKey(composio.use_platform_key);
        setApiKey("");
    }, [composio]);

    // Production deployments must bring their own key.
    const effectiveUsePlatformKey = isProduction ? false : usePlatformKey;

    useEffect(() => {
        if (isProduction && usePlatformKey) {
            setUsePlatformKey(false);
        }
    }, [isProduction, usePlatformKey]);

    const credentialsDirty =
        effectiveUsePlatformKey !== (composio?.use_platform_key ?? true) ||
        Boolean(apiKey.trim());

    const saveCredentials = async () => {
        const updates: Parameters<typeof updateMutation.mutateAsync>[0] = {};
        if (effectiveUsePlatformKey !== (composio?.use_platform_key ?? true)) {
            updates.use_platform_key = effectiveUsePlatformKey;
        }
        if (apiKey.trim()) {
            updates.api_key = apiKey.trim();
        }
        if (Object.keys(updates).length === 0) {
            toast.error("Nothing to save");
            return;
        }
        await updateMutation.mutateAsync(updates);
        setApiKey("");
    };

    const enabledApps = composio?.enabled_apps ?? [];

    return (
        <div className="space-y-6">
            {/* Credentials */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Bring your own Composio key
                        </div>
                        <div className="text-xs text-zinc-500">
                            {isProduction
                                ? "Production deployments always use your own Composio account."
                                : "Turn on to use your own Composio account."}
                        </div>
                    </div>
                    <Switch
                        checked={!effectiveUsePlatformKey}
                        onCheckedChange={(checked) =>
                            setUsePlatformKey(!checked)
                        }
                        disabled={isProduction}
                    />
                </div>

                {!effectiveUsePlatformKey && (
                    <Field>
                        <Label>Composio API key</Label>
                        <Input
                            type="password"
                            placeholder={
                                composio?.api_key_set
                                    ? "••••••••••••••••"
                                    : "Enter Composio API key"
                            }
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            autoComplete="new-password"
                        />
                        <Description>
                            Get your key from the{" "}
                            <a
                                href="https://platform.composio.dev/settings"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                Composio dashboard
                            </a>
                            . Leave blank to keep the existing key.
                        </Description>
                    </Field>
                )}

                {credentialsDirty && (
                    <div className="flex justify-end">
                        <Button
                            onClick={saveCredentials}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending
                                ? "Saving…"
                                : "Save credentials"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Enabled apps */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Enabled apps
                        </div>
                        <div className="text-xs text-zinc-500">
                            {enabledApps.length}{" "}
                            {enabledApps.length === 1 ? "app" : "apps"}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPickerOpen(true)}
                    >
                        <PlusIcon className="mr-1.5 h-4 w-4" />
                        Add app
                    </Button>
                </div>

                {enabledApps.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {enabledApps.map((app) => (
                            <EnabledAppCard
                                key={app.slug}
                                app={app}
                                onRemove={() =>
                                    disableAppMutation.mutate(app.slug)
                                }
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-800">
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            No apps enabled yet
                        </div>
                        <div className="text-xs text-zinc-500">
                            Add your first app to make it available to agents.
                        </div>
                    </div>
                )}
            </div>

            <ComposioAppPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                existingSlugs={enabledApps.map((app) => app.slug)}
                usePlatformKey={effectiveUsePlatformKey}
                isProduction={isProduction}
            />
        </div>
    );
}

function EnabledAppCard({
    app,
    onRemove,
}: {
    app: ComposioEnabledApp;
    onRemove: () => void;
}) {
    const name = app.display_name || app.slug;
    return (
        <li className="group relative flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
            <ToolkitLogo logo={app.logo_url} name={name} size="md" />
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {name}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                    <span className="font-mono">{app.auth_config_id}</span>
                </div>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="flex-none rounded-md p-1.5 text-zinc-400 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-900 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label={`Remove ${name}`}
            >
                <TrashIcon className="h-4 w-4" />
            </button>
        </li>
    );
}

function ComposioMark() {
    return (
        <span className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            C
        </span>
    );
}

export function ComposioProductionWarning() {
    return (
        <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
            Production requires your own key
        </div>
    );
}
