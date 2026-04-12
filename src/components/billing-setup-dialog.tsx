import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text as WachtText } from "@/components/ui/text";
import { Label } from "@/components/ui/fieldset";
import {
  useCreateCheckout,
  CreateCheckoutRequest,
  useBillingAccount,
} from "@/lib/api/hooks/use-billing";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "@posthog/react";
import {
  RocketLaunchIcon,
  SparklesIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Spinner } from "@/components/ui/spinner";
import clsx from "clsx";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface BillingSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planId?: string;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    mau: "500 Users",
    orgs: "0 Organizations",
    icon: RocketLaunchIcon,
    features: [
      "500 Free Users",
      "Trail usage with CIAM suite",
      "1,000 Free emails",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$25",
    mau: "10,000 Users",
    orgs: "500 Organizations",
    webhooks: "100k Webhooks/mo",
    icon: SparklesIcon,
    popular: true,
    features: [
      "10,000 Free Users",
      "500 Organizations",
      "2,500 Workspaces",
      "100k Webhooks/mo",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    mau: "50,000 Users",
    orgs: "3,000 Organizations",
    webhooks: "1 mil Webhooks/mo",
    icon: GlobeAltIcon,
    features: [
      "50,000 Free Users",
      "3,000 Organizations",
      "15,000 Workspaces",
      "1 mil Webhooks/mo",
    ],
  },
];

function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    const parts = [match[1], match[2], match[3]].filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
    return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  }

  return cleaned;
}

export function BillingSetupDialog({
  open,
  onClose,
  onSuccess,
  planId = "starter",
}: BillingSetupDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId);
  const [formData, setFormData] = useState<CreateCheckoutRequest>({
    plan_name: planId,
    legal_name: "",
    billing_email: "",
    billing_phone: "",
    tax_id: "",
    return_url: window.location.href, // This will be the absolute URL to the billing page
  });
  const [isPolling, setIsPolling] = useState(false);
  const [checkoutWindowClosed, setCheckoutWindowClosed] = useState(false);
  const checkoutWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const posthog = usePostHog();
  const createCheckout = useCreateCheckout();
  const { data: billingAccount, refetch: refetchBilling } = useBillingAccount();
  const checkoutFlowState = billingAccount?.checkout_flow_state || "idle";
  const checkoutFlowError = billingAccount?.checkout_flow_error;
  const checkoutFlowLabel = (() => {
    switch (checkoutFlowState) {
      case "checkout_created":
        return "Waiting for payment";
      case "payment_received_waiting_subscription":
        return "Payment received";
      case "subscription_active_waiting_payment":
        return "Subscription active";
      case "active":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Idle";
    }
  })();
  const checkoutFlowMessage = (() => {
    switch (checkoutFlowState) {
      case "checkout_created":
        return "Checkout was created. Waiting for payment confirmation.";
      case "payment_received_waiting_subscription":
        return "Payment confirmed. Waiting for subscription activation webhook.";
      case "subscription_active_waiting_payment":
        return "Subscription activated. Waiting for payment confirmation webhook.";
      case "active":
        return "Payment and subscription are both confirmed.";
      case "failed":
        return checkoutFlowError || "The last billing flow failed.";
      default:
        return null;
    }
  })();
  const isStarterSelected = selectedPlanId === "starter";

  const handleInputChange = (
    field: keyof CreateCheckoutRequest,
    value: string,
  ) => {
    // Format phone number as user types
    if (field === "billing_phone") {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setFormData((prev) => ({ ...prev, plan_name: planId }));
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setCheckoutWindowClosed(false);
    if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
      checkoutWindowRef.current.close();
    }
    checkoutWindowRef.current = null;
  };

  const startPolling = () => {
    setIsPolling(true);
    setCheckoutWindowClosed(false);

    pollingIntervalRef.current = setInterval(async () => {
      const result = await refetchBilling();

      if (result.data?.subscription?.status === "active") {
        stopPolling();
        onSuccess?.();
        onClose();
      }

      // Check if checkout window was closed
      if (checkoutWindowRef.current?.closed) {
        setCheckoutWindowClosed(true);
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      posthog?.capture("billing_checkout_started", {
        plan_id: selectedPlanId,
        plan_name: plans.find((p) => p.id === selectedPlanId)?.name,
      });
      const payload = {
        ...formData,
        plan_name: selectedPlanId,
        return_url: window.location.href,
      };

      if (isStarterSelected) {
        await createCheckout.mutateAsync(payload);
        await refetchBilling();
        toast.success("Starter plan activated");
        onSuccess?.();
        onClose();
        return;
      }

      startPolling();
      const response = await createCheckout.mutateAsync(payload);

      if (response?.requires_checkout === false) {
        stopPolling();
        await refetchBilling();
        onSuccess?.();
        onClose();
        return;
      }

      if (response?.checkout_url) {
        sessionStorage.setItem("billing_checkout_initiated", "true");
        const checkoutWindow = window.open(response.checkout_url, "_blank");
        if (checkoutWindow) {
          checkoutWindowRef.current = checkoutWindow;
        } else {
          window.location.href = response.checkout_url;
        }
      }
    } catch (error) {
      stopPolling();
      console.error("Failed to create checkout session:", error);
      if (axios.isAxiosError(error)) {
        const message =
          (typeof error.response?.data?.message === "string" &&
            error.response?.data?.message) ||
          (typeof error.response?.data?.error === "string" &&
            error.response?.data?.error) ||
          "Failed to create checkout session";
        toast.error(message);
      } else {
        toast.error("Failed to create checkout session");
      }
      posthog?.captureException(error);
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (open) {
      if (billingAccount) {
        setFormData({
          plan_name: selectedPlanId || planId,
          legal_name: billingAccount.legal_name || "",
          billing_email: billingAccount.billing_email || "",
          billing_phone: billingAccount.billing_phone || "",
          tax_id: billingAccount.tax_id || "",
          return_url: window.location.href,
        });
      }
    } else {
      stopPolling();
      setSelectedPlanId(planId);
      setFormData({
        plan_name: planId,
        legal_name: "",
        billing_email: "",
        billing_phone: "",
        tax_id: "",
        return_url: window.location.href,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, billingAccount, planId]);

  const isFormValid = formData.legal_name && formData.billing_email;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden border-none bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
        <AnimatePresence mode="wait">
          {isPolling ? (
            <motion.div
              key="polling"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-12 flex flex-col items-center justify-center min-h-[400px] text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <Spinner size="xl" className="text-blue-500" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <CheckBadgeIcon className="w-10 h-10 text-blue-500/50" />
                  </motion.div>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Checkout in Progress
                </h3>
                <WachtText className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {checkoutWindowClosed
                    ? "It looks like the checkout window was closed. Don't worry, we're still double-checking your payment status."
                    : "Please complete your secure payment in the new window. Your workspace will automatically upgrade the moment it's finished."}
                </WachtText>
              </div>

              {checkoutWindowClosed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10"
                >
                  <Button
                    onClick={() => {
                      setCheckoutWindowClosed(false);
                      setIsPolling(false);
                      sessionStorage.removeItem("initiatedCheckout");
                    }}
                    variant="outline"
                    className="rounded-xl border-zinc-200 dark:border-zinc-800"
                  >
                    Try again
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-2 min-h-0"
            >
              {/* Left Side: Plan Selection */}
              <div className="p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
                <div className="mb-6">
                  <h2 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Upgrade your workspace
                  </h2>
                  <WachtText className="text-zinc-500 dark:text-zinc-400">
                    Choose a plan that scales with your growth.
                  </WachtText>
                </div>

                <div className="space-y-4">
                  {plans.map((plan) => (
                    <motion.button
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={clsx(
                        "w-full text-left p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                        selectedPlanId === plan.id
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500/50"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/40",
                      )}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 flex-shrink-0",
                            selectedPlanId === plan.id
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
                          )}
                        >
                          <plan.icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                                {plan.name}
                              </span>
                              {plan.popular && (
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-[9px] font-medium text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Popular
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1 ml-4 text-sm">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {plan.price}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-normal lowercase">
                                /mo
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span className="flex items-center gap-1">
                              <CheckBadgeIcon className="w-2.5 h-2.5 text-blue-500" />
                              {plan.mau}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckBadgeIcon className="w-2.5 h-2.5 text-blue-500" />
                              {plan.orgs}
                            </span>
                            {(plan as any).webhooks && (
                              <span className="flex items-center gap-1">
                                <CheckBadgeIcon className="w-2.5 h-2.5 text-blue-500" />
                                {(plan as any).webhooks}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20">
                  <div className="flex gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                        Flexible Billing
                      </p>
                      <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
                        Usage is tracked hourly. You'll only pay for unique
                        active entities within each billing cycle. Additional
                        metrics charged separately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Information Form */}
              <div className="p-6 lg:p-10 flex flex-col justify-start">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      Billing Identity
                    </h3>
                    <p className="text-xs text-zinc-500">
                      How should we address your invoices?
                    </p>
                  </div>

                  {((checkoutFlowState && checkoutFlowState !== "idle") ||
                    billingAccount?.status === "pending") && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                          Checkout Progress
                        </span>
                        <span
                          className={clsx(
                            "text-[10px] uppercase tracking-wider",
                            checkoutFlowState === "active"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : checkoutFlowState === "failed"
                                ? "text-red-600 dark:text-red-400"
                                : "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {checkoutFlowLabel}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {checkoutFlowMessage ||
                          "Waiting for billing webhooks to settle."}
                        {billingAccount?.last_checkout_session_created_at
                          ? ` • ${format(parseISO(billingAccount.last_checkout_session_created_at), "MMM d, yyyy • HH:mm")}`
                          : ""}
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider ml-1">
                        Entity Name
                      </Label>
                      <Input
                        required
                        value={formData.legal_name}
                        onChange={(e) =>
                          handleInputChange("legal_name", e.target.value)
                        }
                        placeholder="Your legal or company name"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:ring-blue-500/20 focus:border-blue-500 h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider ml-1">
                        Work Email
                      </Label>
                      <Input
                        type="email"
                        required
                        value={formData.billing_email}
                        onChange={(e) =>
                          handleInputChange("billing_email", e.target.value)
                        }
                        placeholder="billing@company.com"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:ring-blue-500/20 focus:border-blue-500 h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider ml-1">
                        Tax ID (Optional)
                      </Label>
                      <Input
                        value={formData.tax_id}
                        onChange={(e) =>
                          handleInputChange("tax_id", e.target.value)
                        }
                        placeholder="GSTIN, VAT, or EIN"
                        className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 focus:ring-blue-500/20 focus:border-blue-500 h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || createCheckout.isPending}
                    className={clsx(
                      "w-full h-12 rounded-xl text-white font-medium transition-all duration-300 border-none",
                      isFormValid
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400",
                    )}
                  >
                    {createCheckout.isPending ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        <span>
                          {isStarterSelected
                            ? "Activating Starter..."
                            : "Preparing Session..."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>
                          {isStarterSelected
                            ? "Activate Starter Plan"
                            : "Continue to Checkout"}
                        </span>
                        {!isStarterSelected && (
                          <ArrowRightIcon className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </Button>
                  <button
                    onClick={onClose}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-2"
                  >
                    I'll do this later
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
