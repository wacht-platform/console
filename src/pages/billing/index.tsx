import { useState, useEffect } from "react";
import {
  useBillingAccount,
  useCustomerPortal,
  useCancelSubscription,
  useChangePlan,
  useUsageMetrics,
} from "@/lib/api/hooks/use-billing";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import {
  CheckIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BoltIcon,
  UserGroupIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { InlineLoader } from "@/components/ui/loading-screen";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Heading, Subheading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    priceDisplay: "Free",
    description: "Perfect for testing and small projects",
    monthlyActiveUsers: 5000,
    projects: 5,
    organizations: "Unlimited",
    features: [
      "All authentication methods",
      "Social login providers",
      "Magic links & OTP",
      "JWT & Session management",
      "Multi-factor authentication",
      "Organizations & RBAC",
      "Custom branding",
      "Webhooks & Real-time events",
      "7 days audit logs",
      "Community support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    priceDisplay: "$99",
    description: "Scale with confidence",
    popular: true,
    monthlyActiveUsers: 50000,
    projects: "Unlimited",
    organizations: 500,
    workspaces: 5000,
    features: [
      "Everything in Starter",
      "Advanced analytics dashboard",
      "Higher API rate limits",
      "Email support",
      "Advanced reporting",
      "Priority updates",
      "Custom integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    priceDisplay: "Custom",
    description: "For large-scale deployments",
    monthlyActiveUsers: "Custom",
    projects: "Unlimited",
    organizations: "Unlimited",
    workspaces: "Unlimited",
    features: [
      "Everything in Growth",
      "Volume discounts",
      "SSO & IP allowlisting",
      "Dedicated support",
      "Unlimited audit logs",
      "Custom API limits",
      "SLA guarantee",
      "Dedicated account manager",
    ],
  },
];

const usageBasedPricing = [
  {
    item: "Additional MAU",
    price: "$0.003",
    unit: "per user/month",
    icon: UserGroupIcon,
  },
  {
    item: "Extra Organizations",
    price: "$0.75-$1",
    unit: "per org/month",
    icon: FolderIcon,
  },
  {
    item: "Extra Workspaces",
    price: "$0.15-$0.25",
    unit: "per workspace/month",
    icon: FolderIcon,
  },
  {
    item: "AI Agent Workflows",
    price: "$1.50-$2",
    unit: "per workflow/month",
    icon: BoltIcon,
  },
  {
    item: "OTP Messages",
    price: "$0.004-$0.08",
    unit: "per message",
    icon: SparklesIcon,
  },
  {
    item: "Email Sending",
    price: "$1.80",
    unit: "per 1,000 emails",
    icon: SparklesIcon,
  },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingSetupOpen, setBillingSetupOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: billingAccount, isLoading, refetch } = useBillingAccount();
  const { data: usageData } = useUsageMetrics();
  const customerPortal = useCustomerPortal();
  const cancelSubscription = useCancelSubscription();
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
        "mailto:sales@wacht.dev?subject=Enterprise Plan Inquiry",
        "_blank",
      );
      return;
    }
    if (planId === "starter") {
      setSelectedPlan("starter_plan");
    } else if (planId === "growth") {
      setSelectedPlan("growth_plan");
    }
    setBillingSetupOpen(true);
  };

  const handleOpenPortal = async () => {
    try {
      const result = await customerPortal.mutateAsync();
      window.open(result.portal_url, "_blank");
    } catch (error) {
      console.error("Failed to open portal:", error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync();
      setCancelDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
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
      ? plans.find((p) =>
        subscription.chargebee_subscription_id?.includes(p.id),
      ) || plans[0]
      : plans[0];

  const hasActiveSubscription = subscription?.status === "active";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Heading>Billing & Plans</Heading>
        <Subheading>Manage your subscription and view usage</Subheading>
      </div>

      {/* Current Plan Card */}
      {hasActiveSubscription ? (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-normal text-zinc-900 dark:text-zinc-100">
                  {currentPlan.name} Plan
                </h3>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  Active
                </Badge>
              </div>
              <Text className="mb-4">{currentPlan.description}</Text>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    Monthly Cost
                  </div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {currentPlan.priceDisplay}
                    {currentPlan.price ? (
                      <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">
                        /mo
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    MAU Included
                  </div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {typeof currentPlan.monthlyActiveUsers === "number"
                      ? currentPlan.monthlyActiveUsers.toLocaleString()
                      : currentPlan.monthlyActiveUsers}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    Projects
                  </div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {currentPlan.projects}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              onClick={handleOpenPortal}
              disabled={customerPortal.isPending}
            >
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenPortal}
              disabled={customerPortal.isPending}
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              View Invoices
            </Button>
            <Button variant="ghost" onClick={() => setCancelDialogOpen(true)}>
              Cancel Subscription
            </Button>
          </div>

          {/* Payment status warnings */}
          {billingAccount?.status === "failed" && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <Text className="text-sm text-red-800 dark:text-red-200">
                Payment failed. Please update your payment method to restore
                service.
              </Text>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="text-center">
            <h3 className="text-lg font-normal text-zinc-900 dark:text-zinc-100 mb-2">
              You're on the Free Starter Plan
            </h3>
            <Text className="mb-4">
              Upgrade to unlock more features and higher limits
            </Text>
            <Button onClick={() => handleSelectPlan("growth")}>
              Upgrade to Growth
            </Button>
          </div>
        </div>
      )}

      <Divider className="my-10" />

      {/* Current Usage Metrics */}
      {hasActiveSubscription && usageData && usageData.snapshots.length > 0 && (
        <>
          <div className="mb-10">
            <div className="mb-6">
              <h3 className="text-xl font-normal text-zinc-900 dark:text-zinc-100 mb-2">
                Current Usage
              </h3>
              <Text>Your usage for {usageData.billing_period}</Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {usageData.snapshots.map((snapshot) => {
                // Format metric name for display
                const metricLabels: Record<string, string> = {
                  mau: "Monthly Active Users",
                  mao: "Monthly Active Orgs",
                  maw: "Monthly Active Workspaces",
                  emails: "Emails Sent",
                  webhooks: "Webhook Calls",
                  sms: "SMS Messages",
                  ai_tokens_input: "AI Input Tokens",
                  ai_tokens_output: "AI Output Tokens",
                  projects: "Projects",
                };

                const label =
                  metricLabels[snapshot.metric_name] || snapshot.metric_name;

                return (
                  <div
                    key={snapshot.metric_name}
                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  >
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                      {label}
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {snapshot.quantity.toLocaleString()}
                    </div>
                    {snapshot.cost_cents && snapshot.cost_cents > 0 && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        ${(snapshot.cost_cents / 100).toFixed(2)} cost
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Divider className="my-10" />
        </>
      )}

      {/* Plans Comparison */}
      <div className="mb-10">
        <div className="mb-6">
          <h3 className="text-xl font-normal text-zinc-900 dark:text-zinc-100 mb-2">
            Choose Your Plan
          </h3>
          <Text>Select the plan that best fits your needs</Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all ${plan.popular
                  ? "border-blue-500 dark:border-blue-600 shadow-lg scale-105"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  } ${isCurrentPlan ? "bg-blue-50 dark:bg-blue-950/20" : "bg-white dark:bg-zinc-900"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      <SparklesIcon className="h-3 w-3 mr-1 inline" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-lg font-normal text-zinc-900 dark:text-zinc-100 mb-2">
                    {plan.name}
                  </h4>
                  <Text className="text-sm mb-4">{plan.description}</Text>

                  <div className="mb-4">
                    <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {plan.priceDisplay}
                      {plan.price ? (
                        <span className="text-base font-normal text-zinc-600 dark:text-zinc-400">
                          /month
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isCurrentPlan ? (
                    <Badge className="w-full justify-center py-2">
                      Current Plan
                    </Badge>
                  ) : hasActiveSubscription ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (plan.id === "enterprise") {
                          window.open(
                            "mailto:sales@wacht.dev?subject=Enterprise Plan Inquiry",
                            "_blank",
                          );
                        } else {
                          const planId =
                            plan.id === "starter"
                              ? "starter_plan"
                              : "growth_plan";
                          if (window.confirm(`Change to ${plan.name} plan?`)) {
                            handleChangePlan(planId);
                          }
                        }
                      }}
                    >
                      {plan.id === "enterprise"
                        ? "Contact Sales"
                        : (plan.price ?? 0) < (currentPlan.price ?? 0)
                          ? "Downgrade"
                          : "Upgrade"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.id === "enterprise"
                        ? "Contact Sales"
                        : "Get Started"}
                    </Button>
                  )}
                </div>

                <Divider className="my-4" />

                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                    Key Features
                  </div>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <Text className="text-sm">{feature}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Divider className="my-10" />

      {/* Usage-based Pricing */}
      <div className="mb-10">
        <div className="mb-6">
          <h3 className="text-xl font-normal text-zinc-900 dark:text-zinc-100 mb-2">
            Usage-Based Pricing
          </h3>
          <Text>Pay only for what you use beyond your plan limits</Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usageBasedPricing.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.item}
                className="flex items-start gap-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-1">
                    {item.item}
                  </div>
                  <div className="text-lg font-normal text-zinc-900 dark:text-zinc-100">
                    {item.price}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Setup Dialog */}
      <BillingSetupDialog
        open={billingSetupOpen}
        onClose={() => setBillingSetupOpen(false)}
        onSuccess={() => {
          setBillingSetupOpen(false);
          refetch();
        }}
        planId={selectedPlan}
      />

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(val) => !val && setCancelDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to
              have access until the end of your current billing period, then you'll
              be downgraded to the free Starter plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? (
                <Spinner size="sm" />
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
