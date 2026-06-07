import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/fieldset";
import { Pill, type PillTone } from "@/components/ui/pill";
import { Tag } from "@/components/ui/tag";
import {
    useCreateCheckout,
    CreateCheckoutRequest,
    useBillingAccount,
} from "@/lib/api/hooks/use-billing";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "@posthog/react";
import { CheckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/app-spinner";
import { cn } from "@/lib/utils";
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
        price: "Free",
        mau: "10,000 MAU",
        orgs: "500 MAO",
        workspaces: "2,000 MAW",
    },
    {
        id: "pro",
        name: "Pro",
        price: "$25",
        mau: "50,000 MAU",
        orgs: "2,500 MAO",
        workspaces: "10,000 MAW",
        popular: true,
    },
    {
        id: "growth",
        name: "Growth",
        price: "$99",
        mau: "200,000 MAU",
        orgs: "10,000 MAO",
        workspaces: "40,000 MAW",
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
    const { data: billingAccount, refetch: refetchBilling } =
        useBillingAccount();
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
    const checkoutFlowTone: PillTone =
        checkoutFlowState === "active"
            ? "ok"
            : checkoutFlowState === "failed"
              ? "err"
              : "warn";
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
                const checkoutWindow = window.open(
                    response.checkout_url,
                    "_blank",
                );
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
            <DialogContent
                data-tour-id="billing-setup-form"
                className="sm:max-w-4xl w-[95vw] gap-0 overflow-hidden p-0"
                onPointerDownOutside={(e) => {
                    if (
                        (e.target as HTMLElement | null)?.closest(
                            "[data-tour-overlay]",
                        )
                    ) {
                        e.preventDefault();
                    }
                }}
                onInteractOutside={(e) => {
                    if (
                        (e.target as HTMLElement | null)?.closest(
                            "[data-tour-overlay]",
                        )
                    ) {
                        e.preventDefault();
                    }
                }}
            >
                <AnimatePresence mode="wait">
                    {isPolling ? (
                        <motion.div
                            key="polling"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex min-h-[420px] flex-col items-center justify-center p-12 text-center"
                        >
                            <Spinner size="xl" className="text-primary" />
                            <h3 className="mt-6 text-base font-medium tracking-tight text-foreground">
                                Completing checkout
                            </h3>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                                {checkoutWindowClosed
                                    ? "The checkout window was closed — we're still double-checking your payment status."
                                    : "Complete your secure payment in the new window. Your workspace upgrades automatically the moment it's finished."}
                            </p>

                            {checkoutWindowClosed && (
                                <Button
                                    onClick={() => {
                                        setCheckoutWindowClosed(false);
                                        setIsPolling(false);
                                        sessionStorage.removeItem(
                                            "initiatedCheckout",
                                        );
                                    }}
                                    variant="outline"
                                    className="mt-6"
                                >
                                    Try again
                                </Button>
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
                            <div className="flex flex-col border-b border-border bg-secondary/40 p-6 lg:border-b-0 lg:border-r lg:p-8">
                                <div className="mb-5">
                                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
                                        Choose your plan
                                    </p>
                                    <h2 className="mt-1.5 text-[17px] font-medium tracking-[-0.01em] text-foreground">
                                        Pick a plan that scales with you
                                    </h2>
                                </div>

                                <div className="space-y-2.5">
                                    {plans.map((plan) => {
                                        const selected =
                                            selectedPlanId === plan.id;
                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() =>
                                                    handlePlanSelect(plan.id)
                                                }
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                                                    selected
                                                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15"
                                                        : "border-border bg-card hover:border-muted-foreground/30",
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                                                        selected
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-muted-foreground/40",
                                                    )}
                                                >
                                                    {selected && (
                                                        <CheckIcon
                                                            className="size-2.5"
                                                            strokeWidth={3}
                                                        />
                                                    )}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-foreground">
                                                                {plan.name}
                                                            </span>
                                                            {plan.popular && (
                                                                <Tag>
                                                                    Popular
                                                                </Tag>
                                                            )}
                                                        </div>
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className="font-mono text-sm font-medium text-foreground">
                                                                {plan.price}
                                                            </span>
                                                            {plan.price !==
                                                                "Free" && (
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    /mo
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                                        <span>{plan.mau}</span>
                                                        <span className="text-muted-foreground/40">
                                                            ·
                                                        </span>
                                                        <span>{plan.orgs}</span>
                                                        <span className="text-muted-foreground/40">
                                                            ·
                                                        </span>
                                                        <span>
                                                            {plan.workspaces}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-auto pt-6">
                                    <div className="rounded-lg border border-border bg-card px-3.5 py-3">
                                        <p className="text-xs font-medium text-foreground">
                                            Flexible, usage-based billing
                                        </p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                            Usage is tracked hourly — you only pay
                                            for unique active entities within each
                                            billing cycle. Additional metrics are
                                            charged separately.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Information Form */}
                            <div className="flex flex-col p-6 lg:p-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
                                            Billing identity
                                        </p>
                                        <h3 className="mt-1.5 text-[17px] font-medium tracking-[-0.01em] text-foreground">
                                            Who are we invoicing?
                                        </h3>
                                    </div>

                                    {((checkoutFlowState &&
                                        checkoutFlowState !== "idle") ||
                                        billingAccount?.status ===
                                            "pending") && (
                                        <div className="rounded-lg border border-border bg-secondary/50 px-3.5 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
                                                    Checkout progress
                                                </span>
                                                <Pill tone={checkoutFlowTone}>
                                                    {checkoutFlowLabel}
                                                </Pill>
                                            </div>
                                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                                {checkoutFlowMessage ||
                                                    "Waiting for billing webhooks to settle."}
                                                {billingAccount?.last_checkout_session_created_at
                                                    ? ` • ${format(parseISO(billingAccount.last_checkout_session_created_at), "MMM d, yyyy • HH:mm")}`
                                                    : ""}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div
                                            className="space-y-1.5"
                                            data-tour-id="billing-legal-name"
                                        >
                                            <Label className="text-xs font-medium text-foreground">
                                                Entity name
                                            </Label>
                                            <Input
                                                required
                                                value={formData.legal_name}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "legal_name",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Your legal or company name"
                                            />
                                        </div>

                                        <div
                                            className="space-y-1.5"
                                            data-tour-id="billing-work-email"
                                        >
                                            <Label className="text-xs font-medium text-foreground">
                                                Work email
                                            </Label>
                                            <Input
                                                type="email"
                                                required
                                                value={formData.billing_email}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "billing_email",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="billing@company.com"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-foreground">
                                                Tax ID{" "}
                                                <span className="font-normal text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </Label>
                                            <Input
                                                value={formData.tax_id}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "tax_id",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="GSTIN, VAT, or EIN"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col items-center gap-2 pt-6">
                                    <Button
                                        data-tour-id="billing-submit-button"
                                        onClick={handleSubmit}
                                        disabled={
                                            !isFormValid ||
                                            createCheckout.isPending
                                        }
                                        className="w-full"
                                    >
                                        {createCheckout.isPending ? (
                                            <>
                                                <Spinner size="sm" />
                                                {isStarterSelected
                                                    ? "Activating Starter…"
                                                    : "Preparing session…"}
                                            </>
                                        ) : (
                                            <>
                                                {isStarterSelected
                                                    ? "Activate Starter plan"
                                                    : "Continue to checkout"}
                                                {!isStarterSelected && (
                                                    <ArrowRightIcon className="size-4" />
                                                )}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        I'll do this later
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
