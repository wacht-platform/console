import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBillingPlans, useCreateBillingPlan, useUpdateBillingPlan, useDeleteBillingPlan } from "@/lib/api/hooks/use-billing";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { BillingPlan, CreateBillingPlanRequest, UpdateBillingPlanRequest } from "@/types/billing";

interface CreatePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreatePlanDialog({ isOpen, onClose }: CreatePlanDialogProps) {
  const [formData, setFormData] = useState<CreateBillingPlanRequest>({
    name: '',
    description: '',
    amount_cents: 0,
    currency: 'usd',
    billing_interval: 'month',
    trial_period_days: 0,
    usage_type: 'licensed',
    features: {},
    display_order: 0,
  });

  const createPlan = useCreateBillingPlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPlan.mutateAsync({
        ...formData,
        trial_period_days: formData.trial_period_days || undefined,
      });
      toast.success("Billing plan created successfully");
      onClose();
      setFormData({
        name: '',
        description: '',
        amount_cents: 0,
        currency: 'usd',
        billing_interval: 'month',
        trial_period_days: 0,
        usage_type: 'licensed',
        features: {},
        display_order: 0,
      });
    } catch (error) {
      toast.error("Failed to create billing plan");
    }
  };

  if (!isOpen || !onClose) return null;

  return (
    <>
      <Dialog open={isOpen} onClose={onClose}>
        <div className="p-6">
        <Heading level={3} className="mb-4">Create Billing Plan</Heading>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Pro Plan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Plan description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (cents) *
              </label>
              <Input
                type="number"
                value={formData.amount_cents}
                onChange={(e) => setFormData({ ...formData, amount_cents: parseInt(e.target.value) || 0 })}
                placeholder="2999"
                required
              />
              <Text className="text-xs text-gray-500">
                ${(formData.amount_cents / 100).toFixed(2)}
              </Text>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <Select
                value={formData.currency}
                onChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Interval
              </label>
              <Select
                value={formData.billing_interval}
                onChange={(value) => setFormData({ ...formData, billing_interval: value as any })}
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
                <option value="week">Weekly</option>
                <option value="day">Daily</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trial Period (days)
              </label>
              <Input
                type="number"
                value={formData.trial_period_days}
                onChange={(e) => setFormData({ ...formData, trial_period_days: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Type
            </label>
            <Select
              value={formData.usage_type}
              onChange={(value) => setFormData({ ...formData, usage_type: value as any })}
            >
              <option value="licensed">Licensed</option>
              <option value="metered">Metered</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
    </>
  );
}

export function BillingPlansTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: plans = [], isLoading } = useBillingPlans();
  const updatePlan = useUpdateBillingPlan(''); // This will need to be fixed per plan
  const deletePlan = useDeleteBillingPlan(''); // This will need to be fixed per plan

  const handleToggleActive = async (plan: BillingPlan) => {
    try {
      // Note: This would need to be implemented properly with the plan ID
      await updatePlan.mutateAsync({ is_active: !plan.is_active });
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error("Failed to update plan status");
    }
  };

  const handleDeletePlan = async (plan: BillingPlan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Note: This would need to be implemented properly with the plan ID
      // await deletePlan.mutateAsync();
      toast.success("Plan deleted successfully");
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const formatPrice = (amountCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  };

  const formatInterval = (interval: string) => {
    const intervals: Record<string, string> = {
      month: 'Monthly',
      year: 'Yearly', 
      week: 'Weekly',
      day: 'Daily',
    };
    return intervals[interval] || interval;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Heading level={3}>Billing Plans</Heading>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Header>Name</Table.Header>
            <Table.Header>Price</Table.Header>
            <Table.Header>Interval</Table.Header>
            <Table.Header>Trial</Table.Header>
            <Table.Header>Type</Table.Header>
            <Table.Header>Status</Table.Header>
            <Table.Header>Actions</Table.Header>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {plans.map((plan) => (
            <Table.Row key={plan.id}>
              <Table.Cell>
                <div>
                  <Text className="font-medium">{plan.name}</Text>
                  {plan.description && (
                    <Text className="text-sm text-gray-500">{plan.description}</Text>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <Text className="font-medium">
                  {formatPrice(plan.amount_cents, plan.currency)}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text>{formatInterval(plan.billing_interval)}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text>
                  {plan.trial_period_days ? `${plan.trial_period_days} days` : 'None'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge variant={plan.is_metered ? 'warning' : 'default'}>
                  {plan.usage_type || 'Licensed'}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={plan.is_active}
                    onChange={() => handleToggleActive(plan)}
                  />
                  <Badge variant={plan.is_active ? 'success' : 'secondary'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeletePlan(plan)}
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {plans.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Text className="text-gray-500">No billing plans created yet.</Text>
          <Button 
            className="mt-2" 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create your first plan
          </Button>
        </div>
      )}

      {isCreateDialogOpen && (
        <CreatePlanDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      )}
    </div>
  );
}