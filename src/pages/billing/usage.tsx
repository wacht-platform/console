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
import { Badge } from "@/components/ui/badge";
import { InlineLoader } from "@/components/ui/loading-screen";
import clsx from "clsx";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { plans, enterprisePlan } from "./plans";

const UsageBar = ({ label, metric, limit, unit, icon: Icon, overageRate, getUsage, getCost }: any) => {
    const usage = getUsage(metric);
    const cost = getCost(metric);
    const hasLimit = typeof limit === 'number';
    const percent = hasLimit && limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
    const isOverage = hasLimit && limit > 0 && usage > limit;

    return (
        <div className="group">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Icon className="w-4 h-4 text-zinc-600" />
                    {label}
                </div>
                <div className="text-right">
                    <div className="text-sm font-mono text-zinc-300">
                        {usage.toLocaleString()} <span className="text-zinc-600">/ {hasLimit ? (limit >= 1000 ? `${limit / 1000}k` : limit) : '∞'}</span> {unit}
                    </div>
                </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden relative">
                <div
                    className={clsx("h-full rounded-full transition-all duration-500", isOverage ? "bg-red-500" : "bg-zinc-600 group-hover:bg-zinc-500")}
                    style={{ width: hasLimit ? `${percent}%` : '2%' }}
                />
            </div>
            <div className="mt-2 flex justify-between items-center h-5">
                <div className="text-[10px] text-zinc-600 font-normal uppercase tracking-wider">
                    {isOverage ? (
                        <span className="text-red-400">Overage: {(usage - limit).toLocaleString()} {unit}</span>
                    ) : hasLimit ? (
                        `${(limit - usage).toLocaleString()} remaining`
                    ) : (
                        "Unlimited quota"
                    )}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    {cost > 0 && <span>{(cost / 100).toFixed(2)} INR</span>}
                    {overageRate && <span className="text-zinc-600">({overageRate})</span>}
                </div>
            </div>
        </div>
    )
};

export default function BillingUsagePage() {
    const [pulseTopUpOpen, setPulseTopUpOpen] = useState(false);
    const navigate = useNavigate();

    const { data: billingAccount, isLoading, refetch } = useBillingAccount();

    const hasActiveSubscription = billingAccount?.subscription?.status === "active";
    const { data: usageData } = useUsageMetrics({ enabled: hasActiveSubscription });
    const { data: transactions } = usePulseTransactions({ enabled: hasActiveSubscription });

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
            ? (plans.find((p) => subscription.provider_subscription_id?.includes(p.id)) || (subscription.provider_subscription_id?.includes('enterprise') ? enterprisePlan : plans[0]))
            : plans[0];

    const getUsage = (metric: string) => usageData?.snapshots.find(s => s.metric_name === metric)?.quantity || 0;
    const totalCost = usageData?.snapshots.reduce((acc, s) => acc + (s.cost_cents || 0), 0) || 0;
    const getCost = (metric: string) => usageData?.snapshots.find(s => s.metric_name === metric)?.cost_cents || 0;

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

    const { start: billingPeriodStart, end: billingPeriodEnd } = getBillingCycle(billingAccount?.created_at);
    const formattedPeriod = `${format(billingPeriodStart, "MMM d")} - ${format(billingPeriodEnd, "MMM d, yyyy")}`;

    const isSubscriptionInactive = !subscription || subscription.status !== "active";

    if (isSubscriptionInactive) {
        return (
            <div className="space-y-16 animate-in fade-in duration-700">
                <div>
                    <h1 className="text-xl font-normal text-white tracking-tight mb-2">Usage & Credits</h1>
                    <p className="text-zinc-500 text-sm font-light">Monitor your platform consumption and estimated costs in real-time.</p>
                </div>
                <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
                        <CpuChipIcon className="w-48 h-48 text-zinc-500" />
                    </div>
                    <div className="relative z-10 text-center max-w-2xl mx-auto">
                        <div className="mb-6">
                            <Badge variant="outline" className="bg-zinc-900/50 text-zinc-500 border-zinc-800 text-[10px] px-3 py-1 font-normal uppercase tracking-wider">
                                No Active Subscription
                            </Badge>
                        </div>
                        <h2 className="text-2xl font-light text-white mb-4">Subscribe to Track Usage</h2>
                        <p className="text-zinc-500 text-sm font-light leading-relaxed mb-8">
                            Usage metrics and cost tracking are available with an active subscription.
                            Choose a plan to start monitoring your platform consumption.
                        </p>
                        <Button
                            size="lg"
                            className="bg-white text-black hover:bg-zinc-200 border-transparent text-sm h-11 font-medium px-8"
                            onClick={() => navigate('../subscription')}
                        >
                            View Plans & Pricing
                        </Button>
                    </div>
                </div>
                <PulseDashboard balance={billingAccount?.pulse_balance_cents || 0} onTopUp={() => setPulseTopUpOpen(true)} />
                <PulseTopUpDialog open={pulseTopUpOpen} onClose={() => setPulseTopUpOpen(false)} />
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <h1 className="text-xl font-normal text-white tracking-tight mb-2">Usage & Credits</h1>
                    <p className="text-zinc-500 text-sm font-light">
                        Managing <span className="text-zinc-400">{subscription?.provider_customer_id || 'Personal Account'}</span> • {formattedPeriod}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-zinc-500 mb-1 font-light">Estimated Cost</div>
                    <div className="text-4xl font-light text-zinc-100 tracking-tight">
                        {(totalCost / 100).toFixed(2)} <span className="text-sm text-zinc-500 ml-1">INR</span>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                {/* Single Column Quota Monitor */}
                <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-8">
                    <div className="flex items-center gap-2 mb-10">
                        <CpuChipIcon className="w-5 h-5 text-indigo-500/80" />
                        <h3 className="text-sm font-normal text-zinc-300">Resource Quota Monitor</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                        <UsageBar
                            label="Monthly Active Users (MAU)"
                            metric="mau"
                            limit={currentPlan.limits?.mau || 0}
                            unit="users"
                            icon={UserGroupIcon}
                            overageRate={currentPlan.overages?.mau}
                            getUsage={getUsage}
                            getCost={getCost}
                        />
                        <UsageBar
                            label="Active Organizations"
                            metric="mao"
                            limit={currentPlan.limits?.orgs || 0}
                            unit="orgs"
                            icon={BuildingOfficeIcon}
                            overageRate={currentPlan.overages?.orgs}
                            getUsage={getUsage}
                            getCost={getCost}
                        />
                        <UsageBar
                            label="Provisioned Workspaces"
                            metric="maw"
                            limit={currentPlan.limits?.workspaces || 0}
                            unit="spaces"
                            icon={FolderIcon}
                            overageRate={currentPlan.overages?.workspaces}
                            getUsage={getUsage}
                            getCost={getCost}
                        />
                        <UsageBar
                            label="Webhooks Delivered"
                            metric="webhooks"
                            limit={currentPlan.limits?.webhooks || 0}
                            unit="reqs"
                            icon={GlobeAltIcon}
                            overageRate="0.10 /1k"
                            getUsage={getUsage}
                            getCost={getCost}
                        />
                        <UsageBar
                            label="API Identity Checks"
                            metric="api_keys"
                            limit={currentPlan.limits?.api_keys}
                            unit="checks"
                            icon={ShieldCheckIcon}
                            overageRate={currentPlan.overages?.api_keys}
                            getUsage={getUsage}
                            getCost={getCost}
                        />
                        <UsageBar
                            label="Emails Sent"
                            metric="emails"
                            limit={currentPlan.limits?.emails || 0}
                            unit="emails"
                            icon={BoltIcon}
                            overageRate={currentPlan.overages?.emails}
                            getUsage={getUsage}
                            getCost={getCost}
                        />
                    </div>

                    <div className="mt-12 pt-8 border-t border-zinc-800/30">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-light flex items-center gap-2">
                                <ClockIcon className="w-3.5 h-3.5" />
                                Rate limiting enforced at
                            </span>
                            <span className="font-mono text-indigo-400 uppercase">{currentPlan.rateLimit || 'Custom'}</span>
                        </div>
                    </div>
                </div>

                <PulseDashboard balance={billingAccount?.pulse_balance_cents || 0} onTopUp={() => setPulseTopUpOpen(true)} />

                {/* Credit Activity History */}
                <div className="bg-[#111113] border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/10">
                        <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <ClockIcon className="w-3.5 h-3.5 text-zinc-600" />
                            Credit Activity History
                        </h4>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800/40">
                                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Transaction Type</th>
                                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Reference ID</th>
                                    <th className="px-6 py-3 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Pulse Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/20">
                                {transactions && transactions.length > 0 ? (
                                    transactions.slice(0, 10).map((tx) => (
                                        <tr key={tx.id} className="group hover:bg-zinc-900/10 transition-colors">
                                            <td className="px-6 py-4 text-[12px] text-zinc-500 font-light">
                                                {format(parseISO(tx.created_at), "MMM d, HH:mm")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={clsx(
                                                    "text-[8px] px-2 py-0.5 font-medium uppercase tracking-widest rounded-full",
                                                    tx.transaction_type === 'purchase' ? "text-emerald-400 border-emerald-500/10 bg-emerald-500/[0.02]" :
                                                        tx.transaction_type.startsWith('usage') ? "text-zinc-500 border-zinc-800" :
                                                            "text-indigo-400 border-indigo-500/10 bg-indigo-500/[0.02]"
                                                )}>
                                                    {tx.transaction_type.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-[12px] text-zinc-600 font-light truncate max-w-[200px]">
                                                {tx.reference_id || '-'}
                                            </td>
                                            <td className={clsx(
                                                "px-6 py-4 text-right text-[13px] font-mono",
                                                tx.amount_pulse_cents > 0 ? "text-emerald-400" : "text-zinc-300"
                                            )}>
                                                {tx.amount_pulse_cents > 0 ? '+' : ''}{tx.amount_pulse_cents.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 text-xs font-light italic">
                                            No subscription usage or pulse purchases found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <PulseTopUpDialog open={pulseTopUpOpen} onClose={() => setPulseTopUpOpen(false)} />
        </div>
    );
}

function PulseDashboard({ balance, onTopUp }: { balance: number, onTopUp: () => void }) {
    return (
        <div className="bg-[#111113] border border-zinc-800/60 rounded-xl py-6 px-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <BoltIcon className="w-32 h-32 text-indigo-500" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row md:items-center gap-8 lg:gap-12">
                    <div>
                        <div className="text-[10px] text-zinc-500 mb-1.5 font-medium uppercase tracking-[0.15em]">Available Balance</div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-light text-white tracking-tighter tabular-nums">
                                {(balance / 100).toFixed(2)}
                            </span>
                            <span className="text-sm text-zinc-500 font-light">INR</span>
                        </div>
                        <div className="text-[10px] text-indigo-400/80 font-medium uppercase tracking-widest mt-2 bg-indigo-500/5 border border-indigo-500/10 w-fit px-2.5 py-0.5 rounded-full">
                            {balance.toLocaleString()} Pulse
                        </div>
                    </div>
                    <div className="max-w-sm">
                        <p className="text-[12px] text-zinc-500 font-light leading-relaxed italic border-l border-zinc-800 pl-6">
                            Credits never expire and are shared across your workspace. Use them for AI Agents, SMS, and other platform features. Note: Credits cannot be used to offset recurring subscription costs.
                        </p>
                    </div>
                </div>
                <div className="shrink-0">
                    <Button
                        className="px-8 bg-white text-black hover:bg-zinc-200 border-transparent text-[11px] h-10 font-medium rounded-lg shadow-xl shadow-white/5 transition-all"
                        onClick={onTopUp}
                    >
                        <PlusIcon className="w-3.5 h-3.5 mr-2" />
                        Refill Balance
                    </Button>
                </div>
            </div>
        </div>
    );
}
