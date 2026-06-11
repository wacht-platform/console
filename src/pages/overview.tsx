import { useId, useMemo, useState, type ReactNode } from "react";
import {
    format,
    startOfDay,
    endOfDay,
    startOfWeek,
    startOfMonth,
    subDays,
} from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
    FingerPrintIcon,
    UserPlusIcon,
    RectangleStackIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    ArrowPathIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useAnalyticsStats } from "@/lib/api/hooks/use-analytics";
import {
    useTokenUsage,
    useTokenUsageByModel,
} from "@/lib/api/hooks/use-token-usage";
import { useWebhookUsage } from "@/lib/api/hooks/use-webhook-usage";
import { useGatewayUsage } from "@/lib/api/hooks/use-gateway-usage";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTableRows } from "@/components/ui/app-skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pill } from "@/components/ui/pill";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHead } from "@/components/ui/page-head";
import { useSession } from "@wacht/react-router";
import type {
    RecentSignup,
    BreakdownItem,
} from "@/lib/api/hooks/use-analytics";

// Date range options for analytics
const DATE_RANGES = {
    today: () => ({
        from: startOfDay(new Date()).toISOString(),
        to: endOfDay(new Date()).toISOString(),
        label: "Today",
    }),
    yesterday: () => {
        const y = subDays(new Date(), 1);
        return {
            from: startOfDay(y).toISOString(),
            to: endOfDay(y).toISOString(),
            label: "Yesterday",
        };
    },
    thisWeek: () => ({
        from: startOfWeek(new Date()).toISOString(),
        to: new Date().toISOString(),
        label: "This week",
    }),
    thisMonth: () => ({
        from: startOfMonth(new Date()).toISOString(),
        to: new Date().toISOString(),
        label: "This month",
    }),
};

export default function OverviewPage() {
    const { selectedDeployment, selectedProject } = useProjects();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPeriod, setSelectedPeriod] =
        useState<keyof typeof DATE_RANGES>("thisWeek");
    // Memoize per period: the range fns use `new Date()` for `to`, so calling
    // them every render produced a fresh `to` each time → new query keys → an
    // infinite refetch loop across every analytics hook below.
    const currentRange = useMemo(
        () => DATE_RANGES[selectedPeriod](),
        [selectedPeriod],
    );
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { session } = useSession();
    const user = session?.active_signin?.user;
    const userName = user?.first_name || "User";

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Analytics data - single hook now returns everything
    const { data: stats, isLoading: statsLoading } = useAnalyticsStats(
        selectedDeployment?.id || "",
        currentRange.from,
        currentRange.to,
        !!selectedDeployment?.id,
    );
    const resolvedStats = stats;
    const resolvedStatsLoading = statsLoading;

    // Extract recent signups/signins from stats response
    const recentSignupsData = resolvedStats?.recent_signups || [];
    const recentSigninsData = resolvedStats?.recent_signins || [];
    const signupsLoading = resolvedStatsLoading;
    const signinsLoading = resolvedStatsLoading;

    const tokenGranularity: "minute" | "hour" | "day" =
        selectedPeriod === "today"
            ? "minute"
            : selectedPeriod === "thisMonth"
              ? "day"
              : "hour";
    const { data: tokenUsage, isLoading: tokenUsageLoading } = useTokenUsage(
        selectedDeployment?.id || "",
        currentRange.from,
        currentRange.to,
        tokenGranularity,
        tz,
        !!selectedDeployment?.id,
    );
    // cached tokens are a subset of input tokens (Gemini usage semantics);
    // derive the non-cached share so the stacked series sum correctly.
    const tokenData = (tokenUsage?.buckets ?? []).map((b) => ({
        label: format(
            new Date(b.bucket),
            tokenGranularity === "day" ? "MMM d" : "HH:mm",
        ),
        input: Math.max(0, b.input_tokens - b.cached_tokens),
        cached: b.cached_tokens,
        output: b.output_tokens,
        total: b.total_tokens,
    }));
    const tokenTotals = tokenData.reduce(
        (acc, d) => {
            acc.input += d.input;
            acc.cached += d.cached;
            acc.output += d.output;
            return acc;
        },
        { input: 0, cached: 0, output: 0 },
    );
    const tokenChartConfig = {
        input: { label: "Input", color: "var(--chart-1)" },
        cached: { label: "Cached", color: "var(--chart-3)" },
        output: { label: "Output", color: "var(--chart-2)" },
    } satisfies ChartConfig;

    const compact = (n: number) =>
        new Intl.NumberFormat("en", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(n);
    const bucketLabel = (iso: string) =>
        format(new Date(iso), tokenGranularity === "day" ? "MMM d" : "HH:mm");

    const { data: webhookUsage, isLoading: webhookUsageLoading } =
        useWebhookUsage(
            selectedDeployment?.id || "",
            currentRange.from,
            currentRange.to,
            tokenGranularity,
            tz,
            !!selectedDeployment?.id,
        );
    const webhookData = (webhookUsage?.buckets ?? []).map((b) => ({
        label: bucketLabel(b.bucket),
        successful: b.successful_deliveries,
        failed: b.failed_deliveries,
        filtered: b.filtered_deliveries,
    }));
    const webhookTotals = (webhookUsage?.buckets ?? []).reduce(
        (a, b) => {
            a.successful += b.successful_deliveries;
            a.failed += b.failed_deliveries;
            a.filtered += b.filtered_deliveries;
            return a;
        },
        { successful: 0, failed: 0, filtered: 0 },
    );
    const webhookChartConfig = {
        successful: { label: "Success", color: "var(--chart-3)" },
        failed: { label: "Failed", color: "var(--chart-4)" },
        filtered: { label: "Filtered", color: "var(--chart-5)" },
    } satisfies ChartConfig;

    const { data: gatewayUsage, isLoading: gatewayUsageLoading } =
        useGatewayUsage(
            selectedDeployment?.id || "",
            currentRange.from,
            currentRange.to,
            tokenGranularity,
            tz,
            !!selectedDeployment?.id,
        );
    const gatewayData = (gatewayUsage?.buckets ?? []).map((b) => ({
        label: bucketLabel(b.bucket),
        allowed: b.allowed_requests,
        blocked: b.blocked_requests,
    }));
    const gatewayTotals = (gatewayUsage?.buckets ?? []).reduce(
        (a, b) => {
            a.allowed += b.allowed_requests;
            a.blocked += b.blocked_requests;
            return a;
        },
        { allowed: 0, blocked: 0 },
    );
    const gatewayChartConfig = {
        allowed: { label: "Allowed", color: "var(--chart-3)" },
        blocked: { label: "Blocked", color: "var(--chart-4)" },
    } satisfies ChartConfig;

    const { data: tokenByModel, isLoading: tokenByModelLoading } =
        useTokenUsageByModel(
            selectedDeployment?.id || "",
            currentRange.from,
            currentRange.to,
            !!selectedDeployment?.id,
        );
    const tokenModels = tokenByModel?.models ?? [];

    const dailyChartConfig = {
        signins: {
            label: "Sign-ins",
            color: "var(--chart-1)",
        },
        signups: {
            label: "Sign-ups",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig;

    const dailyMetrics = (resolvedStats?.daily_metrics || []).map((metric) => {
        const date = new Date(`${metric.day}T00:00:00Z`);
        const hasValidDate = !Number.isNaN(date.getTime());
        return {
            ...metric,
            label: hasValidDate ? format(date, "MMM dd") : metric.day,
        };
    });

    const signinsSeries = dailyMetrics.map((m) => m.signins);
    const signupsSeries = dailyMetrics.map((m) => m.signups);
    const fmt = (n?: number) =>
        resolvedStatsLoading ? "…" : (n ?? 0).toLocaleString("en-US");

    const kpiCards = [
        {
            label: "Unique sign-ins",
            value: fmt(resolvedStats?.unique_signins),
            change: resolvedStats?.unique_signins_change,
            spark: signinsSeries,
            accent: "var(--chart-1)",
        },
        {
            label: "New sign-ups",
            value: fmt(resolvedStats?.signups),
            change: resolvedStats?.signups_change,
            spark: signupsSeries,
            accent: "var(--primary)",
        },
        {
            label: "New organizations",
            value: fmt(resolvedStats?.organizations_created),
            change: resolvedStats?.organizations_created_change,
            accent: "#0f8a4a",
        },
        {
            label: "New workspaces",
            value: fmt(resolvedStats?.workspaces_created),
            change: resolvedStats?.workspaces_created_change,
            accent: "#a85b00",
        },
    ];

    const deploymentContext =
        [selectedProject?.name, selectedDeployment?.mode]
            .filter(Boolean)
            .join(" · ") || "Dashboard";

    const methodsData = (resolvedStats?.methods ?? []).map((m, i) => ({
        label: prettyMethod(m.label),
        count: m.count,
        color: METHOD_COLORS[i % METHOD_COLORS.length],
    }));
    const countryRows = toBars(resolvedStats?.top_countries);
    const deviceRows = toBars(resolvedStats?.devices);

    const canInvite = !!(selectedProject?.id && selectedDeployment?.id);
    const goInvite = () => {
        if (!canInvite) return;
        navigate(
            `/project/${selectedProject!.id}/deployment/${selectedDeployment!.id}/users/invited`,
        );
    };
    const syncStats = () =>
        queryClient.invalidateQueries({ queryKey: ["analytics"] });

    return (
        <div className="flex flex-col gap-6">
            <PageHead
                className="mb-0"
                eyebrow={deploymentContext}
                title={`${getGreeting()}, ${userName}`}
                sub="Here's how your app is performing this week."
                actions={
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {currentRange.label}
                                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {Object.entries(DATE_RANGES).map(([key, fn]) => (
                                    <DropdownMenuItem
                                        key={key}
                                        onClick={() =>
                                            setSelectedPeriod(
                                                key as keyof typeof DATE_RANGES,
                                            )
                                        }
                                    >
                                        {fn().label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={syncStats}
                        >
                            <ArrowPathIcon className="size-4" />
                            Sync
                        </Button>
                        {canInvite ? (
                            <Button size="sm" onClick={goInvite}>
                                <UserPlusIcon className="size-4" />
                                Invite user
                            </Button>
                        ) : null}
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((kpi) => (
                    <KpiCard key={kpi.label} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
                <AuthTrendCard
                    loading={resolvedStatsLoading}
                    data={dailyMetrics}
                    config={dailyChartConfig}
                    signinsTotal={fmt(resolvedStats?.unique_signins)}
                    signinsChange={resolvedStats?.unique_signins_change}
                    signupsTotal={fmt(resolvedStats?.signups)}
                    signupsChange={resolvedStats?.signups_change}
                />
                <MethodsCard data={methodsData} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
                <TokenUsageCard
                    loading={tokenUsageLoading}
                    data={tokenData}
                    config={tokenChartConfig}
                    totals={tokenTotals}
                    tz={tz}
                />
                <TokenByModelCard
                    loading={tokenByModelLoading}
                    models={tokenModels}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <UsageAreaCard
                    title="Webhook deliveries"
                    subtitle={`Delivery outcomes · ${tz}`}
                    loading={webhookUsageLoading}
                    data={webhookData}
                    config={webhookChartConfig}
                    series={[
                        { key: "successful" },
                        { key: "failed" },
                        { key: "filtered" },
                    ]}
                    legend={[
                        { color: "var(--chart-3)", label: "Success", value: compact(webhookTotals.successful) },
                        { color: "var(--chart-4)", label: "Failed", value: compact(webhookTotals.failed) },
                        { color: "var(--chart-5)", label: "Filtered", value: compact(webhookTotals.filtered) },
                    ]}
                />
                <UsageAreaCard
                    title="API gateway usage"
                    subtitle={`Key verifications · ${tz}`}
                    loading={gatewayUsageLoading}
                    data={gatewayData}
                    config={gatewayChartConfig}
                    series={[{ key: "allowed" }, { key: "blocked" }]}
                    legend={[
                        { color: "var(--chart-3)", label: "Allowed", value: compact(gatewayTotals.allowed) },
                        { color: "var(--chart-4)", label: "Blocked", value: compact(gatewayTotals.blocked) },
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BarListCard
                    title="Top countries"
                    sub="By sign-in volume"
                    accent="var(--primary)"
                    rows={countryRows}
                    emptyIcon={<GlobeAltIcon className="size-4.5" />}
                    emptyMessage="Locations will show here once users start signing in."
                />
                <BarListCard
                    title="Devices"
                    sub="Operating systems"
                    accent="#2f6fdb"
                    rows={deviceRows}
                    emptyIcon={<ComputerDesktopIcon className="size-4.5" />}
                    emptyMessage="Device breakdown appears as sign-in activity comes in."
                />
            </div>

            <RecentActivityCard
                loading={signinsLoading || signupsLoading}
                signins={recentSigninsData}
                signups={recentSignupsData}
            />
        </div>
    );
}

function TokenUsageCard({
    loading,
    data,
    config,
    totals,
    tz,
}: {
    loading: boolean;
    data: Array<{
        label: string;
        input: number;
        cached: number;
        output: number;
        total: number;
    }>;
    config: ChartConfig;
    totals: { input: number; cached: number; output: number };
    tz: string;
}) {
    const compact = (n: number) =>
        new Intl.NumberFormat("en", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(n);
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-foreground">
                        Token usage
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Model tokens · {tz}
                    </p>
                </div>
                <div className="flex gap-5">
                    <Legend
                        color="var(--chart-1)"
                        label="Input"
                        value={compact(totals.input)}
                    />
                    <Legend
                        color="var(--chart-3)"
                        label="Cached"
                        value={compact(totals.cached)}
                    />
                    <Legend
                        color="var(--chart-2)"
                        label="Output"
                        value={compact(totals.output)}
                    />
                </div>
            </div>
            {loading ? (
                <div className="h-[230px] animate-pulse rounded-md bg-muted/50" />
            ) : data.length > 0 ? (
                <ChartContainer config={config} className="h-[230px] w-full">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="fill-input" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-input)" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="var(--color-input)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="fill-cached" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-cached)" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="var(--color-cached)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="fill-output" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-output)" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="var(--color-output)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area dataKey="input" type="monotone" stackId="t" stroke="var(--color-input)" fill="url(#fill-input)" strokeWidth={2} />
                        <Area dataKey="cached" type="monotone" stackId="t" stroke="var(--color-cached)" fill="url(#fill-cached)" strokeWidth={2} />
                        <Area dataKey="output" type="monotone" stackId="t" stroke="var(--color-output)" fill="url(#fill-output)" strokeWidth={2} />
                    </AreaChart>
                </ChartContainer>
            ) : (
                <EmptyState
                    icon={<RectangleStackIcon className="h-12 w-12" />}
                    title="No token usage"
                    description="Token consumption will appear here once your agents start running."
                />
            )}
        </div>
    );
}

function TokenByModelCard({
    loading,
    models,
}: {
    loading: boolean;
    models: Array<{
        model: string;
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    }>;
}) {
    const compact = (n: number) =>
        new Intl.NumberFormat("en", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(n);
    const max = Math.max(1, ...models.map((m) => m.total_tokens));
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3">
                <h3 className="text-sm font-medium text-foreground">
                    Tokens by model
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Total this range
                </p>
            </div>
            {loading ? (
                <div className="h-[230px] animate-pulse rounded-md bg-muted/50" />
            ) : models.length > 0 ? (
                <div className="space-y-3">
                    {models.map((m) => (
                        <div key={m.model}>
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="truncate font-mono text-foreground">
                                    {m.model}
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                    {compact(m.total_tokens)}
                                </span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                                <div
                                    className="h-full rounded-full bg-[var(--chart-1)]"
                                    style={{ width: `${(m.total_tokens / max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <PanelEmpty
                    icon={<RectangleStackIcon className="h-12 w-12" />}
                    message="Per-model token usage will appear here once agents run."
                />
            )}
        </div>
    );
}

function UsageAreaCard({
    title,
    subtitle,
    loading,
    data,
    config,
    series,
    legend,
}: {
    title: string;
    subtitle: string;
    loading: boolean;
    data: Array<Record<string, number | string>>;
    config: ChartConfig;
    series: Array<{ key: string }>;
    legend: Array<{ color: string; label: string; value: string }>;
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-foreground">{title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className="flex gap-5">
                    {legend.map((l) => (
                        <Legend key={l.label} color={l.color} label={l.label} value={l.value} />
                    ))}
                </div>
            </div>
            {loading ? (
                <div className="h-[230px] animate-pulse rounded-md bg-muted/50" />
            ) : data.length > 0 ? (
                <ChartContainer config={config} className="h-[230px] w-full">
                    <AreaChart data={data}>
                        <defs>
                            {series.map((sr) => (
                                <linearGradient
                                    key={sr.key}
                                    id={`fill-${sr.key}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor={`var(--color-${sr.key})`} stopOpacity={0.18} />
                                    <stop offset="100%" stopColor={`var(--color-${sr.key})`} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={24}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        {series.map((sr) => (
                            <Area
                                key={sr.key}
                                dataKey={sr.key}
                                type="monotone"
                                stackId="u"
                                stroke={`var(--color-${sr.key})`}
                                fill={`url(#fill-${sr.key})`}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            ) : (
                <EmptyState
                    icon={<RectangleStackIcon className="h-12 w-12" />}
                    title="No data"
                    description="Activity will appear here once available."
                />
            )}
        </div>
    );
}

const METHOD_COLORS = [
    "#2f6fdb",
    "var(--primary)",
    "#0f8a4a",
    "var(--muted-foreground)",
    "#a85b00",
    "#7c3aed",
    "#0891b2",
    "#be185d",
];

const METHOD_LABELS: Record<string, string> = {
    email_password: "Email + password",
    oauth: "OAuth",
    "oauth.google": "Google OAuth",
    "oauth.github": "GitHub OAuth",
    magic_link: "Magic link",
    passkey: "Passkey",
    otp: "OTP",
    enterprise_sso: "Enterprise SSO",
    password_reset: "Password reset",
};

function prettyMethod(raw: string): string {
    if (METHOD_LABELS[raw]) return METHOD_LABELS[raw];
    return raw
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toBars(items?: BreakdownItem[]): { label: string; value: number }[] {
    const rows = items ?? [];
    const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;
    return rows.map((r) => ({
        label: r.label,
        value: Math.round((r.count / total) * 100),
    }));
}

function PanelEmpty({ icon, message }: { icon: ReactNode; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2.5 py-9 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                {icon}
            </div>
            <p className="max-w-[200px] text-xs text-muted-foreground">
                {message}
            </p>
        </div>
    );
}

function AuthTrendCard({
    loading,
    data,
    config,
    signinsTotal,
    signinsChange,
    signupsTotal,
    signupsChange,
}: {
    loading: boolean;
    data: Array<{ label: string; signins: number; signups: number }>;
    config: ChartConfig;
    signinsTotal: string;
    signinsChange?: number;
    signupsTotal: string;
    signupsChange?: number;
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-medium text-foreground">
                        Authentication trend
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Last 7 days · UTC
                    </p>
                </div>
                <div className="flex gap-5">
                    <Legend
                        color="var(--chart-1)"
                        label="Sign-ins"
                        value={signinsTotal}
                        change={signinsChange}
                    />
                    <Legend
                        color="var(--primary)"
                        label="Sign-ups"
                        value={signupsTotal}
                        change={signupsChange}
                    />
                </div>
            </div>
            {loading ? (
                <div className="h-[230px] animate-pulse rounded-md bg-muted/50" />
            ) : data.length > 0 ? (
                <ChartContainer config={config} className="h-[230px] w-full">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient
                                id="fill-signins"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-signins)"
                                    stopOpacity={0.18}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-signins)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fill-signups"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-signups)"
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-signups)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={16}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                            dataKey="signins"
                            type="monotone"
                            stroke="var(--color-signins)"
                            fill="url(#fill-signins)"
                            strokeWidth={2}
                        />
                        <Area
                            dataKey="signups"
                            type="monotone"
                            stroke="var(--color-signups)"
                            fill="url(#fill-signups)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            ) : (
                <EmptyState
                    icon={<RectangleStackIcon className="h-12 w-12" />}
                    title="No daily metrics"
                    description="Daily sign-in and sign-up counts will appear here once activity is available."
                />
            )}
        </div>
    );
}

function Legend({
    color,
    label,
    value,
    change,
}: {
    color: string;
    label: string;
    value: string;
    change?: number;
}) {
    const hasChange = typeof change === "number";
    const positive = (change ?? 0) >= 0;
    return (
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <span
                    className="size-2 rounded-[2px]"
                    style={{ background: color }}
                />
                {label}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-medium tabular-nums text-foreground">
                    {value}
                </span>
                {hasChange ? (
                    <span
                        className={cn(
                            "font-mono text-[11px] font-medium",
                            positive
                                ? "text-emerald-600 dark:text-emerald-500"
                                : "text-rose-600 dark:text-rose-500",
                        )}
                    >
                        {positive ? "▲" : "▼"}{" "}
                        {Math.abs(change as number).toFixed(1)}%
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function PanelHead({
    title,
    sub,
    badge,
}: {
    title: string;
    sub: string;
    badge?: string;
}) {
    return (
        <div className="mb-3 flex items-start justify-between gap-3">
            <div>
                <h3 className="text-[13px] font-medium leading-tight text-foreground">
                    {title}
                </h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
            </div>
            {badge ? (
                <Pill tone={badge === "live" ? "ok" : "mute"}>{badge}</Pill>
            ) : null}
        </div>
    );
}

function BarListCard({
    title,
    sub,
    badge,
    accent,
    rows,
    emptyIcon,
    emptyMessage,
}: {
    title: string;
    sub: string;
    badge?: string;
    accent: string;
    rows: Array<{ label: string; value: number }>;
    emptyIcon: ReactNode;
    emptyMessage: string;
}) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <PanelHead title={title} sub={sub} badge={badge} />
            <div className="flex flex-col">
                {rows.length === 0 ? (
                    <PanelEmpty icon={emptyIcon} message={emptyMessage} />
                ) : rows.map((row, index) => (
                    <div
                        key={row.label}
                        className={cn(
                            "py-2.5",
                            index < rows.length - 1 &&
                                "border-b border-border",
                        )}
                    >
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs text-secondary-foreground">
                                {row.label}
                            </span>
                            <span className="font-mono text-[11px] text-foreground">
                                {row.value}%
                            </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${(row.value / max) * 100}%`,
                                    background: accent,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MethodsCard({
    data,
}: {
    data: { label: string; count: number; color: string }[];
}) {
    const total = data.reduce((sum, m) => sum + m.count, 0);
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-medium text-foreground">
                        Sign-in methods
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        How users authenticate.
                    </p>
                </div>
            </div>
            {total === 0 ? (
                <PanelEmpty
                    icon={<FingerPrintIcon className="size-4.5" />}
                    message="Sign-in methods will appear once users authenticate."
                />
            ) : (
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <MethodsDonut data={data} total={total} />
                    <div className="flex flex-col gap-2">
                        {data.map((m) => {
                            const pct = Math.round((m.count / total) * 100);
                            return (
                                <div
                                    key={m.label}
                                    className="grid grid-cols-[10px_1fr_auto_36px] items-center gap-2"
                                >
                                    <span
                                        className="size-2 rounded-[2px]"
                                        style={{ background: m.color }}
                                    />
                                    <span className="truncate text-xs text-secondary-foreground">
                                        {m.label}
                                    </span>
                                    <span className="text-right font-mono text-[11px] text-muted-foreground">
                                        {m.count}
                                    </span>
                                    <span className="text-right font-mono text-[11px] font-medium text-foreground">
                                        {pct}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function MethodsDonut({
    data,
    total,
}: {
    data: { label: string; count: number; color: string }[];
    total: number;
}) {
    const r = 42;
    const cx = 50;
    const cy = 50;
    const stroke = 14;
    const C = 2 * Math.PI * r;
    let acc = 0;
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" className="block">
            <circle
                cx={cx}
                cy={cy}
                r={r}
                stroke="var(--border)"
                strokeWidth={stroke}
                fill="none"
            />
            {data.map((d) => {
                const frac = d.count / total;
                const dash = `${(C * frac).toFixed(2)} ${C.toFixed(2)}`;
                const offset = -((acc / total) * C);
                acc += d.count;
                return (
                    <circle
                        key={d.label}
                        cx={cx}
                        cy={cy}
                        r={r}
                        stroke={d.color}
                        strokeWidth={stroke}
                        fill="none"
                        strokeDasharray={dash}
                        strokeDashoffset={offset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                    />
                );
            })}
            <text
                x={cx}
                y={cy - 1}
                textAnchor="middle"
                className="fill-foreground"
                style={{ font: "500 16px var(--font-sans)" }}
            >
                {total.toLocaleString("en-US")}
            </text>
            <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{
                    font: "500 8px var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                }}
            >
                sign-ins
            </text>
        </svg>
    );
}

type ActivityFilter = "sign-in" | "sign-up";

function RecentActivityCard({
    loading,
    signins,
    signups,
}: {
    loading: boolean;
    signins: RecentSignup[];
    signups: RecentSignup[];
}) {
    const [filter, setFilter] = useState<ActivityFilter>("sign-in");
    const rows = filter === "sign-up" ? signups : signins;

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
                <div>
                    <h3 className="text-sm font-medium text-foreground">
                        Recent authentication activity
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Live feed of sign-ins and sign-ups across this
                        deployment.
                    </p>
                </div>
                <div className="flex gap-0.5 rounded-md border border-border bg-secondary p-0.5">
                    {(
                        [
                            ["sign-in", "Sign-ins"],
                            ["sign-up", "Sign-ups"],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setFilter(value)}
                            className={cn(
                                "h-6 rounded-sm px-3 text-[13px] font-medium transition-colors",
                                filter === value
                                    ? "bg-card text-foreground shadow-[0_0_0_0.5px_var(--input),0_1px_2px_rgba(0,0,0,0.06)]"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <table className="w-full caption-bottom text-sm">
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>When</TableHead>
                        <TableHead className="w-10" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <SkeletonTableRows rows={6} columns={5} withAvatar />
                    ) : rows.length ? (
                        rows.map((user, index) => {
                            const name = user.name || "Anonymous";
                            const initials = name
                                .split(" ")
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                            return (
                                <TableRow
                                    key={`${user.email || "unknown"}-${user.date}-${index}`}
                                    className="cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="size-7">
                                                <AvatarFallback className="text-[10px]">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">
                                                {name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-secondary-foreground">
                                        {user.email || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-mono text-xs text-secondary-foreground">
                                            <FingerPrintIcon className="size-3.5 text-muted-foreground" />
                                            <span>
                                                {user.method || "email_password"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {format(
                                            new Date(user.date),
                                            "MMM dd, HH:mm",
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <ChevronRightIcon className="size-4" />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="p-0">
                                <EmptyState
                                    icon={<UserPlusIcon className="h-12 w-12" />}
                                    title="No activity yet"
                                    description="Sign-ins and sign-ups will appear here once users start authenticating."
                                />
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </table>

            <div className="flex items-center justify-between border-t border-border bg-secondary px-4 py-3">
                <span className="font-mono text-[11px] text-muted-foreground">
                    showing {rows.length} event{rows.length === 1 ? "" : "s"}
                </span>
            </div>
        </div>
    );
}

function Sparkline({
    data,
    accent,
    w = 96,
    h = 30,
}: {
    data: number[];
    accent: string;
    w?: number;
    h?: number;
}) {
    const gradientId = useId();
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = w / (data.length - 1);
    const points = data.map(
        (v, i) => [i * stepX, h - ((v - min) / range) * (h - 4) - 2] as const,
    );
    const line = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
        .join(" ");
    const area = `${line} L ${w} ${h} L 0 ${h} Z`;
    const last = points[points.length - 1];
    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            className="block shrink-0"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
                d={line}
                fill="none"
                stroke={accent}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={last[0]} cy={last[1]} r="2.5" fill={accent} />
        </svg>
    );
}

function KpiCard({
    label,
    value,
    change,
    foot = "vs last period",
    spark,
    accent = "var(--primary)",
}: {
    label: string;
    value: string;
    change?: number;
    foot?: string;
    spark?: number[];
    accent?: string;
}) {
    const hasChange = typeof change === "number";
    const positive = (change ?? 0) >= 0;
    return (
        <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card px-4 py-4">
            <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                <span
                    className="size-1.5 rounded-full"
                    style={{ background: accent }}
                />
                {label}
            </div>
            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[28px] leading-none font-medium tracking-tight tabular-nums text-foreground">
                        {value}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                        {hasChange ? (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-0.5 font-mono text-[11px] font-medium",
                                    positive
                                        ? "text-emerald-600 dark:text-emerald-500"
                                        : "text-rose-600 dark:text-rose-500",
                                )}
                            >
                                {positive ? "▲" : "▼"}{" "}
                                {Math.abs(change as number).toFixed(1)}%
                            </span>
                        ) : null}
                        <span className="font-mono text-[11px] text-muted-foreground/70">
                            {foot}
                        </span>
                    </div>
                </div>
                {spark && spark.length > 1 ? (
                    <Sparkline data={spark} accent={accent} />
                ) : null}
            </div>
        </div>
    );
}
