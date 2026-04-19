import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { InlineLoader } from "@/components/ui/loading-screen";
import { Divider } from "@/components/ui/divider";
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
                    className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-mono"
                >
                    {ep}
                    <button
                        type="button"
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
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

    return (
        <div className="pt-4 first:pt-0 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Rule {index + 1}
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={onDelete}
                    disabled={!canDelete}
                >
                    <TrashIcon className="h-3.5 w-3.5 mr-1" />
                    Remove
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Window</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={1}
                            className="h-9 w-16 text-sm"
                            value={rule.duration}
                            onChange={(e) => onUpdate({ duration: e.target.value })}
                            placeholder="1"
                        />
                        <Select
                            value={rule.unit}
                            onValueChange={(v: RateLimitUnit) => onUpdate({ unit: v })}
                        >
                            <SelectTrigger className="h-9 flex-1 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RATE_LIMIT_UNITS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Max Requests</Label>
                    <Input
                        type="number"
                        min={1}
                        className="h-9 text-sm"
                        value={rule.max_requests}
                        onChange={(e) => onUpdate({ max_requests: e.target.value })}
                        placeholder="120"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Mode</Label>
                    <Select
                        value={rule.mode}
                        onValueChange={(v: RateLimitMode) => onUpdate({ mode: v })}
                    >
                        <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {RATE_LIMIT_MODES.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {currentMode && (
                        <p className="text-xs text-muted-foreground">{currentMode.description}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <Input
                        type="number"
                        min={0}
                        className="h-9 text-sm"
                        value={rule.priority}
                        onChange={(e) => onUpdate({ priority: e.target.value })}
                        placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">Higher = checked first.</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Endpoints</Label>
                <EndpointTags
                    value={rule.endpoints}
                    onChange={(v) => onUpdate({ endpoints: v })}
                />
                <p className="text-xs text-muted-foreground">
                    Press{" "}
                    <kbd className="rounded bg-muted px-1 text-xs">Enter</kbd> or{" "}
                    <kbd className="rounded bg-muted px-1 text-xs">,</kbd> to add.
                    Use <code className="bg-muted px-1 rounded text-xs">*</code> for all.
                </p>
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
                <div>
                    <h1 className="text-xl font-normal tracking-tight">
                        {isEditMode ? "Edit Rate Limit Scheme" : "Create Rate Limit Scheme"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isEditMode
                            ? "Update your rate limit scheme and its rules."
                            : "Define a new rate limit scheme with rules for API throttling."}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="scheme-form" disabled={isSaving}>
                        {isSaving
                            ? isEditMode ? "Saving..." : "Creating..."
                            : isEditMode ? "Save Changes" : "Create Scheme"}
                    </Button>
                </div>
            </div>

            <form id="scheme-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Scheme Details
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                className="px-3"
                                placeholder="public-api-default"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isEditMode}
                                required={!isEditMode}
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier. Cannot be changed after creation.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                className="px-3"
                                placeholder="Public API Defaults"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            className="px-3"
                            placeholder="Describe what this scheme is for..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </section>

                <Divider />

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Rules
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Evaluated in priority order. Higher priority values are checked first.
                            </p>
                        </div>
                        <Button type="button" variant="outline" onClick={addRule}>
                            <PlusIcon className="mr-1.5 h-4 w-4" /> Add Rule
                        </Button>
                    </div>

                    <div className="divide-y">
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
