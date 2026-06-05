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
    useComposioToolkitAuthDetails,
    useEnableComposioApp,
} from "@/lib/api/hooks/use-composio-config";
import type {
    ComposioAuthConfigSummary,
    ComposioToolkit,
    ComposioToolkitAuthField,
    ComposioToolkitAuthMode,
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
            <DialogHeader className="mx-0 mt-0 border-b border-border px-5 py-4">
                <DialogTitle>Add a Composio app</DialogTitle>
                <DialogDescription>
                    Pick an app to expose to your agents. You'll need an auth
                    config from your Composio dashboard for each app.
                </DialogDescription>
            </DialogHeader>

            <div className="border-b border-border px-5 py-3 dark:border-border">
                <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                        <div className="text-sm font-medium text-foreground">
                            {search
                                ? "No apps match your search"
                                : "No apps found"}
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                                    className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-border hover:shadow-sm dark:border-border"
                                >
                                    <ToolkitLogo
                                        logo={toolkit.logo}
                                        name={toolkit.name}
                                        size="md"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-foreground">
                                            {toolkit.name}
                                        </div>
                                        {toolkit.description && (
                                            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                {toolkit.description}
                                            </div>
                                        )}
                                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                            <span className="font-mono">
                                                {toolkit.slug}
                                            </span>
                                            {toolkit.tool_count > 0 && (
                                                <>
                                                    <span className="text-muted-foreground dark:text-foreground">
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

type EnableSelection =
    | { kind: "managed"; mode: ComposioToolkitAuthMode }
    | { kind: "custom"; mode: ComposioToolkitAuthMode }
    | { kind: "existing"; configId: string };

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
    const showExisting = !usePlatformKey;
    const { data: existingData, isLoading: existingLoading } =
        useComposioToolkitAuthConfigs(toolkit.slug, showExisting);
    const existingConfigs = existingData?.auth_configs ?? [];

    const { data: details, isLoading: detailsLoading } =
        useComposioToolkitAuthDetails(toolkit.slug);
    const authModes = details?.auth_modes ?? [];
    const managedSchemes = useMemo(
        () =>
            new Set(
                (details?.composio_managed_auth_schemes ?? []).map((s) =>
                    s.toLowerCase(),
                ),
            ),
        [details],
    );

    const [selection, setSelection] = useState<EnableSelection | null>(null);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (selection) return;
        if (existingConfigs.length > 0) {
            setSelection({ kind: "existing", configId: existingConfigs[0].id });
            return;
        }
        if (authModes.length > 0) {
            const first = authModes[0];
            const managed = managedSchemes.has(first.mode.toLowerCase());
            setSelection(
                managed
                    ? { kind: "managed", mode: first }
                    : { kind: "custom", mode: first },
            );
        }
    }, [existingConfigs, authModes, selection, managedSchemes]);

    useEffect(() => {
        setFieldValues({});
    }, [selection]);

    const customMode =
        selection?.kind === "custom" ? selection.mode : null;
    const creationFields = customMode
        ? [
              ...customMode.auth_config_creation.required,
              ...customMode.auth_config_creation.optional,
          ]
        : [];

    const requiredMissing = customMode
        ? customMode.auth_config_creation.required.some(
              (f) => !(fieldValues[f.name] ?? "").trim(),
          )
        : false;

    const confirm = () => {
        if (!selection) return;
        if (selection.kind === "existing") {
            onEnable({
                type: "use_existing",
                auth_config_id: selection.configId,
            });
            return;
        }
        if (selection.kind === "managed") {
            onEnable({ type: "managed", auth_scheme: selection.mode.mode });
            return;
        }
        const credentials = parseCredentials(creationFields, fieldValues);
        onEnable({
            type: "custom",
            auth_scheme: selection.mode.mode,
            credentials,
        });
    };

    const canConfirm =
        !isPending &&
        selection != null &&
        (selection.kind === "existing" ||
            selection.kind === "managed" ||
            !requiredMissing);

    return (
        <>
            <DialogHeader className="mx-0 mt-0 border-b border-border px-5 py-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isPending}
                    className="mb-1 inline-flex items-center gap-1 self-start text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 dark:hover:text-muted-foreground"
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
                                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Existing auth configs
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    From your Composio account
                                </div>
                            </div>
                            {existingLoading ? (
                                <div className="h-10 animate-pulse rounded-lg border border-border bg-secondary dark:border-border" />
                            ) : existingConfigs.length > 0 ? (
                                <div className="space-y-2">
                                    {existingConfigs.map((cfg) => (
                                        <ExistingAuthConfigCard
                                            key={cfg.id}
                                            config={cfg}
                                            selected={
                                                selection?.kind === "existing" &&
                                                selection.configId === cfg.id
                                            }
                                            onSelect={() =>
                                                setSelection({
                                                    kind: "existing",
                                                    configId: cfg.id,
                                                })
                                            }
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground dark:border-border">
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
                        {showExisting && existingConfigs.length > 0 && (
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Or create a new one
                            </div>
                        )}
                        {detailsLoading ? (
                            <div className="h-16 animate-pulse rounded-lg border border-border bg-secondary dark:border-border" />
                        ) : authModes.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground dark:border-border">
                                No auth methods reported for this app.
                            </div>
                        ) : (
                            authModes.flatMap((m) => {
                                const managed = managedSchemes.has(
                                    m.mode.toLowerCase(),
                                );
                                const cards: React.ReactNode[] = [];
                                if (managed) {
                                    cards.push(
                                        <AuthModeCard
                                            key={`${m.mode}:managed`}
                                            selected={
                                                selection?.kind === "managed" &&
                                                selection.mode.mode === m.mode
                                            }
                                            onSelect={() =>
                                                setSelection({
                                                    kind: "managed",
                                                    mode: m,
                                                })
                                            }
                                            title={`Use Composio-managed ${m.name}`}
                                            description={
                                                isProduction
                                                    ? "Zero config. Consent screen shows Composio — pick custom for branded consent."
                                                    : "One click, no admin credentials needed. Consent screen shows Composio."
                                            }
                                            icon={<BoltIcon className="h-4 w-4" />}
                                        />,
                                    );
                                }
                                const customHasFields =
                                    m.auth_config_creation.required.length +
                                        m.auth_config_creation.optional.length >
                                    0;
                                if (customHasFields || !managed) {
                                    const userOnly =
                                        !customHasFields &&
                                        m.connected_account_initiation.required
                                            .length +
                                            m.connected_account_initiation
                                                .optional.length >
                                            0;
                                    cards.push(
                                        <AuthModeCard
                                            key={`${m.mode}:custom`}
                                            selected={
                                                selection?.kind === "custom" &&
                                                selection.mode.mode === m.mode
                                            }
                                            onSelect={() =>
                                                setSelection({
                                                    kind: "custom",
                                                    mode: m,
                                                })
                                            }
                                            title={
                                                userOnly
                                                    ? `End-user supplied ${m.name}`
                                                    : `Configure ${m.name} yourself`
                                            }
                                            description={describeCustomDetail(
                                                m,
                                                userOnly,
                                            )}
                                        />,
                                    );
                                }
                                return cards;
                            })
                        )}
                    </div>

                    {customMode && creationFields.length > 0 && (
                        <DynamicFieldsForm
                            mode={customMode}
                            values={fieldValues}
                            onChange={(name, value) =>
                                setFieldValues((prev) => ({
                                    ...prev,
                                    [name]: value,
                                }))
                            }
                        />
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border bg-secondary px-5 py-3 dark:border-border">
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

function describeCustomDetail(
    mode: ComposioToolkitAuthMode,
    userOnly: boolean,
): string {
    if (userOnly) {
        return "No admin setup needed — each end user provides their own credentials when they connect.";
    }
    const required = mode.auth_config_creation.required.length;
    return `Provide ${required} ${required === 1 ? "field" : "fields"} from your provider.`;
}

function parseCredentials(
    fields: ComposioToolkitAuthField[],
    values: Record<string, string>,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
        const raw = (values[f.name] ?? "").trim();
        if (!raw) continue;
        out[f.name] = coerceFieldValue(f, raw);
    }
    return out;
}

function coerceFieldValue(
    field: ComposioToolkitAuthField,
    raw: string,
): unknown {
    const t = field.type.toLowerCase();
    if (t.includes("array") || field.name.toLowerCase().includes("scope")) {
        return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    }
    if (t.includes("number") || t.includes("integer")) {
        const n = Number(raw);
        return Number.isFinite(n) ? n : raw;
    }
    if (t.includes("boolean")) {
        return raw.toLowerCase() === "true" || raw === "1";
    }
    return raw;
}

function DynamicFieldsForm({
    mode,
    values,
    onChange,
}: {
    mode: ComposioToolkitAuthMode;
    values: Record<string, string>;
    onChange: (name: string, value: string) => void;
}) {
    const required = mode.auth_config_creation.required;
    const optional = mode.auth_config_creation.optional;
    if (required.length === 0 && optional.length === 0) return null;
    return (
        <div className="mt-2 space-y-3 rounded-lg border border-border p-4 dark:border-border">
            {required.map((f) => (
                <FieldInput
                    key={f.name}
                    field={f}
                    value={values[f.name] ?? f.default ?? ""}
                    onChange={(v) => onChange(f.name, v)}
                />
            ))}
            {optional.length > 0 && (
                <div className="pt-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Optional
                    </div>
                </div>
            )}
            {optional.map((f) => (
                <FieldInput
                    key={f.name}
                    field={f}
                    value={values[f.name] ?? f.default ?? ""}
                    onChange={(v) => onChange(f.name, v)}
                />
            ))}
            {mode.auth_hint_url && (
                <p className="text-xs text-muted-foreground">
                    Where to find these:{" "}
                    <a
                        href={mode.auth_hint_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                    >
                        {mode.auth_hint_url}
                    </a>
                </p>
            )}
        </div>
    );
}

function FieldInput({
    field,
    value,
    onChange,
}: {
    field: ComposioToolkitAuthField;
    value: string;
    onChange: (v: string) => void;
}) {
    const t = field.type.toLowerCase();
    const isSecret =
        /(secret|password|token|api[_-]?key)/i.test(field.name) ||
        /(secret|password)/i.test(t);
    return (
        <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                {field.display_name}
                {field.required && <span className="text-red-500">*</span>}
            </label>
            <Input
                type={isSecret ? "password" : "text"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.default ?? ""}
            />
            {field.description && (
                <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
        </div>
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
            className={`flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition ${
                selected
                    ? "border-primary shadow-sm ring-1 ring-border"
                    : "border-border hover:border-border hover:shadow-sm dark:border-border"
            }`}
        >
            <div
                className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                    selected
                    ? "border-primary bg-primary dark:bg-secondary"
                    : "border-border dark:border-border"
                }`}
            >
                {selected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-card" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{shortName}</span>
                    <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            config.is_composio_managed
                                ? "bg-primary text-primary dark:bg-primary dark:text-primary"
                                : "bg-secondary text-foreground dark:text-muted-foreground"
                        }`}
                    >
                        {config.is_composio_managed ? "managed" : "custom"}
                    </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
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
            className={`flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition ${
                selected
                    ? "border-primary shadow-sm ring-1 ring-border"
                    : "border-border hover:border-border hover:shadow-sm dark:border-border"
            }`}
        >
            <div
                className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                    selected
                        ? "border-primary bg-primary dark:bg-secondary"
                        : "border-border dark:border-border"
                }`}
            >
                {selected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-card" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {icon}
                    {title}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
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
            className={`flex flex-none items-center justify-center overflow-hidden rounded-md border border-border bg-card dark:border-border ${dims}`}
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
                    className={`font-semibold text-muted-foreground ${textSize}`}
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
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 dark:border-border"
                >
                    <div className="h-9 w-9 flex-none animate-pulse rounded-md bg-secondary" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="h-3.5 w-1/3 animate-pulse rounded bg-secondary" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
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
