import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  StripeConnectSetup,
  BillingOverviewCards,
  BillingPlansTable,
  SubscriptionsTable,
} from "@/components/billing";
import { useStripeAccount, useBillingDashboard } from "@/lib/api/hooks/use-billing";
import { 
  ExclamationTriangleIcon,
  CreditCardIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { EmptyState } from "@/components/ui/empty-state";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showStripeSetup, setShowStripeSetup] = useState(false);
  const { data: stripeAccount, isLoading: isLoadingAccount, error: accountError } = useStripeAccount();
  const { data: dashboard, isLoading: isLoadingDashboard } = useBillingDashboard();

  console.log('BillingPage render:', { isLoadingAccount, stripeAccount, accountError });

  if (isLoadingAccount) {
    return <LoadingScreen />;
  }

  // If no Stripe account is connected, show setup page
  if (!stripeAccount) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg text-gray-900">Billing & Subscriptions</h1>
            <p className="text-sm text-gray-500">
              Manage your billing plans, subscriptions, and payment processing
            </p>
          </div>
        </div>

        {showStripeSetup ? (
          <div className="mt-6">
            <StripeConnectSetup />
          </div>
        ) : (
          <EmptyState
            title="No Stripe account connected"
            description="Connect your Stripe account to start accepting payments and managing subscriptions"
            icon={<CreditCardIcon className="w-12 h-12" />}
            actionLabel="Connect Stripe"
            onAction={() => setShowStripeSetup(true)}
          />
        )}
      </div>
    );
  }

  // If Stripe account setup is incomplete
  if (!stripeAccount.is_setup_complete) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg text-gray-900">Billing & Subscriptions</h1>
            <p className="text-sm text-gray-500">
              Complete your Stripe account setup to start accepting payments.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800">Setup Incomplete</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your Stripe account requires additional information before you can start processing payments.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <StripeConnectSetup />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: ChartBarIcon,
    },
    {
      id: 'plans',
      label: 'Billing Plans',
      icon: CreditCardIcon,
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: UserGroupIcon,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: DocumentTextIcon,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: ExclamationTriangleIcon,
    },
  ];

  const renderTabContent = () => {
    console.log('Rendering tab:', activeTab);
    
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <BillingOverviewCards />
            
            {dashboard && (
              <>
                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <Heading level={3} className="mb-4">Recent Subscriptions</Heading>
                    {dashboard.active_subscriptions.length > 0 ? (
                      <div className="space-y-3">
                        {dashboard.active_subscriptions.slice(0, 5).map((subscription) => (
                          <div key={subscription.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <Text className="font-medium">
                                {subscription.customer_name || subscription.customer_email}
                              </Text>
                              <Text className="text-sm text-gray-500">
                                {subscription.billing_plan?.name}
                              </Text>
                            </div>
                            <Badge variant={subscription.is_active ? 'success' : 'secondary'}>
                              {subscription.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text className="text-gray-500">No subscriptions yet</Text>
                    )}
                  </Card>

                  <Card className="p-6">
                    <Heading level={3} className="mb-4">Recent Invoices</Heading>
                    {dashboard.recent_invoices.length > 0 ? (
                      <div className="space-y-3">
                        {dashboard.recent_invoices.slice(0, 5).map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <Text className="font-medium">
                                {invoice.invoice_number || `Invoice ${invoice.id}`}
                              </Text>
                              <Text className="text-sm text-gray-500">
                                {new Date(invoice.created_at).toLocaleDateString()}
                              </Text>
                            </div>
                            <div className="text-right">
                              <Text className="font-medium">
                                ${invoice.amount_due.toFixed(2)}
                              </Text>
                              <Badge 
                                variant={
                                  invoice.is_paid ? 'success' : 
                                  invoice.is_overdue ? 'danger' : 'warning'
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text className="text-gray-500">No invoices yet</Text>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        );
      
      case 'plans':
        return <BillingPlansTable />;
      
      case 'subscriptions':
        return <SubscriptionsTable />;
      
      case 'invoices':
        return (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <Heading level={3} className="text-gray-500 mb-2">Invoices Coming Soon</Heading>
            <Text className="text-gray-400">
              Invoice management will be available in a future update.
            </Text>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <Heading level={3}>Stripe Settings</Heading>
            <StripeConnectSetup />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg text-gray-900">Billing & Subscriptions</h1>
          <p className="text-sm text-gray-500">
            Manage your billing plans, subscriptions, and payment processing.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="success">Connected</Badge>
          <span className="text-sm text-gray-500">
            {stripeAccount.stripe_account_id}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab.id} value={tab.id}>
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </Tabs>
    </div>
  );
}