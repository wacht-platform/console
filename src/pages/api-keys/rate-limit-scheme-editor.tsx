import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
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

const RATE_LIMIT_MODES: Array<{ label: string; value: RateLimitMode }> = [
    { label: "Per Key", value: "per_key" },
    { label: "Per IP", value: "per_ip" },
    { label: "Per Key + IP", value: "per_key_and_ip" },
    { label: "Per App", value: "per_app" },
    { label: "Per App + IP", value: "per_app_and_ip" },
];

type RateLimitRuleForm = {
    id: string;
    unit: RateLimitUnit;
    duration: string;
    max_requests: string;
    mode: RateLimitMode;
    endpoints: string;
    priority: string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultRule = (): RateLimitRuleForm => ({
    id: generateId(),
    unit: "minute",
    duration: "1",
    max_requests: "120",
    mode: "per_key",
    endpoints: "*",
    priority: "0",
});

const toRuleForm = (rule: RateLimitRule): RateLimitRuleForm => ({
    id: generateId(),
    unit: rule.unit,
    duration: String(rule.duration ?? 1),
    max_requests: String(rule.max_requests ?? 0),
    mode: rule.mode ?? "per_key",
    endpoints: (rule.endpoints ?? ["*"]).join(", "),
    priority: String(rule.priority ?? 0),
});

const parseRules = (rules: RateLimitRuleForm[]): RateLimitRule[] => {
    return rules.map((rule, index) => {
        const duration = Number(rule.duration);
        const maxRequests = Number(rule.max_requests);

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error(
                `Rule ${index + 1}: Duration must be greater than 0`,
            );
        }
        if (!Number.isFinite(maxRequests) || maxRequests <= 0) {
            throw new Error(
                `Rule ${index + 1}: Max requests must be greater than 0`,
            );
        }

        const endpoints = rule.endpoints
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);

        const priority = Number(rule.priority);

        return {
            unit: rule.unit,
            duration,
            max_requests: maxRequests,
            mode: rule.mode,
            endpoints: endpoints.length > 0 ? endpoints : ["*"],
            priority: Number.isFinite(priority) ? priority : 0,
        } satisfies RateLimitRule;
    });
};

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
    const [rules, setRules] = useState<RateLimitRuleForm[]>([
        createDefaultRule(),
    ]);
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

    const handleBack = () => navigate(-1);

    const addRule = () =>
        setRules((current) => [...current, createDefaultRule()]);

    const removeRule = (ruleId: string) => {
        setRules((current) =>
            current.length === 1
                ? current
                : current.filter((r) => r.id !== ruleId),
        );
    };

    const updateRule = (ruleId: string, patch: Partial<RateLimitRuleForm>) => {
        setRules((current) =>
            current.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (!name.trim()) {
                toast.error("Name is required");
                setIsSaving(false);
                return;
            }
            if (!isEditMode && !slug.trim()) {
                toast.error("Slug is required");
                setIsSaving(false);
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
                toast.success("Scheme updated successfully");
            } else {
                await createScheme.mutateAsync({
                    slug: slug.trim(),
                    name: name.trim(),
                    description: description.trim() || undefined,
                    rules: parsedRules,
                });
                toast.success("Scheme created successfully");
            }

            navigate(-1);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to save scheme",
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <InlineLoader />;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-normal tracking-tight">
                        {isEditMode
                            ? "Edit Rate Limit Scheme"
                            : "Create Rate Limit Scheme"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isEditMode
                            ? "Update your rate limit scheme and its rules."
                            : "Define a new rate limit scheme with rules for API throttling."}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="scheme-form"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? isEditMode
                                ? "Saving..."
                                : "Creating..."
                            : isEditMode
                              ? "Save Changes"
                              : "Create Scheme"}
                    </Button>
                </div>
            </div>

            <form
                id="scheme-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-8"
            >
                {/* Scheme Details */}
                <section className="space-y-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Scheme Details
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                placeholder="public-api-default"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isEditMode}
                                required={!isEditMode}
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier. Cannot be changed after
                                creation.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
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
                            placeholder="Describe what this scheme is for..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </section>

                <Divider />

                {/* Rules */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Rules
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Define rate limiting rules for this scheme.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addRule}
                        >
                            <PlusIcon className="mr-1.5 h-4 w-4" /> Add Rule
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-16">
                                        Priority
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-28">
                                        Unit
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-24">
                                        Duration
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-28">
                                        Max Requests
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground w-36">
                                        Mode
                                    </th>
                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                                        Endpoints
                                    </th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule) => (
                                    <tr
                                        key={rule.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min={0}
                                                className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                                value={rule.priority}
                                                onChange={(e) =>
                                                    updateRule(rule.id, {
                                                        priority:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Select
                                                value={rule.unit}
                                                onValueChange={(
                                                    value: RateLimitUnit,
                                                ) =>
                                                    updateRule(rule.id, {
                                                        unit: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 text-sm border-0 bg-transparent shadow-none p-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RATE_LIMIT_UNITS.map(
                                                        (item) => (
                                                            <SelectItem
                                                                key={item.value}
                                                                value={
                                                                    item.value
                                                                }
                                                            >
                                                                {item.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                                value={rule.duration}
                                                onChange={(e) =>
                                                    updateRule(rule.id, {
                                                        duration:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                                value={rule.max_requests}
                                                onChange={(e) =>
                                                    updateRule(rule.id, {
                                                        max_requests:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <Select
                                                value={rule.mode}
                                                onValueChange={(
                                                    value: RateLimitMode,
                                                ) =>
                                                    updateRule(rule.id, {
                                                        mode: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 text-sm border-0 bg-transparent shadow-none p-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RATE_LIMIT_MODES.map(
                                                        (item) => (
                                                            <SelectItem
                                                                key={item.value}
                                                                value={
                                                                    item.value
                                                                }
                                                            >
                                                                {item.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="py-2 px-3">
                                            <Input
                                                className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 font-mono text-xs"
                                                value={rule.endpoints}
                                                onChange={(e) =>
                                                    updateRule(rule.id, {
                                                        endpoints:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="*, /v1/users"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                    removeRule(rule.id)
                                                }
                                                disabled={rules.length === 1}
                                            >
                                                <TrashIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Endpoints: Comma-separated list. Use{" "}
                        <code className="text-xs bg-muted px-1 rounded">*</code>{" "}
                        to apply globally.
                    </p>
                </section>
            </form>
        </div>
    );
}
