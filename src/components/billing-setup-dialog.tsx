import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Field, Label, Description } from "@/components/ui/fieldset";
import {
  useCreateCheckout,
  CreateCheckoutRequest,
  useBillingAccount,
} from "@/lib/api/hooks/use-billing";
import { CheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import clsx from "clsx";
import Chargebee from "@chargebee/chargebee-js-types";

interface BillingSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planId?: string;
}

const plans = [
  {
    id: "starter_plan",
    name: "Starter",
    price: "₹0",
    priceUsd: "$0",
    mau: "500 MAU",
    projects: "1 Project",
    orgs: "No organizations",
  },
  {
    id: "pro_plan",
    name: "Pro",
    price: "₹2,200",
    priceUsd: "$25",
    mau: "10K MAU",
    projects: "10 Projects",
    orgs: "500 Organizations",
  },
  {
    id: "growth_plan",
    name: "Growth",
    price: "₹8,700",
    priceUsd: "$99",
    mau: "100K MAU",
    projects: "Unlimited Projects",
    orgs: "3K Organizations",
  },
];

// Phone number formatting helper
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters except +
  const cleaned = value.replace(/[^\d+]/g, "");

  // If starts with +, keep it
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // US/Canada formatting
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
  planId = "starter_plan",
}: BillingSetupDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId);
  const [formData, setFormData] = useState<CreateCheckoutRequest>({
    plan_id: planId,
    legal_name: "",
    billing_email: "",
    billing_phone: "",
    tax_id: "",
  });
  const [isPolling, setIsPolling] = useState(false);
  const [checkoutWindowClosed, setCheckoutWindowClosed] = useState(false);
  const checkoutWindowRef = useRef<Window | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createCheckout = useCreateCheckout();
  const { refetch: refetchBilling } = useBillingAccount();

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
    setFormData((prev) => ({ ...prev, plan_id: planId }));
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
      const cbInstance = (window.Chargebee as Chargebee).init({
        site: "intellinesia",
      });

      startPolling();

      cbInstance.openCheckout({
        hostedPage: async () => {
          const response = await createCheckout.mutateAsync(formData);
          return response;
        },
        success: () => {
          onSuccess?.();
          onClose();
        },
        close: () => { },
      });
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) {
      stopPolling();
      setSelectedPlanId(planId);
      setFormData({
        plan_id: planId,
        legal_name: "",
        billing_email: "",
        billing_phone: "",
        tax_id: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  const isFormValid = formData.legal_name && formData.billing_email;

  return (
    <Dialog open={open} onClose={isPolling ? () => { } : onClose} size="3xl">
      {isPolling ? (
        <div className="p-12">
          <div className="flex flex-col items-center justify-center space-y-8">
            {/* Animated spinner with pulse effect */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-ping opacity-20"></div>
              <div className="absolute w-16 h-16 border-4 border-blue-300 dark:border-blue-800 rounded-full animate-pulse"></div>
              <div className="relative w-12 h-12 border-4 border-t-blue-600 dark:border-t-blue-400 border-blue-200 dark:border-blue-900 rounded-full animate-spin"></div>
            </div>

            <div className="text-center space-y-3 max-w-md">
              <DialogTitle className="text-xl">
                Waiting for Checkout Completion
              </DialogTitle>
              <Text className="text-zinc-600 dark:text-zinc-400">
                {checkoutWindowClosed
                  ? "Checkout window was closed. Checking if payment was completed..."
                  : "Complete your payment in the checkout window to continue."}
              </Text>
            </div>

            {checkoutWindowClosed && (
              <div className="flex gap-3 pt-4">
                <Button outline onClick={stopPolling}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Reopen Checkout</Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <DialogTitle>Set Up Billing</DialogTitle>
          <DialogBody className="max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Selection */}
              <div>
                <Text className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">
                  Choose Your Plan
                </Text>
                <div className="grid grid-cols-3 gap-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanSelect(plan.id)}
                      className={clsx(
                        "relative p-3 rounded-lg border text-left transition-all",
                        selectedPlanId === plan.id
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
                      )}
                    >
                      {selectedPlanId === plan.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                        {plan.name}
                      </div>
                      <div className="text-lg text-zinc-900 dark:text-zinc-100 mb-2">
                        {plan.price}
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          /mo
                        </span>
                      </div>
                      <div className="space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <div>{plan.mau}</div>
                        <div>{plan.projects}</div>
                        <div>{plan.orgs}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <Text className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">
                  Basic Information
                </Text>
                <div className="space-y-4">
                  <Field>
                    <Label>Full Name or Company Name</Label>
                    <Input
                      type="text"
                      required
                      value={formData.legal_name}
                      onChange={(e) =>
                        handleInputChange("legal_name", e.target.value)
                      }
                      placeholder="John Doe or Acme Corp"
                      autoFocus
                    />
                    <Description>This will appear on your invoices</Description>
                  </Field>

                  <Field>
                    <Label>Billing Email</Label>
                    <Input
                      type="email"
                      required
                      value={formData.billing_email}
                      onChange={(e) =>
                        handleInputChange("billing_email", e.target.value)
                      }
                      placeholder="billing@example.com"
                    />
                    <Description>
                      We'll send invoices and receipts to this email
                    </Description>
                  </Field>

                  <Field>
                    <Label>Phone Number (Optional)</Label>
                    <Input
                      type="tel"
                      value={formData.billing_phone}
                      onChange={(e) =>
                        handleInputChange("billing_phone", e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                    <Description>
                      {formData.billing_phone?.startsWith("+")
                        ? "International format detected"
                        : "US/Canada format: (555) 123-4567 or +1 for international"}
                    </Description>
                  </Field>

                  <Field>
                    <Label>Tax ID / VAT (Optional)</Label>
                    <Input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) =>
                        handleInputChange("tax_id", e.target.value)
                      }
                      placeholder="e.g., VAT123456789"
                    />
                  </Field>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <Text className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                    Payment & Address Details
                  </Text>
                  <Text className="text-sm text-blue-800 dark:text-blue-200">
                    You'll enter your billing address and payment information
                    securely on the next screen.
                  </Text>
                </div>
              </div>
            </form>
          </DialogBody>

          <DialogActions>
            <Button plain onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || createCheckout.isPending}
            >
              {createCheckout.isPending ? (
                <>
                  <Spinner size="sm" />
                  Opening Checkout...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
