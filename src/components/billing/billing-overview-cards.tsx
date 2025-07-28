import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingDashboard } from "@/lib/api/hooks/use-billing";
import { 
  CreditCardIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon 
} from "@heroicons/react/24/outline";

export function BillingOverviewCards() {
  const { data: dashboard, isLoading } = useBillingDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const activeSubscriptions = dashboard.active_subscriptions.filter(sub => sub.is_active);
  const totalRevenue = dashboard.recent_invoices
    .filter(invoice => invoice.is_paid)
    .reduce((sum, invoice) => sum + invoice.amount_paid, 0);
  
  const trialSubscriptions = activeSubscriptions.filter(sub => sub.is_in_trial);
  const pastDueSubscriptions = dashboard.active_subscriptions.filter(sub => sub.is_past_due);

  const cards = [
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.length.toString(),
      subtext: `${trialSubscriptions.length} in trial`,
      icon: UserGroupIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Monthly Revenue",
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(totalRevenue),
      subtext: "Current month",
      icon: CurrencyDollarIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Billing Plans",
      value: dashboard.billing_plans.filter(plan => plan.is_active).length.toString(),
      subtext: `${dashboard.billing_plans.length} total plans`,
      icon: CreditCardIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Past Due",
      value: pastDueSubscriptions.length.toString(),
      subtext: "Needs attention",
      icon: ChartBarIcon,
      color: pastDueSubscriptions.length > 0 ? "text-red-600" : "text-gray-600",
      bgColor: pastDueSubscriptions.length > 0 ? "bg-red-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            {index === 3 && pastDueSubscriptions.length > 0 && (
              <Badge variant="danger">Alert</Badge>
            )}
          </div>
          
          <div>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {card.value}
            </Text>
            <Text className="text-sm font-medium text-gray-600 mb-1">
              {card.title}
            </Text>
            <Text className="text-xs text-gray-500">
              {card.subtext}
            </Text>
          </div>
        </Card>
      ))}
    </div>
  );
}