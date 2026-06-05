import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/ui/section-label";
import { FieldRow, FieldCard } from "@/components/ui/field-row";
import { Tag } from "@/components/ui/tag";
import { InlineLoader } from "@/components/ui/loading-screen";
import {
    useRateLimitSchemes,
    useCreateRateLimitScheme,
    useUpdateRateLimitScheme,
} from "@/lib/api/hooks/use-rate-limit-schemes";
import type {
    RateLimitMode,
    RateLimitRule,
    RateLimitUnit,
} from "@/types/rate-limit-scheme";
import { toast } from "sonner";

const RATE_LIMIT_UNITS: Array<{ label: string; value: RateLimitUnit }> = [
    { label: "Millisecond", value: "millisecond" },
    { label: "Second", value: "second" },
    { label: "Minute", value: "minute" },
    { label: "Hour", value: "hour" },
    { label: "Day", value: "day" },
    { label: "Calendar Day", value: "calendar_day" },
    { label: "Month", value: "month" },
    { label: "Calendar Month", value: "calendar_month" },
];

const RATE_LIMIT_MODES: Array<{
    label: string;
    value: RateLimitMode;
    description: string;
}> = [
    {
        label: "Per Key",
        value: "per_key",
        description: "Counted independently per API key",
    },
    {
        label: "Per IP",
        value: "per_ip",
        description: "Counted independently per client IP",
    },
    {
        label: "Per Key + IP",
        value: "per_key_and_ip",
        description: "Counted per unique key + IP pair",
    },
    {
        label: "Per App",
        value: "per_app",
        description: "Shared across all keys in the app",
    },
    {
        label: "Per App + IP",
        value: "per_app_and_ip",
        description: "Shared per app, split by IP",
    },
];

type RateLimitRuleForm = {
    id: string;
    unit: RateLimitUnit;
    duration: string;
    max_requests: string;
    mode: RateLimitMode;
    endpoints: string[];
    priority: string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultRule = (): RateLimitRuleForm => ({
    id: generateId(),
    unit: "minute",
    duration: "1",
    max_requests: "120",
    mode: "per_key",
    endpoints: ["*"],
    priority: "0",
});

const toRuleForm = (rule: RateLimitRule): RateLimitRuleForm => ({
    id: generateId(),
    unit: rule.unit,
    duration: String(rule.duration ?? 1),
    max_requests: String(rule.max_requests ?? 0),
    mode: rule.mode ?? "per_key",
    endpoints: rule.endpoints?.length ? rule.endpoints : ["*"],
    priority: String(rule.priority ?? 0),
});

const parseRules = (rules: RateLimitRuleForm[]): RateLimitRule[] => {
    return rules.map((rule, index) => {
        const duration = Number(rule.duration);
        const maxRequests = Number(rule.max_requests);

        if (!Number.isFinite(duration) || duration <= 0)
            throw new Error(`Rule ${index + 1}: Duration must be greater than 0`);
        if (!Number.isFinite(maxRequests) || maxRequests <= 0)
            throw new Error(`Rule ${index + 1}: Max requests must be greater than 0`);

        const priority = Number(rule.priority);
        return {
            unit: rule.unit,
            duration,
            max_requests: maxRequests,
            mode: rule.mode,
            endpoints: rule.endpoints.length > 0 ? rule.endpoints : ["*"],
            priority: Number.isFinite(priority) ? priority : 0,
        } satisfies RateLimitRule;
    });
};

function EndpointTags({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addEndpoint = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        if (!value.includes(trimmed)) onChange([...value, trimmed]);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addEndpoint(input);
        } else if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const handleBlur = () => {
        if (input.trim()) addEndpoint(input);
    };

    return (
        <div
            className="flex flex-wrap gap-1.5 min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 cursor-text"
            onClick={() => inputRef.current?.focus()}
        >
            {value.map((ep) => (
                <span
                    key={ep}
                    className="inline-flex items-center gap-1 rounded bg-primary/10 py-0.5 pl-2 pr-1 font-mono text-[11px] font-medium text-primary"
                >
                    {ep}
                    <button
                        type="button"
                        className="text-primary/60 hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(value.filter((v) => v !== ep));
                        }}
                    >
                        <XMarkIcon className="h-3 w-3" />
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                className="flex-1 min-w-24 bg-transparent text-xs font-mono outline-none placeholder:text-muted-foreground"
                placeholder={value.length === 0 ? "Type endpoint and press Enter…" : "Add another…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
            />
        </div>
    );
}

function RuleRow({
    rule,
    index,
    canDelete,
    onUpdate,
    onDelete,
}: {
    rule: RateLimitRuleForm;
    index: number;
    canDelete: boolean;
    onUpdate: (patch: Partial<RateLimitRuleForm>) => void;
    onDelete: () => void;
}) {
    const currentMode = RATE_LIMIT_MODES.find((m) => m.value === rule.mode);
    const unitLabel = (
        RATE_LIMIT_UNITS.find((u) => u.value === rule.unit)?.label ?? rule.unit
    ).toLowerCase();
    const plural = rule.duration === "1" ? "" : "s";

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary px-4 py-2.5">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    Rule {index + 1}
                </span>
                {currentMode ? <Tag>{currentMode.label}</Tag> : null}
                <span className="font-mono text-xs text-secondary-foreground">
                    {rule.max_requests || "0"} req · per {rule.duration || "1"}{" "}
                    {unitLabel}
                    {plural}
                </span>
                <div className="flex-1" />
                <span className="font-mono text-[11px] text-muted-foreground">
                    priority {rule.priority || "0"}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px] text-destructive hover:text-destructive"
                    onClick={onDelete}
                    disabled={!canDelete}
                >
                    <TrashIcon className="h-3 w-3" />
                    Remove
                </Button>
            </div>

            <div className="space-y-4 px-5 py-5">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                            Window
                        </label>
                        <Input
                            type="number"
                            min={1}
                            className="font-mono"
                            value={rule.duration}
                            onChange={(e) =>
                                onUpdate({ duration: e.target.value })
                            }
                            placeholder="1"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                            Unit
                        </label>
                        <Select
                            value={rule.unit}
                            onValueChange={(v: RateLimitUnit) =>
                                onUpdate({ unit: v })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RATE_LIMIT_UNITS.map((item) => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                            Max requests
                        </label>
                        <Input
                            type="number"
                            min={1}
                            className="font-mono"
                            value={rule.max_requests}
                            onChange={(e) =>
                                onUpdate({ max_requests: e.target.value })
                            }
                            placeholder="120"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                            Mode
                        </label>
                        <Select
                            value={rule.mode}
                            onValueChange={(v: RateLimitMode) =>
                                onUpdate({ mode: v })
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RATE_LIMIT_MODES.map((item) => (
                                    <SelectItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-foreground">
                            Priority
                        </label>
                        <Input
                            type="number"
                            min={0}
                            className="font-mono"
                            value={rule.priority}
                            onChange={(e) =>
                                onUpdate({ priority: e.target.value })
                            }
                            placeholder="0"
                        />
                    </div>
                </div>

                {currentMode ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        {currentMode.description}. Higher priority is checked
                        first.
                    </p>
                ) : null}

                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">
                        Endpoints
                    </label>
                    <EndpointTags
                        value={rule.endpoints}
                        onChange={(v) => onUpdate({ endpoints: v })}
                    />
                    <p className="font-mono text-[11px] text-muted-foreground">
                        Press{" "}
                        <kbd className="rounded bg-secondary px-1">Enter</kbd> or{" "}
                        <kbd className="rounded bg-secondary px-1">,</kbd> to add.
                        Use{" "}
                        <code className="rounded bg-secondary px-1">*</code> for
                        all endpoints.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RateLimitSchemeEditorPage() {
    const { schemeSlug } = useParams<{ schemeSlug?: string }>();
    const navigate = useNavigate();
    const isEditMode = !!schemeSlug;

    const { data: schemes, isLoading: schemesLoading } = useRateLimitSchemes();
    const createScheme = useCreateRateLimitScheme();
    const updateScheme = useUpdateRateLimitScheme();

    const [slug, setSlug] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [rules, setRules] = useState<RateLimitRuleForm[]>([createDefaultRule()]);
    const [isSaving, setIsSaving] = useState(false);

    const existingScheme = useMemo(() => {
        if (!schemeSlug || !schemes) return null;
        return schemes.find((s) => s.slug === schemeSlug) ?? null;
    }, [schemeSlug, schemes]);

    const isLoading = isEditMode && schemesLoading;

    useEffect(() => {
        if (existingScheme) {
            setSlug(existingScheme.slug);
            setName(existingScheme.name);
            setDescription(existingScheme.description || "");
            setRules(
                existingScheme.rules.length > 0
                    ? existingScheme.rules.map(toRuleForm)
                    : [createDefaultRule()],
            );
        }
    }, [existingScheme]);

    const addRule = () => setRules((r) => [...r, createDefaultRule()]);
    const removeRule = (id: string) =>
        setRules((r) => (r.length === 1 ? r : r.filter((x) => x.id !== id)));
    const updateRule = (id: string, patch: Partial<RateLimitRuleForm>) =>
        setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (!name.trim()) {
                toast.error("Name is required");
                return;
            }
            if (!isEditMode && !slug.trim()) {
                toast.error("Slug is required");
                return;
            }
            const parsedRules = parseRules(rules);
            if (isEditMode && existingScheme) {
                await updateScheme.mutateAsync({
                    slug: existingScheme.slug,
                    request: {
                        name: name.trim(),
                        description: description.trim() || undefined,
                        rules: parsedRules,
                    },
                });
            } else {
                await createScheme.mutateAsync({
                    slug: slug.trim(),
                    name: name.trim(),
                    description: description.trim() || undefined,
                    rules: parsedRules,
                });
            }
            navigate(-1);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save scheme");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <InlineLoader />;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    {isEditMode ? (
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Rate limit scheme · {slug}
                        </p>
                    ) : null}
                    <h1 className="mt-1 text-xl font-medium tracking-tight text-foreground">
                        {isEditMode
                            ? "Edit rate limit scheme"
                            : "Create rate limit scheme"}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Define how requests are throttled. Multiple rules are
                        evaluated in priority order — higher priority is checked
                        first.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="scheme-form" disabled={isSaving}>
                        {isSaving
                            ? isEditMode
                                ? "Saving…"
                                : "Creating…"
                            : isEditMode
                              ? "Save changes"
                              : "Create scheme"}
                    </Button>
                </div>
            </div>

            <form
                id="scheme-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-8"
            >
                <section className="space-y-3">
                    <SectionLabel>Scheme details</SectionLabel>
                    <FieldCard>
                        <FieldRow
                            label="Slug"
                            desc="Unique identifier. Cannot be changed after creation."
                        >
                            <Input
                                className="font-mono text-xs"
                                placeholder="public-api-default"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isEditMode}
                                required={!isEditMode}
                            />
                        </FieldRow>
                        <FieldRow
                            label="Name"
                            desc="Shown in the dashboard. Slugged automatically if changed."
                        >
                            <Input
                                placeholder="Public API Defaults"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </FieldRow>
                        <FieldRow
                            label="Description"
                            desc="Optional. Useful when many schemes exist."
                            align="start"
                        >
                            <Textarea
                                placeholder="Describe what this scheme is for…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </FieldRow>
                    </FieldCard>
                </section>

                <section className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-medium text-foreground">
                                Rules
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Evaluated in priority order. Higher priority
                                values are checked first.
                            </p>
                        </div>
                        <Button type="button" size="sm" onClick={addRule}>
                            <PlusIcon className="h-4 w-4" />
                            Add rule
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {rules.map((rule, index) => (
                            <RuleRow
                                key={rule.id}
                                rule={rule}
                                index={index}
                                canDelete={rules.length > 1}
                                onUpdate={(patch) => updateRule(rule.id, patch)}
                                onDelete={() => removeRule(rule.id)}
                            />
                        ))}
                    </div>
                </section>
            </form>
        </div>
    );
}
