import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Listbox, ListboxOption } from "@/components/ui/listbox";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { useStripeAccount, useInitiateStripeConnect, useDisconnectStripeAccount } from "@/lib/api/hooks/use-billing";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ExclamationTriangleIcon, CheckCircleIcon, LinkIcon } from "@heroicons/react/24/outline";

export function StripeConnectSetup() {
  const [selectedAccountType, setSelectedAccountType] = useState<'express' | 'standard'>('express');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { data: stripeAccount, isLoading, error } = useStripeAccount();
  const initiateConnect = useInitiateStripeConnect();
  const disconnectAccount = useDisconnectStripeAccount();

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const result = await initiateConnect.mutateAsync({
        account_type: selectedAccountType,
        refresh_url: window.location.href,
        return_url: window.location.href,
      });
      
      // Redirect to Stripe onboarding
      window.location.href = result.onboarding_url;
    } catch (error) {
      toast.error("Failed to initiate Stripe Connect setup");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Stripe account? This will affect all active subscriptions.")) {
      return;
    }

    try {
      await disconnectAccount.mutateAsync();
      toast.success("Stripe account disconnected successfully");
    } catch (error) {
      toast.error("Failed to disconnect Stripe account");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (!stripeAccount) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Connect Stripe Account</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Account Type
          </label>
          <Listbox
            value={selectedAccountType}
            onChange={setSelectedAccountType}
          >
            <ListboxOption value="express">
              <span className="block">Express (Recommended)</span>
            </ListboxOption>
            <ListboxOption value="standard">
              <span className="block">Standard</span>
            </ListboxOption>
          </Listbox>
          <p className="mt-2 text-sm text-gray-500">
            {selectedAccountType === 'express' 
              ? 'Quick setup with Stripe-hosted onboarding. Stripe handles compliance and regulatory requirements.'
              : 'Full control over the onboarding experience. You handle compliance and branding.'
            }
          </p>
        </div>

        <Button 
          onClick={handleConnectStripe}
          disabled={isConnecting}
          data-stripe-connect-button
        >
          {isConnecting ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              Connecting to Stripe...
            </>
          ) : (
            'Connect with Stripe'
          )}
        </Button>
      </div>
    );
  }

  if (stripeAccount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Stripe Account</h3>
            <p className="mt-1 text-sm text-gray-500">{stripeAccount.stripe_account_id}</p>
          </div>
          {stripeAccount.is_setup_complete ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="warning">Setup Required</Badge>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Type</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{stripeAccount.account_type}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Charges Enabled</dt>
            <dd className="mt-1 text-sm text-gray-900">{stripeAccount.charges_enabled ? 'Yes' : 'No'}</dd>
          </div>
          
          {stripeAccount.country && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Country</dt>
              <dd className="mt-1 text-sm text-gray-900">{stripeAccount.country.toUpperCase()}</dd>
            </div>
          )}
          
          {stripeAccount.default_currency && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Currency</dt>
              <dd className="mt-1 text-sm text-gray-900">{stripeAccount.default_currency.toUpperCase()}</dd>
            </div>
          )}
        </dl>

        {!stripeAccount.is_setup_complete && (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Complete your Stripe account setup to start accepting payments.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {stripeAccount.dashboard_url && (
            <Button 
              variant="outline"
              onClick={() => window.open(stripeAccount.dashboard_url, '_blank')}
            >
              View Dashboard
            </Button>
          )}
          
          <Button 
            color="red"
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnectAccount.isPending}
          >
            {disconnectAccount.isPending ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}