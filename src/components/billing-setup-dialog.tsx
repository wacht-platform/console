import React, { useState, useMemo } from "react";
import { Dialog, DialogActions, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Field, Label } from "@/components/ui/fieldset";
import { Select } from "@/components/ui/select";
import { useCreateCheckout, CreateCheckoutRequest } from "@/lib/api/hooks/use-billing";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import { Country, State } from "country-state-city";
import clsx from "clsx";

interface BillingSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planId?: string;
}

const plans = [
  {
    id: "starter_monthly",
    name: "Starter",
    price: "$0",
    mau: "500 MAU",
    projects: "1 Project",
    orgs: "No organizations",
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: "$25",
    mau: "10K MAU",
    projects: "10 Projects",
    orgs: "500 Organizations",
  },
  {
    id: "growth_monthly",
    name: "Growth",
    price: "$99",
    mau: "100K MAU",
    projects: "Unlimited Projects",
    orgs: "3K Organizations",
  },
];

export function BillingSetupDialog({
  open,
  onClose,
  onSuccess,
  planId = "starter_monthly"
}: BillingSetupDialogProps) {
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId);
  const [formData, setFormData] = useState<CreateCheckoutRequest>({
    plan_id: planId,
    legal_name: "",
    billing_email: "",
    billing_phone: "",
    tax_id: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const createCheckout = useCreateCheckout();

  const countries = useMemo(() => {
    try {
      return Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [
        { isoCode: "US", name: "United States" },
        { isoCode: "CA", name: "Canada" },
        { isoCode: "GB", name: "United Kingdom" },
      ];
    }
  }, []);

  const states = useMemo(() => {
    if (!formData.country) return [];
    try {
      return State.getStatesOfCountry(formData.country) || [];
    } catch {
      return [];
    }
  }, [formData.country]);

  const handleInputChange = (field: keyof CreateCheckoutRequest, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === "country") {
        newData.state = "";
      }
      return newData;
    });
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setFormData(prev => ({ ...prev, plan_id: planId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createCheckout.mutateAsync(formData);
      const url = new URL(response.checkout_url);
      url.searchParams.set('redirect_url', `${window.location.origin}/billing/success`);
      setCheckoutUrl(url.toString());
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes('chargebee') || event.origin.includes('chargebeecloud')) {
        if (event.data?.status === 'success' || event.data?.checkout_success) {
          onSuccess?.();
          onClose();
        } else if (event.data?.status === 'cancelled' || event.data?.action === 'close') {
          setCheckoutUrl('');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onClose]);

  React.useEffect(() => {
    if (!open) {
      setCheckoutUrl('');
      setSelectedPlanId(planId);
      setFormData({
        plan_id: planId,
        legal_name: "",
        billing_email: "",
        billing_phone: "",
        tax_id: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "US",
      });
    }
  }, [open, planId]);

  const isFormValid = formData.legal_name && formData.billing_email && formData.address_line1
    && formData.city && formData.postal_code && formData.country;

  return (
    <Dialog open={open} onClose={onClose} size={checkoutUrl ? '5xl' : '3xl'}>
      {checkoutUrl ? (
        <div className="relative">
          <button
            onClick={() => setCheckoutUrl('')}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="w-full h-[700px]">
            <iframe
              src={checkoutUrl}
              className="w-full h-full"
              frameBorder="0"
              title="Complete Payment"
            />
          </div>
        </div>
      ) : (
        <>
          <DialogTitle>Set Up Billing</DialogTitle>
          <DialogBody className="max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Selection */}
              <div>
                <Text className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">Choose Your Plan</Text>
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
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
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
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">/mo</span>
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

              {/* Billing Information */}
              <div>
                <Text className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">Billing Information</Text>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <Label>Legal Name</Label>
                      <Input
                        type="text"
                        required
                        value={formData.legal_name}
                        onChange={(e) => handleInputChange("legal_name", e.target.value)}
                        placeholder="John Doe or Acme Corp"
                      />
                    </Field>

                    <Field>
                      <Label>Billing Email</Label>
                      <Input
                        type="email"
                        required
                        value={formData.billing_email}
                        onChange={(e) => handleInputChange("billing_email", e.target.value)}
                        placeholder="billing@example.com"
                      />
                    </Field>

                    <Field>
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={formData.billing_phone}
                        onChange={(e) => handleInputChange("billing_phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </Field>

                    <Field>
                      <Label>Tax ID / VAT</Label>
                      <Input
                        type="text"
                        value={formData.tax_id}
                        onChange={(e) => handleInputChange("tax_id", e.target.value)}
                        placeholder="Optional"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <Text className="text-sm text-zinc-900 dark:text-zinc-100 mb-3">Billing Address</Text>
                <div className="space-y-3">
                  <Field>
                    <Label>Address Line 1</Label>
                    <Input
                      type="text"
                      required
                      value={formData.address_line1}
                      onChange={(e) => handleInputChange("address_line1", e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </Field>

                  <Field>
                    <Label>Address Line 2</Label>
                    <Input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) => handleInputChange("address_line2", e.target.value)}
                      placeholder="Suite 100 (optional)"
                    />
                  </Field>

                  <div className="grid grid-cols-3 gap-3">
                    <Field>
                      <Label>City</Label>
                      <Input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="San Francisco"
                      />
                    </Field>

                    <Field>
                      <Label>State / Region</Label>
                      {states.length > 0 ? (
                        <Select
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {states.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type="text"
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          placeholder="Optional"
                        />
                      )}
                    </Field>

                    <Field>
                      <Label>Postal Code</Label>
                      <Input
                        type="text"
                        required
                        value={formData.postal_code}
                        onChange={(e) => handleInputChange("postal_code", e.target.value)}
                        placeholder="94105"
                      />
                    </Field>
                  </div>

                  <Field>
                    <Label>Country</Label>
                    <Select
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      required
                    >
                      {countries.map((country) => (
                        <option key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
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
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
