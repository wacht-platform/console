import { useState, useEffect } from "react";
import {
  useBillingAccount,
  useCustomerPortal,
  useChangePlan,
  useUsageMetrics,
} from "@/lib/api/hooks/use-billing";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import {
  RocketLaunchIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  FolderIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BoltIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineLoader } from "@/components/ui/loading-screen";
import clsx from "clsx";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { usePulseTransactions } from "@/lib/api/hooks/use-billing";
import { PulseTopUpDialog } from "@/components/pulse-topup-dialog";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    priceDisplay: "$0",
    description: "Trial usage with CIAM suite",
    monthlyActiveUsers: 300,
    freeOrgs: 0,
    freeWorkspaces: 0,
    rateLimit: "50 req/min",
    features: [
      "300 MAU included",
      "1,000 Emails/mo",
      "50 req/min rate limit",
      "Trial CIAM Suite",
    ],
    limits: {
      mau: 300,
      orgs: 0,
      workspaces: 0,
      emails: 1000,
    }
  },
  {
    id: "pro",
    name: "Pro",
    price: 25,
    priceDisplay: "$25",
    description: "All Features except consumer API keys",
    monthlyActiveUsers: 10000,
    freeOrgs: 500,
    freeWorkspaces: 2500,
    rateLimit: "100 req/min",
    features: [
      "10,000 MAU included",
      "500 Organizations",
      "2,500 Workspaces",
      "100k Webhooks/mo",
      "100 req/min rate limit",
    ],
    limits: {
      mau: 10000,
      orgs: 500,
      workspaces: 2500,
      webhooks: 100000,
    },
    overages: {
      mau: "$0.02 /user",
      orgs: "$0.75 /org",
      workspaces: "$0.75 /workspace",
      emails: "$1.20 /1k emails",
    }
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    priceDisplay: "$99",
    description: "Full Platform Access",
    popular: true,
    monthlyActiveUsers: 50000,
    freeOrgs: 3000,
    freeWorkspaces: 15000,
    rateLimit: "500 req/min",
    features: [
      "50,000 MAU included",
      "3,000 Organizations",
      "15,000 Workspaces",
      "1M Webhooks/mo",
      "Unlimited Consumer API Apps",
      "API Key Checks ($0.2/10k)",
      "90 Days Log Retention",
    ],
    limits: {
      mau: 50000,
      orgs: 3000,
      workspaces: 15000,
      webhooks: 1000000,
    },
    overages: {
      mau: "$0.02 /user",
      orgs: "$0.50 /org",
      workspaces: "$0.50 /workspace",
      emails: "$1.20 /1k emails",
    }
  },
];

const enterprisePlan = {
  id: "enterprise",
  name: "Enterprise",
  price: null,
  priceDisplay: "Custom",
  description: "For large-scale deployments",
  monthlyActiveUsers: "Custom",
  features: [
    "Unlimited volume",
    "Dedicated support",
    "Custom contracts",
    "SLA Guarantee",
    "On-premise deployment options"
  ],
  rateLimit: "Custom",
  limits: {
    mau: 0,
    orgs: 0,
    workspaces: 0,
    webhooks: 0,
  },
  overages: undefined
};

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingSetupOpen, setBillingSetupOpen] = useState(false);
  const [pulseTopUpOpen, setPulseTopUpOpen] = useState(false);

  const { data: billingAccount, isLoading, refetch } = useBillingAccount();
  const { data: usageData } = useUsageMetrics();
  const { data: transactions } = usePulseTransactions();
  const customerPortal = useCustomerPortal();
  const changePlan = useChangePlan();

  useEffect(() => {
    const checkoutInitiated = sessionStorage.getItem(
      "billing_checkout_initiated",
    );
    const PulseCheckoutInitiated = sessionStorage.getItem(
      "pulse_checkout_initiated",
    );
    if (checkoutInitiated || PulseCheckoutInitiated) {
      sessionStorage.removeItem("billing_checkout_initiated");
      sessionStorage.removeItem("pulse_checkout_initiated");
      refetch();
    }
  }, [refetch]);

  const handleSelectPlan = (planId: string) => {

    if (planId === "enterprise") {
      window.open(
        "mailto:sales@wacht.dev?subject=Enterprise Plan Inquiry",
        "_blank",
      );
      return;
    }

    if (planId === currentPlan.id) return;
    if (subscription?.status === 'active') {
      if (confirm(`Switch to ${plans.find(p => p.id === planId)?.name}?`)) {
        handleChangePlan(planId);
      }
    } else {
      setSelectedPlan(planId);
      setBillingSetupOpen(true);
    }
  };

  const handleOpenPortal = async () => {
    try {
      const result = await customerPortal.mutateAsync();
      if (result?.portal_url) {
        window.open(result.portal_url, "_blank");
      }
    } catch (error) {
      console.error("Failed to open portal:", error);
    }
  };

  const handleChangePlan = async (planId: string) => {
    try {
      await changePlan.mutateAsync(planId);
      refetch();
    } catch (error) {
      console.error("Failed to change plan:", error);
    }
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  const subscription = billingAccount?.subscription;
  const currentPlan =
    subscription?.status === "active"
      ? (plans.find((p) => subscription.provider_subscription_id?.includes(p.id)) || (subscription.provider_subscription_id?.includes('enterprise') ? enterprisePlan : plans[0]))
      : plans[0];

  const now = new Date();
  const billingPeriodStart = startOfMonth(now);
  const billingPeriodEnd = endOfMonth(now);
  const formattedPeriod = `${format(billingPeriodStart, "MMM d")} - ${format(billingPeriodEnd, "MMM d, yyyy")}`;

  // Usage Helpers
  const getUsage = (metric: string) => usageData?.snapshots.find(s => s.metric_name === metric)?.quantity || 0;
  const getCost = (metric: string) => usageData?.snapshots.find(s => s.metric_name === metric)?.cost_cents || 0;
  const totalCost = usageData?.snapshots.reduce((acc, s) => acc + (s.cost_cents || 0), 0) || 0;

  const UsageBar = ({ label, metric, limit, unit, icon: Icon, overageRate }: any) => {
    const usage = getUsage(metric);
    const percent = Math.min((usage / (limit || 1)) * 100, 100);
    const isOverage = usage > limit;

    return (
      <div className="group">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Icon className="w-4 h-4 text-zinc-600" />
            {label}
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-zinc-300">
              {usage.toLocaleString()} <span className="text-zinc-600">/ {limit === 0 ? '0' : (limit >= 1000 ? `${limit / 1000}k` : limit)}</span> {unit}
            </div>
          </div>
        </div>
        <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden relative">
          <div
            className={clsx("h-full rounded-full transition-all duration-500", isOverage ? "bg-red-500" : "bg-zinc-600 group-hover:bg-zinc-500")}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center h-5">
          <div className="text-[10px] text-zinc-600 font-normal uppercase tracking-wider">
            {isOverage ? <span className="text-red-400">Overage Active</span> : `${(limit - usage).toLocaleString()} remaining`}
          </div>
          {overageRate && (
            <div className="text-[10px] text-zinc-500 px-1.5 py-0.5 border-zinc-800">
              Extra: {overageRate}
            </div>
          )}
        </div>
      </div>
    )
  };

  return (
    <div className="pb-24">
      {/* Header with Total Cost */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-xl font-normal text-zinc-100 mb-2">Billing & Limits</h1>
          <p className="text-zinc-500 text-sm font-light">Managing <span className="text-zinc-400">{subscription?.provider_customer_id || 'Personal Account'}</span> • {formattedPeriod}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-500 mb-1 font-light">Estimated Cost</div>
          <div className="text-4xl font-light text-zinc-100 tracking-tight">
            ${(totalCost / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

        {/* Left Col: Current Plan Status */}
        <div className="lg:col-span-2 space-y-6">

          {/* Plan Identity Card */}
          <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <RocketLaunchIcon className="w-32 h-32 text-zinc-500" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-normal text-white">{currentPlan.name} Plan</h2>
                  <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] px-2 font-normal">Active</Badge>
                </div>
                <p className="text-zinc-500 text-sm max-w-sm font-light">{currentPlan.description}</p>

                <div className="mt-6 flex gap-3">
                  <Button size="sm" variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs h-8 font-normal" onClick={handleOpenPortal}>
                    Manage Subscription
                  </Button>
                  <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-zinc-300 text-xs h-8 font-normal" onClick={handleOpenPortal}>
                    Invoices
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-500 mb-1 font-light">Base Price</div>
                <div className="text-2xl font-light text-zinc-200">{currentPlan.priceDisplay}<span className="text-sm text-zinc-600 font-light ml-0.5">/mo</span></div>
              </div>
            </div>
          </div>

          {/* Quota Monitor */}
          <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-8">
            <div className="flex items-center gap-2 mb-8">
              <CpuChipIcon className="w-5 h-5 text-indigo-500/80" />
              <h3 className="text-sm font-normal text-zinc-300">Quota Monitor</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <UsageBar
                label="MAU"
                metric="mau"
                limit={currentPlan.limits?.mau || 0}
                unit="users"
                icon={UserGroupIcon}
                overageRate={currentPlan.overages?.mau}
              />
              <UsageBar
                label="MAO"
                metric="mao"
                limit={currentPlan.limits?.orgs || 0}
                unit="orgs"
                icon={BuildingOfficeIcon}
                overageRate={currentPlan.overages?.orgs}
              />
              <UsageBar
                label="MAW"
                metric="maw"
                limit={currentPlan.limits?.workspaces || 0}
                unit="spaces"
                icon={FolderIcon}
                overageRate={currentPlan.overages?.workspaces}
              />
              <UsageBar
                label="Webhooks Delivered"
                metric="webhooks"
                limit={currentPlan.limits?.webhooks || 0}
                unit="reqs"
                icon={GlobeAltIcon}
                overageRate="$0.10 /1k"
              />
            </div>
          </div>
        </div>

        {/* Right Col: Usage Based Breakdown */}
        <div className="bg-[#111113] border border-zinc-800/60 rounded-xl p-6 h-fit">
          <h3 className="text-sm font-normal text-zinc-400 mb-6 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500/80" />
            Variable Costs
          </h3>

          <div className="space-y-4">
            {[
              { label: 'Overage MAU', cost: getCost('mau'), unit: 'users' },
              { label: 'Overage MAO', cost: getCost('mao'), unit: 'orgs' },
              { label: 'Overage MAW', cost: getCost('maw'), unit: 'spaces' },
              { label: 'API Keys Checks', cost: getCost('api_keys'), unit: 'checks' },
              { label: 'Emails Sent', cost: getCost('emails'), unit: 'emails' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/30 last:border-0">
                <span className="text-sm text-zinc-500 font-light">{item.label}</span>
                <span className="font-mono text-sm text-zinc-400 font-light">
                  {item.cost > 0 ? `$${(item.cost / 100).toFixed(2)}` : '-'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800/30">
            <div className="text-xs text-zinc-500 mb-2 font-light">Platform Rate Limits</div>
            <div className="flex justify-between items-center bg-zinc-900/30 p-2.5 rounded border border-zinc-800/50">
              <span className="text-xs text-zinc-500">Total Requests</span>
              <span className="text-xs font-mono text-indigo-400">{currentPlan.rateLimit || 'Custom'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse Credits Dashboard */}
      <div className="mb-10">
        <h3 className="text-base font-light text-zinc-300 mb-4 flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-indigo-400" />
          Wacht Pulse Credits
        </h3>

        <div className="flex flex-col gap-4">
          <div className="bg-[#111113] border border-zinc-800/60 rounded-xl py-5 px-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <BoltIcon className="w-24 h-24 text-indigo-500" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-8">
                <div>
                  <div className="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-widest">Available Credits</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl text-zinc-500 font-light">$</span>
                    <span className="text-4xl font-light text-white tracking-tighter tabular-nums">
                      {((billingAccount?.pulse_balance_cents || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-400/50 font-medium uppercase tracking-widest mt-1 bg-indigo-500/5 border border-indigo-500/10 w-fit px-2 py-0.5 rounded-full">
                    {(billingAccount?.pulse_balance_cents || 0).toLocaleString()} Pulse
                  </div>
                </div>

                <div className="max-w-xs">
                  <p className="text-[11px] text-zinc-500 font-light leading-relaxed italic border-l border-zinc-800/50 pl-4">
                    Credits never expire and are shared across your workspace. Use them for AI Agents, SMS, and other platform features. Note: Credits cannot be used to offset recurring subscription costs.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  className="px-6 bg-white text-black hover:bg-zinc-200 border-transparent text-[11px] h-9 font-medium rounded-lg shadow-xl shadow-white/5 transition-all active:scale-[0.98]"
                  onClick={() => setPulseTopUpOpen(true)}
                >
                  <PlusIcon className="w-3.5 h-3.5 mr-2" />
                  Refill Balance
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-[#111113] border border-zinc-800/60 rounded-xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/10">
              <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <ClockIcon className="w-3.5 h-3.5 text-zinc-600" />
                Recent Activity
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800/40">
                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Reference</th>
                    <th className="px-6 py-3 text-right text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/20">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 5).map((tx) => (
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
                        <td className="px-6 py-4 text-[13px] text-zinc-600 font-light truncate max-w-[150px]">
                          {tx.reference_id || '-'}
                        </td>
                        <td className={clsx(
                          "px-6 py-4 text-right text-[13px] font-mono",
                          tx.amount_pulse_cents > 0 ? "text-emerald-400" : "text-zinc-300"
                        )}>
                          {tx.amount_pulse_cents > 0 ? '+' : ''}${Math.abs(tx.amount_pulse_cents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 text-xs font-light italic">
                        No recent activity recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <h3 className="text-base font-light text-zinc-300 mb-6">Available Configurations</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan.id === plan.id;
          return (
            <div
              key={plan.id}
              className={clsx(
                "group relative p-6 rounded-xl border transition-all duration-300 flex flex-col",
                isCurrent
                  ? "bg-gradient-to-b from-zinc-900/50 to-black border-indigo-500/30"
                  : "bg-[#111113] border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/30"
              )}
            >
              {plan.popular && <div className="absolute top-0 right-0 bg-indigo-600/90 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl text-white tracking-widest">RECOMMENDED</div>}

              <div className="mb-6">
                <div className="text-zinc-200 font-normal text-base">{plan.name}</div>
                <div className="text-zinc-500 text-sm h-10 mt-1 font-light">{plan.description}</div>
              </div>

              <div className="mb-8 font-mono">
                <div className="text-2xl text-zinc-200 font-light">{plan.priceDisplay}<span className="text-sm text-zinc-600 font-sans ml-1">/mo</span></div>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {plan.features.slice(0, 6).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:bg-indigo-400 transition-colors opacity-70" />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors font-light">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={clsx(
                  "w-full border shadow-sm transition-all text-xs h-9 font-normal",
                  isCurrent
                    ? "bg-zinc-900/50 text-zinc-500 border-zinc-800 cursor-default"
                    : "bg-white text-black hover:bg-zinc-200 border-transparent"
                )}
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Enterprise Full Width Section */}
      <div className="relative p-8 rounded-xl border border-zinc-800/60 bg-[#111113] overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <ShieldCheckIcon className="w-48 h-48 text-zinc-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-normal text-white">Enterprise</h3>
              <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-[10px] uppercase tracking-wider px-2 font-normal">Custom Solutions</Badge>
            </div>
            <p className="text-zinc-500 text-sm font-light max-w-xl mb-4">
              For large-scale deployments requiring dedicated support, custom contracts, and unlimited volume.
              Get tailored SLA guarantees and on-premise deployment options.
            </p>
            <div className="flex gap-4">
              {enterprisePlan.features.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 font-light">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-500/70" />
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-auto min-w-[200px]">
            <Button
              onClick={() => handleSelectPlan('enterprise')}
              className="w-full bg-white text-black hover:bg-zinc-200 border-transparent text-xs h-9 font-normal shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>


      <BillingSetupDialog
        open={billingSetupOpen}
        onClose={() => setBillingSetupOpen(false)}
        onSuccess={() => {
          setBillingSetupOpen(false);
          refetch();
        }}
        planId={selectedPlan}
      />

      <PulseTopUpDialog
        open={pulseTopUpOpen}
        onClose={() => setPulseTopUpOpen(false)}
      />
    </div>
  );
}
