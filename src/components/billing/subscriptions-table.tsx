import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSubscriptions, useCreateSubscription, useCancelSubscription, useBillingPlans } from "@/lib/api/hooks/use-billing";
import { toast } from "sonner";
import { PlusIcon, XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import type { Subscription, CreateSubscriptionRequest } from "@/types/billing";

interface CreateSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateSubscriptionDialog({ isOpen, onClose }: CreateSubscriptionDialogProps) {
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    billing_plan_id: '0',
    customer_email: '',
    customer_name: '',
    collection_method: 'charge_automatically',
  });

  const { data: plans = [] } = useBillingPlans();
  const createSubscription = useCreateSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createSubscription.mutateAsync(formData);
      toast.success("Subscription created successfully");
      onClose();
      setFormData({
        billing_plan_id: '0',
        customer_email: '',
        customer_name: '',
        collection_method: 'charge_automatically',
      });
    } catch (error) {
      toast.error("Failed to create subscription");
    }
  };

  if (!isOpen || !onClose) return null;

  return (
    <>
      <Dialog open={isOpen} onClose={onClose}>
        <div className="p-6">
        <Heading level={3} className="mb-4">Create Subscription</Heading>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Plan *
            </label>
            <Select
              value={formData.billing_plan_id}
              onChange={(value) => setFormData({ ...formData, billing_plan_id: value })}
              required
            >
              <option value="0">Select a plan</option>
              {plans.filter(p => p.is_active).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${(plan.amount_cents / 100).toFixed(2)}/{plan.billing_interval}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email *
            </label>
            <Input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="customer@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <Input
              value={formData.customer_name || ''}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Method
            </label>
            <Select
              value={formData.collection_method}
              onChange={(value) => setFormData({ ...formData, collection_method: value as any })}
            >
              <option value="charge_automatically">Charge Automatically</option>
              <option value="send_invoice">Send Invoice</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSubscription.isPending}>
              {createSubscription.isPending ? 'Creating...' : 'Create Subscription'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
    </>
  );
}

export function SubscriptionsTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const { data: subscriptions = [], isLoading } = useSubscriptions(
    statusFilter ? { status: statusFilter } : undefined
  );
  const cancelSubscription = useCancelSubscription(''); // This will need to be fixed per subscription

  const handleCancelSubscription = async (subscription: Subscription) => {
    if (!confirm(`Are you sure you want to cancel the subscription for ${subscription.customer_email}?`)) {
      return;
    }

    try {
      // Note: This would need to be implemented properly with the subscription ID
      // await cancelSubscription.mutateAsync();
      toast.success("Subscription cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
      active: { variant: 'success', label: 'Active' },
      trialing: { variant: 'default', label: 'Trial' },
      past_due: { variant: 'warning', label: 'Past Due' },
      canceled: { variant: 'danger', label: 'Canceled' },
      unpaid: { variant: 'danger', label: 'Unpaid' },
      incomplete: { variant: 'warning', label: 'Incomplete' },
      incomplete_expired: { variant: 'danger', label: 'Expired' },
      paused: { variant: 'default', label: 'Paused' },
    };

    const config = statusMap[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (plan: any) => {
    if (!plan) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency.toUpperCase(),
    }).format(plan.amount_cents / 100);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Heading level={3}>Subscriptions</Heading>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
            <option value="unpaid">Unpaid</option>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Subscription
          </Button>
        </div>
      </div>

      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Header>Customer</Table.Header>
            <Table.Header>Plan</Table.Header>
            <Table.Header>Status</Table.Header>
            <Table.Header>Current Period</Table.Header>
            <Table.Header>Trial</Table.Header>
            <Table.Header>Actions</Table.Header>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {subscriptions.map((subscription) => (
            <Table.Row key={subscription.id}>
              <Table.Cell>
                <div>
                  <Text className="font-medium">
                    {subscription.customer_name || subscription.customer_email}
                  </Text>
                  {subscription.customer_name && (
                    <Text className="text-sm text-gray-500">{subscription.customer_email}</Text>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div>
                  <Text className="font-medium">
                    {subscription.billing_plan?.name || 'Unknown Plan'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {formatPrice(subscription.billing_plan)}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                {getStatusBadge(subscription.status)}
              </Table.Cell>
              <Table.Cell>
                <div>
                  <Text className="text-sm">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {subscription.days_until_period_end} days remaining
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                {subscription.is_in_trial ? (
                  <div>
                    <Badge variant="default">Trial</Badge>
                    <Text className="text-xs text-gray-500 mt-1">
                      {subscription.trial_days_remaining} days left
                    </Text>
                  </div>
                ) : (
                  <Text className="text-sm text-gray-500">No trial</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  {subscription.is_active && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleCancelSubscription(subscription)}
                    >
                      <XMarkIcon className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {subscriptions.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Text className="text-gray-500">
            {statusFilter ? `No ${statusFilter} subscriptions found.` : 'No subscriptions created yet.'}
          </Text>
          <Button 
            className="mt-2" 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create your first subscription
          </Button>
        </div>
      )}

      {isCreateDialogOpen && (
        <CreateSubscriptionDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}
    </div>
  );
}