import { useState } from "react";
import {
  useSubscription,
  useCreateCheckout,
  useCustomerPortal,
  useCancelSubscription,
} from "@/lib/api/hooks/use-billing";
import { 
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/fieldset";
import { Heading, Subheading } from "@/components/ui/heading";
import { Stat } from "@/components/stat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    priceDisplay: "Free",
    description: "Perfect for small projects and testing",
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
      "API Keys & Rate limiting",
      "Webhooks",
      "Real-time events",
      "7 days audit logs",
      "Community support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    priceDisplay: "$99",
    description: "Scale your application with confidence",
    popular: true,
    monthlyActiveUsers: 50000,
    projects: "Unlimited",
    organizations: 500,
    workspaces: 5000,
    features: [
      "Everything in Starter, plus:",
      "Analytics dashboard",
      "Higher API rate limits (500/min)",
      "Email support",
      "5,000 workspaces",
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
    description: "Tailored solutions for large organizations",
    monthlyActiveUsers: "Custom",
    projects: "Unlimited",
    organizations: "Unlimited",
    workspaces: "Unlimited",
    features: [
      "Everything in Growth, plus:",
      "Volume discounts",
      "SSO & IP allowlisting",
      "Dedicated support",
      "Unlimited audit logs",
      "Custom API limits (10k/min)",
      "SLA guarantee",
      "Custom contracts",
      "Dedicated account manager",
    ],
  },
];

const usageBasedPricing = [
  { item: "Additional Users", price: "$0.003", unit: "per user/month" },
  { item: "Extra Organizations", price: "$0.75-$1", unit: "per org/month" },
  { item: "Extra Workspaces", price: "$0.15-$0.25", unit: "per workspace/month" },
  { item: "AI Agent Workflows", price: "$1.50-$2", unit: "per workflow/month" },
  { item: "OTP Messages", price: "$0.004-$0.08", unit: "per message" },
  { item: "Email Sending", price: "$1.80", unit: "per 1,000 emails" },
  { item: "Knowledge Storage", price: "$0.08-$0.10", unit: "per GB/month" },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const { data: subscription, isLoading } = useSubscription();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const cancelSubscription = useCancelSubscription();

  const handleSelectPlan = (planId: string) => {
    if (planId === "enterprise") {
      window.open("mailto:sales@wacht.dev?subject=Enterprise Plan Inquiry", "_blank");
      return;
    }
    if (planId === "starter") {
      // Starter is free, no checkout needed
      return;
    }
    setSelectedPlan(planId);
    setCheckoutDialogOpen(true);
  };

  const handleCreateCheckout = async () => {
    if (!email || !selectedPlan) return;

    try {
      const result = await createCheckout.mutateAsync({
        plan_id: selectedPlan,
        email,
        name,
      });
      
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error("Failed to create checkout:", error);
    }
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
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentPlan = subscription?.status === "active" 
    ? plans.find(p => p.id === subscription.chargebee_subscription_id?.split('_')[0]) || plans[0]
    : plans[0];

  // Calculate stats for the current subscription
  const stats = [
    {
      title: "Current Plan",
      value: currentPlan.name,
      change: subscription?.status === "active" ? "Active" : "Free Tier",
    },
    {
      title: "Monthly Active Users",
      value: typeof currentPlan.monthlyActiveUsers === 'number' 
        ? currentPlan.monthlyActiveUsers.toLocaleString()
        : currentPlan.monthlyActiveUsers,
      change: "Limit",
    },
    {
      title: "Projects",
      value: currentPlan.projects.toString(),
      change: currentPlan.projects === "Unlimited" ? "" : "Available",
    },
    {
      title: "Monthly Cost",
      value: currentPlan.priceDisplay,
      change: currentPlan.price ? "/month" : "",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <Heading>Billing & Subscription</Heading>
        <Subheading>Manage your subscription plan and billing settings</Subheading>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Subscription Overview
            </h3>
            <div className="flex gap-2">
              <Button
                outline
                onClick={handleOpenPortal}
                disabled={customerPortal.isPending}
              >
                {customerPortal.isPending ? <Spinner size="sm" /> : "Billing Portal"}
              </Button>
              {subscription.status === "active" && (
                <Button
                  plain
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Stat key={stat.title} {...stat} />
            ))}
          </div>
        </div>
      )}

      <Divider className="my-8" />

      {/* Available Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Available Plans
            </h3>
            <Text className="mt-1">Choose the plan that fits your needs</Text>
          </div>
        </div>

        <Table className="[--gutter:--spacing(8)]">
          <TableHead>
            <TableRow>
              <TableHeader>Plan</TableHeader>
              <TableHeader>Monthly Active Users</TableHeader>
              <TableHeader>Projects</TableHeader>
              <TableHeader>Organizations</TableHeader>
              <TableHeader>Price</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {plan.name}
                        {plan.popular && (
                          <Badge className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <Text className="text-xs">{plan.description}</Text>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Text>
                    {typeof plan.monthlyActiveUsers === 'number' 
                      ? plan.monthlyActiveUsers.toLocaleString()
                      : plan.monthlyActiveUsers}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text>{plan.projects}</Text>
                </TableCell>
                <TableCell>
                  <Text>{plan.organizations}</Text>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {plan.priceDisplay}
                    {plan.price && <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">/mo</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {currentPlan.id === plan.id ? (
                    <Badge>Current</Badge>
                  ) : (
                    <Button
                      plain
                      onClick={() => handleSelectPlan(plan.id)}
                      className="text-sm"
                    >
                      {plan.id === "enterprise" ? "Contact Sales" : 
                       plan.id === "starter" ? "Downgrade" : "Upgrade"}
                      <ArrowRightIcon className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Divider className="my-8" />

      {/* Plan Features Comparison */}
      <div className="mb-8">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Features Comparison
          </h3>
          <Text className="mt-1">All plans include these core features</Text>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="space-y-4">
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  {plan.name}
                  {plan.popular && <SparklesIcon className="h-4 w-4 text-yellow-500" />}
                </h4>
              </div>
              <ul className="space-y-2">
                {plan.features.slice(0, 8).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <Text className="text-sm">{feature}</Text>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Divider className="my-8" />

      {/* Usage-based Pricing */}
      <div>
        <div className="mb-6">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Pay As You Grow
          </h3>
          <Text className="mt-1">Additional usage beyond your plan limits</Text>
        </div>

        <Table className="[--gutter:--spacing(6)]">
          <TableHead>
            <TableRow>
              <TableHeader>Service</TableHeader>
              <TableHeader>Price</TableHeader>
              <TableHeader>Billing Unit</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {usageBasedPricing.map((item) => (
              <TableRow key={item.item}>
                <TableCell className="font-medium">{item.item}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400">
                  {item.unit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onClose={() => setCheckoutDialogOpen(false)}>
        <DialogTitle>Upgrade to {plans.find(p => p.id === selectedPlan)?.name}</DialogTitle>
        <DialogDescription>
          Enter your billing details to complete the upgrade
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="billing@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            plain
            onClick={() => setCheckoutDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCheckout}
            disabled={!email || createCheckout.isPending}
          >
            {createCheckout.isPending ? <Spinner size="sm" /> : "Continue to Checkout"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogDescription>
          Your subscription will remain active until the end of the current billing period.
          After that, you'll be downgraded to the free Starter plan.
        </DialogDescription>
        <DialogActions>
          <Button
            plain
            onClick={() => setCancelDialogOpen(false)}
          >
            Keep Subscription
          </Button>
          <Button
            onClick={handleCancelSubscription}
            disabled={cancelSubscription.isPending}
          >
            {cancelSubscription.isPending ? <Spinner size="sm" /> : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}