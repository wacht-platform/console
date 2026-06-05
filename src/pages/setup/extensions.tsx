import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    ExclamationTriangleIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/ui/page-head";
import { SectionLabel } from "@/components/ui/section-label";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
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
            <PageHead
                eyebrow="Agents platform"
                title="Extensions"
                sub="Enable third-party integration providers for this deployment. Each extension exposes its apps to your agents."
            />

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
            <header className="flex items-start justify-between gap-4 rounded-lg border border-border px-5 py-4 dark:border-border">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-border bg-card dark:border-border">
                        <ComposioMark />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-foreground">Composio</h3>
                            <Pill tone={enabled ? "ok" : "mute"}>
                                {enabled ? "enabled" : "disabled"}
                            </Pill>
                        </div>
                        <p className="text-sm text-muted-foreground text-sm">
                            Give agents access to 1000+ SaaS integrations
                            (Gmail, GitHub, Slack, and more).
                        </p>
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
        <div className="space-y-7">
            {/* Credentials */}
            <section className="flex flex-col gap-4">
                <SectionLabel>Credentials</SectionLabel>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                            Bring your own Composio key
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                                className="text-primary hover:underline"
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
            </section>

            {/* Enabled apps */}
            <section className="flex flex-col gap-3">
                <SectionLabel
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPickerOpen(true)}
                        >
                            <PlusIcon className="mr-1.5 h-4 w-4" />
                            Add app
                        </Button>
                    }
                >
                    Enabled apps · {enabledApps.length}
                </SectionLabel>

                <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    Inbound triggers (receiving Telegram messages, Slack DMs,
                    Gmail replies, etc.) aren't supported yet — agents can only
                    initiate calls outward. Coming soon.
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
                    <EmptyState
                        compact
                        icon={<PuzzlePieceIcon />}
                        title="No apps enabled yet"
                        description="Add your first app to make it available to agents."
                    />
                )}
            </section>

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
        <li className="group relative flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-border dark:border-border dark:hover:border-border">
            <ToolkitLogo logo={app.logo_url} name={name} size="md" />
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                    {name}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    <span className="font-mono">{app.auth_config_id}</span>
                </div>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="flex-none rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove ${name}`}
            >
                <TrashIcon className="h-4 w-4" />
            </button>
        </li>
    );
}

function ComposioMark() {
    return (
        <span className="font-heading text-lg font-semibold text-foreground">
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
