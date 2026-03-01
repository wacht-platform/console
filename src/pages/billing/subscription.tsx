import { useState, useEffect } from "react";
import {
    useBillingAccount,
    useCustomerPortal,
    useChangePlan,
    useInvoices,
} from "@/lib/api/hooks/use-billing";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { usePostHog } from "@posthog/react";
import {
    RocketLaunchIcon,
    CreditCardIcon,
    DocumentTextIcon,
    CheckIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineLoader } from "@/components/ui/loading-screen";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { plans, enterprisePlan } from "./plans";

const InvoiceRow = ({ inv }: { inv: any }) => {
    return (
        <tr className="group hover:bg-zinc-100 dark:hover:bg-zinc-900/10 transition-colors">
            <td className="px-6 py-4 text-[12px] text-zinc-500 dark:text-zinc-500 font-light">
                {inv.created_at
                    ? format(parseISO(inv.created_at), "MMM d, yyyy")
                    : "-"}
            </td>
            <td className="px-6 py-4">
                <div className="text-[12px] text-zinc-700 dark:text-zinc-300 font-light">
                    Subscription Payment
                </div>
            </td>
            <td className="px-6 py-4">
                <Badge
                    variant="outline"
                    className={clsx(
                        "text-[8px] px-2 py-0.5 font-medium uppercase tracking-widest rounded-full",
                        inv.status === "paid"
                            ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/10 bg-emerald-50 dark:bg-emerald-500/[0.02]"
                            : "text-zinc-500 dark:text-zinc-500 border-zinc-300 dark:border-zinc-800",
                    )}
                >
                    {inv.status}
                </Badge>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-4">
                    <span className="text-[12px] text-zinc-700 dark:text-zinc-300 font-mono">
                        {(inv.amount_paid_cents / 100).toFixed(2)}{" "}
                        {inv.currency.toUpperCase()}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs py-0 px-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-normal"
                        onClick={() => {
                            if (inv.invoice_pdf_url) {
                                window.open(inv.invoice_pdf_url, "_blank");
                            }
                        }}
                        disabled={!inv.invoice_pdf_url}
                    >
                        PDF
                    </Button>
                </div>
            </td>
        </tr>
    );
};

export default function BillingSubscriptionPage() {
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [billingSetupOpen, setBillingSetupOpen] = useState(false);
    const posthog = usePostHog();

    const { data: billingAccount, isLoading, refetch } = useBillingAccount();
    const billingCurrency = (billingAccount?.currency || "USD").toUpperCase();
    const formatCurrency = (amount: number, currency = billingCurrency) =>
        new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

    // Only fetch invoices if there's an active subscription
    const hasActiveSubscription =
        billingAccount?.subscription?.status === "active";
    const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
        enabled: hasActiveSubscription,
    });
    const customerPortal = useCustomerPortal();
    const changePlan = useChangePlan();

    useEffect(() => {
        const checkoutInitiated = sessionStorage.getItem(
            "billing_checkout_initiated",
        );
        if (checkoutInitiated) {
            sessionStorage.removeItem("billing_checkout_initiated");
            refetch();
        }
    }, [refetch]);

    const handleSelectPlan = (planId: string) => {
        if (planId === "enterprise") {
            window.open(
                "mailto:support@wacht.dev?subject=Enterprise Plan Inquiry",
                "_blank",
            );
            return;
        }

        const hasActiveSubscription =
            billingAccount?.subscription?.status === "active";

        if (hasActiveSubscription) {
            const currentPlan =
                plans.find((p) => p.id === billingAccount.subscription?.plan_name) ||
                (billingAccount.subscription?.plan_name === "enterprise"
                    ? enterprisePlan
                    : plans[0]);

            // Don't allow selecting the current plan if already subscribed
            if (planId === currentPlan.id) return;

            // Confirm plan change
            if (
                confirm(
                    `Switch to ${plans.find((p) => p.id === planId)?.name}?`,
                )
            ) {
                posthog?.capture("billing_plan_selected", {
                    plan_id: planId,
                    plan_name: plans.find((p) => p.id === planId)?.name,
                    previous_plan_id: currentPlan.id,
                    previous_plan_name: currentPlan.name,
                    has_active_subscription: true,
                });
                handleChangePlan(planId);
            }
        } else {
            // No active subscription - open billing setup
            posthog?.capture("billing_plan_selected", {
                plan_id: planId,
                plan_name: plans.find((p) => p.id === planId)?.name,
                has_active_subscription: false,
            });
            setSelectedPlan(planId);
            setBillingSetupOpen(true);
        }
    };

    const handleOpenPortal = async () => {
        try {
            const result = await customerPortal.mutateAsync();
            if (result?.portal_url) {
                posthog?.capture("billing_portal_opened");
                window.open(result.portal_url, "_blank");
            }
        } catch (error) {
            console.error("Failed to open portal:", error);
            posthog?.captureException(error);
        }
    };

    const handleChangePlan = async (planId: string) => {
        try {
            await changePlan.mutateAsync(planId);
            posthog?.capture("billing_plan_changed", {
                plan_id: planId,
                plan_name: plans.find((p) => p.id === planId)?.name,
            });
            refetch();
        } catch (error) {
            console.error("Failed to change plan:", error);
            posthog?.captureException(error);
        }
    };

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

    const invoices = invoicesData?.items || [];

    // Check if subscription is cancelled or inactive
    const isSubscriptionInactive =
        !subscription || subscription.status !== "active";

    // If subscription is cancelled, show simplified state
    if (isSubscriptionInactive) {
        return (
            <div className="space-y-12 animate-in fade-in duration-500">
                <h1 className="text-xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100">
                    Subscription
                </h1>

                {/* Cancelled State Card */}
                <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-12 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] dark:opacity-[0.02] pointer-events-none">
                        <RocketLaunchIcon className="w-48 h-48 text-zinc-400 dark:text-zinc-500" />
                    </div>

                    <div className="relative z-10 text-center max-w-2xl mx-auto">
                        <div className="mb-6">
                            <Badge
                                variant="outline"
                                className="bg-zinc-100 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-500 border-zinc-300 dark:border-zinc-800 text-xs px-3 py-1 font-normal uppercase tracking-wider"
                            >
                                No Active Subscription
                            </Badge>
                        </div>

                        <h2 className="text-2xl font-light text-zinc-900 dark:text-white mb-4">
                            Choose a Plan to Get Started
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-500 text-sm font-light leading-relaxed mb-8">
                            Select a plan below to unlock the full power of
                            Wacht's CIAM platform. All plans include core
                            authentication features with flexible scaling
                            options.
                        </p>

                        <Button
                            size="lg"
                            className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent text-sm h-11 font-medium px-8"
                            onClick={() => {
                                const element =
                                    document.getElementById("plans-section");
                                element?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            View Plans & Pricing
                        </Button>
                    </div>
                </div>

                {/* Available Plans */}
                <div id="plans-section">
                    <h3 className="text-sm font-normal text-zinc-600 dark:text-zinc-400 mb-6 flex items-center gap-2">
                        <RocketLaunchIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        Plans & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className="group relative p-6 rounded-xl border transition-all duration-300 flex flex-col bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 shadow-sm dark:shadow-none"
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-indigo-600/90 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl text-white tracking-widest text-[9px]">
                                        RECOMMENDED
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="text-zinc-900 dark:text-zinc-200 font-normal text-base">
                                        {plan.name}
                                    </div>
                                    <div className="text-zinc-500 dark:text-zinc-500 text-sm h-10 mt-1 font-light">
                                        {plan.description}
                                    </div>
                                </div>

                                <div className="mb-8 font-mono">
                                    <div className="text-2xl text-zinc-900 dark:text-zinc-200 font-light">
                                        {typeof plan.price === "number"
                                            ? formatCurrency(plan.price)
                                            : plan.priceDisplay}
                                        {typeof plan.price === "number" && (
                                            <span className="text-sm text-zinc-500 dark:text-zinc-600 font-sans ml-1">
                                                /mo
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 flex-1">
                                    {plan.features
                                        .slice(0, 6)
                                        .map((feature, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:bg-indigo-400 transition-colors opacity-70" />
                                                <span className="text-[13px] text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors font-light leading-snug">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                <Button
                                    className="w-full border shadow-sm transition-all text-xs h-9 font-normal bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent"
                                    onClick={() => handleSelectPlan(plan.id)}
                                >
                                    Select Plan
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Enterprise Card */}
                    <div className="mt-8 relative p-8 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#111113] overflow-hidden group shadow-sm dark:shadow-none">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.03] group-hover:opacity-[0.05] dark:group-hover:opacity-[0.05] transition-opacity">
                            <ShieldCheckIcon className="w-48 h-48 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-normal text-zinc-900 dark:text-white">
                                        Enterprise
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="text-zinc-500 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700 text-xs uppercase tracking-wider px-2 font-normal"
                                    >
                                        Custom Solutions
                                    </Badge>
                                </div>
                                <p className="text-zinc-500 dark:text-zinc-500 text-sm font-light max-w-xl mb-4 leading-relaxed">
                                    For large-scale deployments requiring
                                    dedicated support, custom contracts, and
                                    unlimited volume. Get tailored SLA
                                    guarantees and on-premise deployment
                                    options.
                                </p>
                                <div className="flex gap-6">
                                    {enterprisePlan.features
                                        .slice(0, 3)
                                        .map((f, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-light"
                                            >
                                                <CheckIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-500/70" />
                                                {f}
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div className="w-full md:w-auto min-w-[200px]">
                                <Button
                                    onClick={() =>
                                        handleSelectPlan("enterprise")
                                    }
                                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent text-xs h-9 font-normal"
                                >
                                    Contact Sales
                                </Button>
                            </div>
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
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <h1 className="text-xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100">
                Subscription
            </h1>
            {/* Plan Identity Card */}
            <div className="bg-white -mt-8 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800/60 rounded-xl p-6 relative overflow-hidden shadow-sm dark:shadow-none">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.03] pointer-events-none">
                    <RocketLaunchIcon className="w-32 h-32 text-zinc-400 dark:text-zinc-500" />
                </div>

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-normal text-zinc-900 dark:text-white">
                                {currentPlan.name} Plan
                            </h2>
                            {subscription?.status === "active" && (
                                <Badge
                                    variant="outline"
                                    className="bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20 text-xs px-2 font-normal flex items-center gap-1"
                                >
                                    <CheckIcon className="w-3 h-3" />
                                    Active
                                </Badge>
                            )}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-500 text-sm max-w-sm font-light">
                            {currentPlan.description}
                        </p>

                        <div className="mt-8 flex gap-3">
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs h-9 font-normal gap-2"
                                onClick={handleOpenPortal}
                                disabled={customerPortal.isPending}
                            >
                                <CreditCardIcon className="w-3.5 h-3.5" />
                                {customerPortal.isPending
                                    ? "Opening Portal..."
                                    : "Manage Payment Method"}
                            </Button>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-zinc-500 dark:text-zinc-500 mb-1 font-light">
                            Base Price
                        </div>
                        <div className="text-2xl font-light text-zinc-900 dark:text-zinc-200">
                            {typeof currentPlan.price === "number"
                                ? formatCurrency(currentPlan.price)
                                : currentPlan.priceDisplay}
                            {typeof currentPlan.price === "number" && (
                                <span className="text-sm text-zinc-500 dark:text-zinc-600 font-light ml-0.5">
                                    /mo
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-normal text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
                        Payment History
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-normal uppercase tracking-wider"
                        onClick={handleOpenPortal}
                        disabled={customerPortal.isPending}
                    >
                        Full History & Portal
                    </Button>
                </div>

                <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800/60 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-900/10">
                                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-[9px] font-medium text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-[9px] font-medium text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/20">
                                {invoicesLoading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-600 text-xs font-light italic"
                                        >
                                            Loading payment history...
                                        </td>
                                    </tr>
                                ) : invoices.length > 0 ? (
                                    invoices.map((inv: any) => (
                                        <InvoiceRow
                                            key={inv.payment_id}
                                            inv={inv}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-600 text-xs font-light italic"
                                        >
                                            No payments found yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Available Plans */}
            <div>
                <h3 className="text-sm font-normal text-zinc-600 dark:text-zinc-400 mb-6 flex items-center gap-2">
                    <RocketLaunchIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    Plans & Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const isCurrent = currentPlan.id === plan.id;
                        return (
                            <div
                                key={plan.id}
                                className={clsx(
                                    "group relative p-6 rounded-xl border transition-all duration-300 flex flex-col shadow-sm dark:shadow-none",
                                    isCurrent
                                        ? "bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900/50 dark:to-black border-indigo-300 dark:border-indigo-500/30"
                                        : "bg-white dark:bg-[#111113] border-zinc-200 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30",
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-indigo-600/90 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl text-white tracking-widest text-[9px]">
                                        RECOMMENDED
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className="text-zinc-900 dark:text-zinc-200 font-normal text-base">
                                        {plan.name}
                                    </div>
                                    <div className="text-zinc-500 dark:text-zinc-500 text-sm h-10 mt-1 font-light">
                                        {plan.description}
                                    </div>
                                </div>

                                <div className="mb-8 font-mono">
                                    <div className="text-2xl text-zinc-900 dark:text-zinc-200 font-light">
                                        {typeof plan.price === "number"
                                            ? formatCurrency(plan.price)
                                            : plan.priceDisplay}
                                        {typeof plan.price === "number" && (
                                            <span className="text-sm text-zinc-500 dark:text-zinc-600 font-sans ml-1">
                                                /mo
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8 flex-1">
                                    {plan.features
                                        .slice(0, 6)
                                        .map((feature, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:bg-indigo-400 transition-colors opacity-70" />
                                                <span className="text-[13px] text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors font-light leading-snug">
                                                    {feature}
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                <Button
                                    className={clsx(
                                        "w-full border shadow-sm transition-all text-xs h-9 font-normal",
                                        isCurrent
                                            ? "bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-500 border-zinc-300 dark:border-zinc-800 cursor-default"
                                            : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent",
                                    )}
                                    disabled={isCurrent || changePlan.isPending}
                                    onClick={() => handleSelectPlan(plan.id)}
                                >
                                    {isCurrent
                                        ? "Current Plan"
                                        : changePlan.isPending
                                          ? "Switching..."
                                          : "Select Plan"}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Enterprise Card */}
                <div className="mt-8 relative p-8 rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#111113] overflow-hidden group shadow-sm dark:shadow-none">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.03] group-hover:opacity-[0.05] dark:group-hover:opacity-[0.05] transition-opacity">
                        <ShieldCheckIcon className="w-48 h-48 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-normal text-zinc-900 dark:text-white">
                                    Enterprise
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="text-zinc-500 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700 text-xs uppercase tracking-wider px-2 font-normal"
                                >
                                    Custom Solutions
                                </Badge>
                            </div>
                            <p className="text-zinc-500 dark:text-zinc-500 text-sm font-light max-w-xl mb-4 leading-relaxed">
                                For large-scale deployments requiring dedicated
                                support, custom contracts, and unlimited volume.
                                Get tailored SLA guarantees and on-premise
                                deployment options.
                            </p>
                            <div className="flex gap-6">
                                {enterprisePlan.features
                                    .slice(0, 3)
                                    .map((f, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-light"
                                        >
                                            <CheckIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-500/70" />
                                            {f}
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className="w-full md:w-auto min-w-[200px]">
                            <Button
                                onClick={() => handleSelectPlan("enterprise")}
                                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border-transparent text-xs h-9 font-normal"
                            >
                                Contact Sales
                            </Button>
                        </div>
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
        </div>
    );
}
