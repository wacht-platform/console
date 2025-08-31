import React, { useState, useMemo } from "react";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Field, Label } from "@/components/ui/fieldset";
import { Select } from "@/components/ui/select";
import { useCreateCheckout, CreateCheckoutRequest } from "@/lib/api/hooks/use-billing";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { Country, State } from "country-state-city";

interface BillingSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planId?: string;
}

export function BillingSetupDialog({ 
  open, 
  onClose, 
  onSuccess,
  planId = "starter_monthly" // Default to starter
}: BillingSetupDialogProps) {
  const [step, setStep] = useState<'info' | 'address' | 'checkout'>('info');
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
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
    country: "US", // Default to US
  });

  const createCheckout = useCreateCheckout();

  // Memoize country/state data to avoid recalculating on every render
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
      // Clear state when country changes
      if (field === "country") {
        newData.state = "";
      }
      return newData;
    });
  };

  const handleNext = () => {
    if (step === 'info') {
      setStep('address');
    }
  };

  const handleBack = () => {
    if (step === 'address') {
      setStep('info');
    } else if (step === 'checkout') {
      setStep('address');
      setCheckoutUrl(''); // Clear the checkout URL
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await createCheckout.mutateAsync(formData);
      
      // Append redirect_url to the checkout URL but NOT cancel_url
      // This way "Back to site" button won't appear
      const url = new URL(response.checkout_url);
      url.searchParams.set('redirect_url', `${window.location.origin}/billing/success`);
      // Don't set cancel_url - this prevents the "Back to site" button from appearing
      
      // Show checkout in iframe with modified URL
      setCheckoutUrl(url.toString());
      setStep('checkout');
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
  };

  // Listen for messages from Chargebee iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if it's from Chargebee
      if (event.origin.includes('chargebee') || event.origin.includes('chargebeecloud')) {
        // Handle checkout success
        if (event.data?.status === 'success' || event.data?.checkout_success) {
          onSuccess?.();
          onClose();
        }
        // Handle back/cancel - just close the iframe view
        else if (event.data?.status === 'cancelled' || event.data?.action === 'close') {
          setStep('address');
          setCheckoutUrl('');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onClose]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setStep('info');
      setCheckoutUrl('');
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

  const isInfoComplete = formData.legal_name && formData.billing_email;
  const isAddressComplete = formData.address_line1 && formData.city && formData.postal_code && formData.country;

  return (
    <Dialog size={step === 'checkout' ? '4xl' : 'lg'} open={open} onClose={onClose}>
      {step === 'checkout' ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                Complete Payment Setup
              </h2>
            </div>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Complete your payment setup to activate billing for your account.
            </Text>
          </div>
          
          <div className="w-full h-[600px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <iframe
              src={checkoutUrl}
              className="w-full h-full"
              frameBorder="0"
              allowTransparency={true}
              title="Chargebee Checkout"
            />
          </div>
          
          <div className="text-center">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Having trouble? <button onClick={handleBack} className="text-blue-600 hover:underline">Go back</button> to try again.
            </Text>
          </div>
        </div>
      ) : (
        <form onSubmit={step === 'address' ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {step === 'address' && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                )}
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                  {step === 'info' ? 'Set up billing account' : 'Billing Address'}
                </h2>
              </div>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                {step === 'info' 
                  ? 'Enter your billing information to create an account.' 
                  : 'Provide your billing address for tax and invoicing purposes.'
                }
              </Text>
            </div>

          {step === 'info' ? (
            <div className="grid grid-cols-1 gap-4">
              <Field>
                <Label>Select Plan *</Label>
                <Select
                  value={formData.plan_id}
                  onChange={(e) => handleInputChange("plan_id", e.target.value)}
                  required
                >
                  <option value="starter_monthly">Starter - Free</option>
                  <option value="growth_monthly">Growth - $99/month</option>
                </Select>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {formData.plan_id === "starter_monthly" 
                    ? "5,000 MAU • 5 Projects • Unlimited Organizations"
                    : "50,000 MAU • Unlimited Projects • 500 Organizations"
                  }
                </Text>
              </Field>

              <Field>
                <Label>Legal Name *</Label>
                <Input
                  type="text"
                  required
                  value={formData.legal_name}
                  onChange={(e) => handleInputChange("legal_name", e.target.value)}
                  placeholder="John Doe or Acme Corp"
                />
              </Field>

              <Field>
                <Label>Billing Email *</Label>
                <Input
                  type="email"
                  required
                  value={formData.billing_email}
                  onChange={(e) => handleInputChange("billing_email", e.target.value)}
                  placeholder="billing@example.com"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Tax ID / VAT Number</Label>
                  <Input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => handleInputChange("tax_id", e.target.value)}
                    placeholder="Tax ID or VAT number"
                  />
                </Field>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Field>
                <Label>Address Line 1 *</Label>
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
                  placeholder="Suite 100"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <Label>City *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="San Francisco"
                  />
                </Field>

                <Field>
                  <Label>Postal Code *</Label>
                  <Input
                    type="text"
                    required
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    placeholder="94105"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <Label>State / Region</Label>
                  {states.length > 0 ? (
                    <Select
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                    >
                      <option value="">Select state...</option>
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
                      placeholder="State, Province, or Region"
                    />
                  )}
                </Field>

                <Field>
                  <Label>Country *</Label>
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
          )}
          </div>

          <DialogActions>
            <Button type="button" outline onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={step === 'info' ? !isInfoComplete : (!isAddressComplete || createCheckout.isPending)}
            >
              {step === 'info' 
                ? 'Continue' 
                : createCheckout.isPending 
                  ? "Setting up..." 
                  : "Add Payment Method"
              }
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}