import { useState, useEffect } from "react";
import {
  useBillingAccount,
  useCustomerPortal,
  useChangePlan,
  useInvoices,
} from "@/lib/api/hooks/use-billing";
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { usePostHog } from "@posthog/react";
import { CreditCardIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pill } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
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
import { format, parseISO } from "date-fns";
import { plans, enterprisePlan } from "./plans";

export default function BillingSubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingSetupOpen, setBillingSetupOpen] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<{
    planId: string;
    previousPlanId: string;
    previousPlanName: string;
    isLocalStarterUpgrade: boolean;
  } | null>(null);
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
    const isLocalStarterSubscription =
      billingAccount?.subscription?.provider_subscription_id?.startsWith(
        "local_starter_",
      );

    if (hasActiveSubscription) {
      const currentPlan =
        plans.find((p) => p.id === billingAccount.subscription?.plan_name) ||
        (billingAccount.subscription?.plan_name === "enterprise"
          ? enterprisePlan
          : plans[0]);

      // Don't allow selecting the current plan if already subscribed
      if (planId === currentPlan.id) return;

      setPendingSwitch({
        planId,
        previousPlanId: currentPlan.id,
        previousPlanName: currentPlan.name,
        isLocalStarterUpgrade:
          !!isLocalStarterSubscription && planId !== "starter",
      });
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
      const response = await changePlan.mutateAsync(planId);
      if (response?.checkout_url) {
        sessionStorage.setItem("billing_checkout_initiated", "true");
        const checkoutWindow = window.open(response.checkout_url, "_blank");
        if (!checkoutWindow) {
          window.location.href = response.checkout_url;
        }
        return;
      }
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

  const confirmSwitch = () => {
    if (!pendingSwitch) return;
    posthog?.capture("billing_plan_selected", {
      plan_id: pendingSwitch.planId,
      plan_name: plans.find((p) => p.id === pendingSwitch.planId)?.name,
      previous_plan_id: pendingSwitch.previousPlanId,
      previous_plan_name: pendingSwitch.previousPlanName,
      has_active_subscription: true,
      ...(pendingSwitch.isLocalStarterUpgrade
        ? { local_starter_upgrade: true }
        : {}),
    });
    handleChangePlan(pendingSwitch.planId);
    setPendingSwitch(null);
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  const subscription = billingAccount?.subscription;
  const currentPlan =
    subscription?.status === "active"
      ? plans.find((p) => p.id === subscription.plan_name) ||
        (subscription.plan_name === "enterprise" ? enterprisePlan : plans[0])
      : plans[0];

  const invoices = invoicesData?.items || [];

  const isSubscriptionInactive =
    !subscription || subscription.status !== "active";

  const renderPlanCard = (
    plan: (typeof plans)[number],
    isCurrent: boolean,
  ) => (
    <div
      key={plan.id}
      className={cn(
        "relative flex flex-col rounded-lg border bg-card p-5 transition-colors",
        isCurrent
          ? "border-primary/40 ring-1 ring-primary/15"
          : "border-border hover:border-muted-foreground/30",
      )}
    >
      {plan.popular ? (
        <Tag className="absolute right-3 top-3">Recommended</Tag>
      ) : null}
      <p className="text-sm font-medium text-foreground">{plan.name}</p>
      <p className="mt-1 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
        {plan.description}
      </p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-medium text-foreground">
          {typeof plan.price === "number"
            ? formatCurrency(plan.price)
            : plan.priceDisplay}
        </span>
        {typeof plan.price === "number" ? (
          <span className="text-xs text-muted-foreground">/mo</span>
        ) : null}
      </div>
      <ul className="mb-6 mt-5 flex-1 space-y-2.5">
        {plan.features.slice(0, 6).map((feature, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-[13px] leading-snug text-muted-foreground"
          >
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      {isCurrent ? (
        <Button variant="outline" className="w-full" disabled>
          Current plan
        </Button>
      ) : (
        <Button
          className="w-full"
          disabled={changePlan.isPending}
          onClick={() => handleSelectPlan(plan.id)}
        >
          {changePlan.isPending ? "Switching…" : "Select plan"}
        </Button>
      )}
    </div>
  );

  const renderEnterprise = () => (
    <div className="mt-6 rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-medium text-foreground">
              Enterprise
            </h3>
            <Tag>Custom</Tag>
          </div>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            For large-scale deployments requiring dedicated support, custom
            contracts, and unlimited volume. Tailored SLA guarantees and
            on-premise deployment options.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {enterprisePlan.features.slice(0, 3).map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <CheckIcon className="h-3.5 w-3.5 text-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full md:w-auto md:min-w-[180px]"
          onClick={() => handleSelectPlan("enterprise")}
        >
          Contact sales
        </Button>
      </div>
    </div>
  );

  const plansSection = (
    <div id="plans-section" className="space-y-3">
      <SectionLabel>Plans &amp; pricing</SectionLabel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) =>
          renderPlanCard(plan, !isSubscriptionInactive && currentPlan.id === plan.id),
        )}
      </div>
      {renderEnterprise()}
    </div>
  );

  const targetPlan = pendingSwitch
    ? plans.find((p) => p.id === pendingSwitch.planId)
    : undefined;

  const switchPlanDialog = (
    <Dialog
      open={!!pendingSwitch}
      onOpenChange={(open) => {
        if (!open) setPendingSwitch(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch plan</DialogTitle>
          <DialogDescription>
            Confirm the change to your subscription.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3.5 py-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
                Current
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {pendingSwitch?.previousPlanName}
              </p>
            </div>
            <span className="shrink-0 text-muted-foreground">→</span>
            <div className="min-w-0 text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
                New
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {targetPlan?.name}
                {targetPlan && typeof targetPlan.price === "number" ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    {formatCurrency(targetPlan.price)}/mo
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Changes apply immediately and are prorated for the remainder of your
            current billing cycle.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setPendingSwitch(null)}
            disabled={changePlan.isPending}
          >
            Cancel
          </Button>
          <Button onClick={confirmSwitch} disabled={changePlan.isPending}>
            {changePlan.isPending ? "Switching…" : "Confirm switch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isSubscriptionInactive) {
    return (
      <div className="space-y-8">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          Subscription
        </h1>

        <div className="rounded-lg border border-border bg-card p-10">
          <div className="mx-auto max-w-xl text-center">
            <div className="flex justify-center">
              <Pill tone="mute">no active subscription</Pill>
            </div>
            <h2 className="mt-4 text-xl font-medium text-foreground">
              Choose a plan to get started
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Select a plan below to unlock the full power of Wacht's CIAM
              platform. All plans include core authentication features with
              flexible scaling options.
            </p>
            <Button
              className="mt-6"
              onClick={() =>
                document
                  .getElementById("plans-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View plans &amp; pricing
            </Button>
          </div>
        </div>

        {plansSection}

        <BillingSetupDialog
          open={billingSetupOpen}
          onClose={() => setBillingSetupOpen(false)}
          onSuccess={() => {
            setBillingSetupOpen(false);
            refetch();
          }}
          planId={selectedPlan}
        />

        {switchPlanDialog}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        Subscription
      </h1>

      {/* Plan identity card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-medium text-foreground">
                {currentPlan.name} plan
              </h2>
              {subscription?.status === "active" ? (
                <Pill tone="ok">active</Pill>
              ) : null}
            </div>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {currentPlan.description}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={handleOpenPortal}
              disabled={customerPortal.isPending}
            >
              <CreditCardIcon className="h-3.5 w-3.5" />
              {customerPortal.isPending
                ? "Opening portal…"
                : "Manage payment method"}
            </Button>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Base price</p>
            <p className="mt-0.5 font-mono text-2xl font-medium text-foreground">
              {typeof currentPlan.price === "number"
                ? formatCurrency(currentPlan.price)
                : currentPlan.priceDisplay}
              {typeof currentPlan.price === "number" ? (
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <section className="space-y-3">
        <SectionLabel
          action={
            <Button
              variant="ghost"
              size="sm"
              className="ml-3 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleOpenPortal}
              disabled={customerPortal.isPending}
            >
              Full history &amp; portal
            </Button>
          }
        >
          Payment history
        </SectionLabel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoicesLoading ? (
              <TableEmptyRow colSpan={4} title="Loading payment history…" />
            ) : invoices.length > 0 ? (
              invoices.map((inv: any) => (
                <TableRow key={inv.payment_id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {inv.created_at
                      ? format(parseISO(inv.created_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-secondary-foreground">
                    Subscription payment
                  </TableCell>
                  <TableCell>
                    <Pill tone={inv.status === "paid" ? "ok" : "mute"}>
                      {inv.status}
                    </Pill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-mono text-xs text-foreground">
                        {(inv.amount_paid_cents / 100).toFixed(2)}{" "}
                        {inv.currency.toUpperCase()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
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
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmptyRow
                colSpan={4}
                title="No payments yet"
                description="Invoices appear here once your subscription bills."
              />
            )}
          </TableBody>
        </Table>
      </section>

      {plansSection}

      <BillingSetupDialog
        open={billingSetupOpen}
        onClose={() => setBillingSetupOpen(false)}
        onSuccess={() => {
          setBillingSetupOpen(false);
          refetch();
        }}
        planId={selectedPlan}
      />

      {switchPlanDialog}
    </div>
  );
}
