import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    useBillingAccount,
    useUsageMetrics,
    usePulseTransactions,
} from "@/lib/api/hooks/use-billing";
import { PulseTopUpDialog } from "@/components/pulse-topup-dialog";
import {
    CpuChipIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    FolderIcon,
    GlobeAltIcon,
    BoltIcon,
    PlusIcon,
    ClockIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SectionLabel } from "@/components/ui/section-label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/app-table";
import { TableEmptyRow } from "@/components/ui/table-empty-row";
import { InlineLoader } from "@/components/ui/loading-screen";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { plans, enterprisePlan } from "./plans";

const UsageBar = ({
    label,
    metric,
    limit,
    unit,
    icon: Icon,
    overageRate,
    getUsage,
    getCost,
    formatCost,
}: any) => {
    const usage = getUsage(metric);
    const cost = getCost(metric);
    const hasLimit = typeof limit === "number" && limit > 0;
    const percent = hasLimit ? Math.min((usage / limit) * 100, 100) : 0;
    const isOverage = hasLimit && usage > limit;

    return (
        <div>
            <div className="mb-2 flex items-end justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                </div>
                <div className="text-sm text-foreground">
                    {usage.toLocaleString()}{" "}
                    <span className="text-muted-foreground">
                        /{" "}
                        {hasLimit
                            ? limit >= 1000
                                ? `${limit / 1000}k`
                                : limit
                            : "∞"}
                    </span>{" "}
                    <span className="text-muted-foreground">{unit}</span>
                </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverage ? "bg-destructive" : "bg-primary",
                    )}
                    style={{ width: hasLimit ? `${percent}%` : "3%" }}
                />
            </div>
            <div className="mt-2 flex h-5 items-center justify-between">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {isOverage ? (
                        <span className="text-destructive">
                            Overage: {(usage - limit).toLocaleString()} {unit}
                        </span>
                    ) : hasLimit ? (
                        `${(limit - usage).toLocaleString()} remaining`
                    ) : (
                        "Unlimited quota"
                    )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {cost > 0 && (
                        <span className="font-mono">{formatCost(cost)}</span>
                    )}
                    {overageRate && (
                        <span className="text-muted-foreground/60">
                            ({overageRate})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function BillingUsagePage() {
    const [pulseTopUpOpen, setPulseTopUpOpen] = useState(false);
    const navigate = useNavigate();

    const { data: billingAccount, isLoading, refetch } = useBillingAccount();

    const billingCurrency = (billingAccount?.currency || "USD").toUpperCase();
    const formatCurrencyFromCents = (valueInCents: number) =>
        new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: billingCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valueInCents / 100);

    const hasActiveSubscription =
        billingAccount?.subscription?.status === "active";
    const { data: usageData } = useUsageMetrics({
        enabled: hasActiveSubscription,
    });
    const { data: transactions } = usePulseTransactions({
        enabled: hasActiveSubscription,
    });

    useEffect(() => {
        const PulseCheckoutInitiated = sessionStorage.getItem(
            "pulse_checkout_initiated",
        );
        if (PulseCheckoutInitiated) {
            sessionStorage.removeItem("pulse_checkout_initiated");
            refetch();
        }
    }, [refetch]);

    if (isLoading) {
        return <InlineLoader />;
    }

    const subscription = billingAccount?.subscription;
    const currentPlan =
        subscription?.status === "active"
            ? plans.find((p) => p.id === subscription.plan_name) ||
              (subscription.plan_name === "enterprise"
                  ? enterprisePlan
                  : plans[0])
            : plans[0];

    const getUsage = (metric: string) =>
        usageData?.snapshots.find((s) => s.metric_name === metric)?.quantity ||
        0;
    const totalCost =
        usageData?.snapshots.reduce((acc, s) => acc + (s.cost_cents || 0), 0) ||
        0;
    const getCost = (metric: string) =>
        usageData?.snapshots.find((s) => s.metric_name === metric)
            ?.cost_cents || 0;

    const getBillingCycle = (createdAt?: string) => {
        const d = new Date();
        if (!createdAt) return { start: startOfMonth(d), end: endOfMonth(d) };
        const createdDate = parseISO(createdAt);
        const day = createdDate.getDate();
        let start = new Date(d.getFullYear(), d.getMonth(), day);
        if (start > d) start = new Date(d.getFullYear(), d.getMonth() - 1, day);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, day);
        return { start, end };
    };

    const { start: billingPeriodStart, end: billingPeriodEnd } =
        getBillingCycle(billingAccount?.created_at);
    const formattedPeriod = `${format(billingPeriodStart, "MMM d")} – ${format(billingPeriodEnd, "MMM d, yyyy")}`;

    const isSubscriptionInactive =
        !subscription || subscription.status !== "active";

    if (isSubscriptionInactive) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-foreground">
                        Usage &amp; credits
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Monitor your platform consumption and estimated costs in
                        real-time.
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-10">
                    <div className="mx-auto max-w-xl text-center">
                        <div className="flex justify-center">
                            <Pill tone="mute">no active subscription</Pill>
                        </div>
                        <h2 className="mt-4 text-xl font-medium text-foreground">
                            Subscribe to track usage
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Usage metrics and cost tracking are available with an
                            active subscription. Choose a plan to start
                            monitoring your platform consumption.
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => navigate("../subscription")}
                        >
                            View plans &amp; pricing
                        </Button>
                    </div>
                </div>
                <PulseDashboard
                    balance={billingAccount?.pulse_balance_cents || 0}
                    currency={billingCurrency}
                    onTopUp={() => setPulseTopUpOpen(true)}
                />
                <PulseTopUpDialog
                    open={pulseTopUpOpen}
                    onClose={() => setPulseTopUpOpen(false)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-foreground">
                        Usage &amp; credits
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Managing{" "}
                        <span className="text-foreground">
                            {subscription?.provider_customer_id ||
                                "Personal account"}
                        </span>{" "}
                        · {formattedPeriod}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                        Estimated cost
                    </p>
                    <p className="mt-0.5 font-mono text-3xl font-medium tracking-tight text-foreground">
                        {formatCurrencyFromCents(totalCost)}
                    </p>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-8 flex items-center gap-2">
                    <CpuChipIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">
                        Resource quota monitor
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                    <UsageBar
                        label="Monthly active users (MAU)"
                        metric="mau"
                        limit={currentPlan.limits?.mau || 0}
                        unit="users"
                        icon={UserGroupIcon}
                        overageRate={currentPlan.overages?.mau}
                        getUsage={getUsage}
                        getCost={getCost}
                        formatCost={formatCurrencyFromCents}
                    />
                    <UsageBar
                        label="Active organizations"
                        metric="mao"
                        limit={currentPlan.limits?.orgs || 0}
                        unit="orgs"
                        icon={BuildingOfficeIcon}
                        overageRate={currentPlan.overages?.orgs}
                        getUsage={getUsage}
                        getCost={getCost}
                        formatCost={formatCurrencyFromCents}
                    />
                    <UsageBar
                        label="Provisioned workspaces"
                        metric="maw"
                        limit={currentPlan.limits?.workspaces || 0}
                        unit="spaces"
                        icon={FolderIcon}
                        overageRate={currentPlan.overages?.workspaces}
                        getUsage={getUsage}
                        getCost={getCost}
                        formatCost={formatCurrencyFromCents}
                    />
                    <UsageBar
                        label="Webhooks delivered"
                        metric="webhooks"
                        limit={currentPlan.limits?.webhooks || 0}
                        unit="reqs"
                        icon={GlobeAltIcon}
                        overageRate="0.10 /1k"
                        getUsage={getUsage}
                        getCost={getCost}
                        formatCost={formatCurrencyFromCents}
                    />
                    <UsageBar
                        label="API identity checks"
                        metric="api_keys"
                        limit={currentPlan.limits?.api_keys}
                        unit="checks"
                        icon={ShieldCheckIcon}
                        overageRate={currentPlan.overages?.api_keys}
                        getUsage={getUsage}
                        getCost={getCost}
                        formatCost={formatCurrencyFromCents}
                    />
                    <UsageBar
                        label="Emails sent"
                        metric="emails"
                        limit={currentPlan.limits?.emails || 0}
                        unit="emails"
                        icon={BoltIcon}
                        overageRate={currentPlan.overages?.emails}
                        getUsage={getUsage}
                        getCost={getCost}
                        formatCost={formatCurrencyFromCents}
                    />
                </div>

                <div className="mt-8 border-t border-border pt-5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <ClockIcon className="h-3.5 w-3.5" />
                            Rate limiting enforced at
                        </span>
                        <span className="font-mono uppercase text-primary">
                            {currentPlan.rateLimit || "Custom"}
                        </span>
                    </div>
                </div>
            </div>

            <PulseDashboard
                balance={billingAccount?.pulse_balance_cents || 0}
                currency={billingCurrency}
                onTopUp={() => setPulseTopUpOpen(true)}
            />

            <section className="space-y-3">
                <SectionLabel>Credit activity history</SectionLabel>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction type</TableHead>
                            <TableHead>Reference ID</TableHead>
                            <TableHead className="text-right">
                                Pulse amount
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions && transactions.length > 0 ? (
                            transactions.slice(0, 10).map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {format(
                                            parseISO(tx.created_at),
                                            "MMM d, HH:mm",
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Pill
                                            tone={
                                                tx.transaction_type ===
                                                "purchase"
                                                    ? "ok"
                                                    : tx.transaction_type.startsWith(
                                                            "usage",
                                                        )
                                                      ? "mute"
                                                      : "info"
                                            }
                                        >
                                            {tx.transaction_type.replace(
                                                "_",
                                                " ",
                                            )}
                                        </Pill>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                                        {tx.reference_id || "—"}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "text-right font-mono text-xs",
                                            tx.amount_pulse_cents > 0
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-foreground",
                                        )}
                                    >
                                        {tx.amount_pulse_cents > 0 ? "+" : ""}
                                        {Math.abs(
                                            tx.amount_pulse_cents,
                                        ).toLocaleString()}{" "}
                                        pulse
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableEmptyRow
                                colSpan={4}
                                title="No activity yet"
                                description="Subscription usage and pulse purchases appear here."
                            />
                        )}
                    </TableBody>
                </Table>
            </section>

            <PulseTopUpDialog
                open={pulseTopUpOpen}
                onClose={() => setPulseTopUpOpen(false)}
            />
        </div>
    );
}

function PulseDashboard({
    balance,
    currency,
    onTopUp,
}: {
    balance: number;
    currency: string;
    onTopUp: () => void;
}) {
    const formattedBalance = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(balance / 100);

    return (
        <div className="rounded-lg border border-border bg-card px-6 py-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="flex flex-col gap-6 md:flex-row md:items-center lg:gap-10">
                    <div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Available balance
                        </p>
                        <p className="mt-1 font-mono text-3xl font-medium tabular-nums text-foreground">
                            {formattedBalance}
                        </p>
                        <span className="mt-2 inline-flex w-fit rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                            {balance.toLocaleString()} pulse
                        </span>
                    </div>
                    <p className="max-w-sm border-l border-border pl-5 text-xs leading-relaxed text-muted-foreground">
                        Credits never expire and are shared across your
                        workspace. Use them for AI Agents, SMS, and other
                        platform features. Credits cannot be used to offset
                        recurring subscription costs.
                    </p>
                </div>
                <Button className="shrink-0" onClick={onTopUp}>
                    <PlusIcon className="h-3.5 w-3.5" />
                    Refill balance
                </Button>
            </div>
        </div>
    );
}
