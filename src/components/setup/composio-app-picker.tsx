import { useEffect, useMemo, useState } from "react";
import {
    MagnifyingGlassIcon,
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    BoltIcon,
} from "@heroicons/react/20/solid";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    useComposioToolkits,
    useComposioToolkitAuthConfigs,
    useEnableComposioApp,
} from "@/lib/api/hooks/use-composio-config";
import type {
    ComposioAuthConfigSummary,
    ComposioToolkit,
    EnableComposioAppAuth,
} from "@/types/composio";

interface ComposioAppPickerProps {
    open: boolean;
    onClose: () => void;
    existingSlugs: string[];
    /** true when the deployment is using the platform-managed Composio key. */
    usePlatformKey: boolean;
    /** true when this deployment is a production deployment. */
    isProduction: boolean;
}

export function ComposioAppPicker({
    open,
    onClose,
    existingSlugs,
    usePlatformKey,
    isProduction,
}: ComposioAppPickerProps) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selected, setSelected] = useState<ComposioToolkit | null>(null);
    const enableMutation = useEnableComposioApp();

    useEffect(() => {
        if (!open) {
            setSearch("");
            setDebouncedSearch("");
            setSelected(null);
        }
    }, [open]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isLoading, isError, error } = useComposioToolkits({
        search: debouncedSearch || undefined,
    });

    const toolkits = useMemo(() => {
        const enabled = new Set(existingSlugs);
        return (data?.toolkits ?? []).filter((t) => !enabled.has(t.slug));
    }, [data, existingSlugs]);

    const handleEnable = async (auth: EnableComposioAppAuth) => {
        if (!selected) return;
        await enableMutation.mutateAsync({
            slug: selected.slug,
            display_name: selected.name,
            logo_url: selected.logo ?? undefined,
            auth,
        });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => !o && !enableMutation.isPending && onClose()}
        >
            <DialogContent className="flex max-h-[min(640px,90vh)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                {selected ? (
                    <EnableStep
                        toolkit={selected}
                        onBack={() => setSelected(null)}
                        onEnable={handleEnable}
                        isPending={enableMutation.isPending}
                        usePlatformKey={usePlatformKey}
                        isProduction={isProduction}
                    />
                ) : (
                    <PickerStep
                        search={search}
                        setSearch={setSearch}
                        toolkits={toolkits}
                        isLoading={isLoading}
                        isError={isError}
                        error={error}
                        onPick={setSelected}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function PickerStep({
    search,
    setSearch,
    toolkits,
    isLoading,
    isError,
    error,
    onPick,
}: {
    search: string;
    setSearch: (v: string) => void;
    toolkits: ComposioToolkit[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    onPick: (t: ComposioToolkit) => void;
}) {
    return (
        <>
            <DialogHeader className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                <DialogTitle>Add a Composio app</DialogTitle>
                <DialogDescription>
                    Pick an app to expose to your agents. You'll need an auth
                    config from your Composio dashboard for each app.
                </DialogDescription>
            </DialogHeader>

            <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
                <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                        autoFocus
                        placeholder="Search Gmail, GitHub, Slack…"
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {isError ? (
                    <ErrorState error={error} />
                ) : isLoading ? (
                    <ToolkitSkeletonGrid />
                ) : toolkits.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-1 py-12 text-center">
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {search
                                ? "No apps match your search"
                                : "No apps found"}
                        </div>
                        <div className="text-xs text-zinc-500">
                            {search
                                ? "Try a different search term."
                                : "Make sure your Composio API key is configured."}
                        </div>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {toolkits.map((toolkit) => (
                            <li key={toolkit.slug}>
                                <button
                                    type="button"
                                    onClick={() => onPick(toolkit)}
                                    className="flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                                >
                                    <ToolkitLogo
                                        logo={toolkit.logo}
                                        name={toolkit.name}
                                        size="md"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {toolkit.name}
                                        </div>
                                        {toolkit.description && (
                                            <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                                                {toolkit.description}
                                            </div>
                                        )}
                                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500">
                                            <span className="font-mono">
                                                {toolkit.slug}
                                            </span>
                                            {toolkit.tool_count > 0 && (
                                                <>
                                                    <span className="text-zinc-300 dark:text-zinc-700">
                                                        •
                                                    </span>
                                                    <span>
                                                        {toolkit.tool_count}{" "}
                                                        tools
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

type EnableMode = "managed" | "custom" | `existing:${string}`;

function EnableStep({
    toolkit,
    onBack,
    onEnable,
    isPending,
    usePlatformKey,
    isProduction,
}: {
    toolkit: ComposioToolkit;
    onBack: () => void;
    onEnable: (auth: EnableComposioAppAuth) => void;
    isPending: boolean;
    usePlatformKey: boolean;
    isProduction: boolean;
}) {
    // Only fetch existing configs on BYO — the platform-managed key would expose other tenants' configs.
    const showExisting = !usePlatformKey;
    const { data: existingData, isLoading: existingLoading } =
        useComposioToolkitAuthConfigs(toolkit.slug, showExisting);
    const existingConfigs = existingData?.auth_configs ?? [];

    const [mode, setMode] = useState<EnableMode>("managed");
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [scopes, setScopes] = useState("");

    // When existing configs arrive, default to the first one.
    useEffect(() => {
        if (existingConfigs.length > 0 && mode === "managed") {
            setMode(`existing:${existingConfigs[0].id}`);
        }
    }, [existingConfigs, mode]);

    const supportsManaged =
        toolkit.auth_schemes.length === 0 ||
        !toolkit.auth_schemes.every((s) => s.toLowerCase() === "no_auth") ||
        toolkit.auth_schemes.some((s) => s.toLowerCase() === "oauth2");

    const confirm = () => {
        if (mode.startsWith("existing:")) {
            onEnable({
                type: "use_existing",
                auth_config_id: mode.slice("existing:".length),
            });
        } else if (mode === "managed") {
            onEnable({ type: "managed" });
        } else {
            if (!clientId.trim() || !clientSecret.trim()) return;
            onEnable({
                type: "custom",
                client_id: clientId.trim(),
                client_secret: clientSecret.trim(),
                scopes: scopes
                    .split(/[\s,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean),
            });
        }
    };

    const canConfirm =
        !isPending &&
        (mode.startsWith("existing:") ||
            mode === "managed" ||
            (clientId.trim() && clientSecret.trim()));

    return (
        <>
            <DialogHeader className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isPending}
                    className="mb-1 inline-flex items-center gap-1 self-start text-xs font-medium text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:hover:text-zinc-300"
                >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    Back to apps
                </button>
                <div className="flex items-start gap-3 mt-3">
                    <ToolkitLogo
                        logo={toolkit.logo}
                        name={toolkit.name}
                        size="lg"
                    />
                    <div className="min-w-0 flex-1">
                        <DialogTitle>{toolkit.name}</DialogTitle>
                        {toolkit.description && (
                            <DialogDescription className="mt-0.5 line-clamp-2">
                                {toolkit.description}
                            </DialogDescription>
                        )}
                    </div>
                </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-4">
                    {showExisting && (
                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Existing auth configs
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                    From your Composio account
                                </div>
                            </div>
                            {existingLoading ? (
                                <div className="h-10 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
                            ) : existingConfigs.length > 0 ? (
                                <div className="space-y-2">
                                    {existingConfigs.map((cfg) => (
                                        <ExistingAuthConfigCard
                                            key={cfg.id}
                                            config={cfg}
                                            selected={
                                                mode === `existing:${cfg.id}`
                                            }
                                            onSelect={() =>
                                                setMode(`existing:${cfg.id}`)
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-xs text-zinc-500 dark:border-zinc-800">
                                    No existing auth configs for{" "}
                                    <span className="font-mono">
                                        {toolkit.slug}
                                    </span>
                                    . Create a new one below.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        {showExisting && (
                            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Or create a new one
                            </div>
                        )}
                        {supportsManaged && (
                            <AuthModeCard
                                selected={mode === "managed"}
                                onSelect={() => setMode("managed")}
                                title="Use Composio-managed OAuth"
                                description={
                                    isProduction
                                        ? "Zero config. Consent screen shows Composio — pick 'Use your own OAuth credentials' for branded consent."
                                        : "One click, no credentials needed. The consent screen will show Composio as the app name."
                                }
                                icon={<BoltIcon className="h-4 w-4" />}
                            />
                        )}
                        <AuthModeCard
                            selected={mode === "custom"}
                            onSelect={() => setMode("custom")}
                            title="Use your own OAuth credentials"
                            description="Bring your own OAuth app so the consent screen shows your brand."
                        />
                    </div>

                    {mode === "custom" && (
                        <div className="mt-2 space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                    Client ID
                                </label>
                                <Input
                                    autoFocus
                                    placeholder="xxxxx.apps.googleusercontent.com"
                                    value={clientId}
                                    onChange={(e) =>
                                        setClientId(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                    Client secret
                                </label>
                                <Input
                                    type="password"
                                    placeholder="GOCSPX-..."
                                    value={clientSecret}
                                    onChange={(e) =>
                                        setClientSecret(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                    Scopes
                                </label>
                                <Input
                                    placeholder="https://www.googleapis.com/auth/gmail.readonly, ..."
                                    value={scopes}
                                    onChange={(e) => setScopes(e.target.value)}
                                />
                                <p className="text-xs text-zinc-500">
                                    Comma- or space-separated. Leave blank for
                                    the toolkit's defaults.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                <Button variant="outline" onClick={onBack} disabled={isPending}>
                    Cancel
                </Button>
                <Button onClick={confirm} disabled={!canConfirm}>
                    {isPending ? "Enabling…" : `Enable ${toolkit.name}`}
                </Button>
            </div>
        </>
    );
}

function ExistingAuthConfigCard({
    config,
    selected,
    onSelect,
}: {
    config: ComposioAuthConfigSummary;
    selected: boolean;
    onSelect: () => void;
}) {
    const shortName = config.name.split("/").pop() || config.name;
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full items-start gap-3 rounded-lg border bg-white p-3 text-left transition ${
                selected
                    ? "border-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:border-zinc-100 dark:bg-zinc-950 dark:ring-zinc-100/10"
                    : "border-zinc-200 hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            }`}
        >
            <div
                className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                    selected
                    ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
            >
                {selected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-900" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <span className="truncate">{shortName}</span>
                    <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            config.is_composio_managed
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                    >
                        {config.is_composio_managed ? "managed" : "custom"}
                    </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                    {config.id}
                </div>
            </div>
        </button>
    );
}

function AuthModeCard({
    selected,
    onSelect,
    title,
    description,
    icon,
}: {
    selected: boolean;
    onSelect: () => void;
    title: string;
    description: string;
    icon?: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex w-full items-start gap-3 rounded-lg border bg-white p-3 text-left transition ${
                selected
                    ? "border-zinc-900 shadow-sm ring-1 ring-zinc-900/10 dark:border-zinc-100 dark:bg-zinc-950 dark:ring-zinc-100/10"
                    : "border-zinc-200 hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
            }`}
        >
            <div
                className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                    selected
                        ? "border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"
                        : "border-zinc-300 dark:border-zinc-700"
                }`}
            >
                {selected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-900" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {icon}
                    {title}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                    {description}
                </div>
            </div>
        </button>
    );
}

export function ToolkitLogo({
    logo,
    name,
    size = "md",
}: {
    logo?: string | null;
    name: string;
    size?: "sm" | "md" | "lg";
}) {
    const dims =
        size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
    const textSize =
        size === "lg" ? "text-base" : size === "sm" ? "text-xs" : "text-sm";
    const initial = name.charAt(0).toUpperCase() || "?";

    return (
        <div
            className={`flex flex-none items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${dims}`}
        >
            {logo ? (
                <img
                    src={logo}
                    alt=""
                    className="h-full w-full object-contain p-1"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
            ) : (
                <span
                    className={`font-semibold text-zinc-500 dark:text-zinc-400 ${textSize}`}
                >
                    {initial}
                </span>
            )}
        </div>
    );
}

function ToolkitSkeletonGrid() {
    return (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                    <div className="h-9 w-9 flex-none animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function ErrorState({ error }: { error: unknown }) {
    const message =
        (
            error as {
                response?: { data?: { errors?: Array<{ message: string }> } };
            }
        )?.response?.data?.errors?.[0]?.message ||
        (error instanceof Error ? error.message : "Failed to load toolkits");
    return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center dark:border-amber-500/20 dark:bg-amber-500/5">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
            <div className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Couldn't load Composio apps
            </div>
            <div className="max-w-sm text-xs text-amber-800/80 dark:text-amber-200/70">
                {message}
            </div>
        </div>
    );
}
