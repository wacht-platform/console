import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Stat } from "@/components/stat";
import {
  BoltIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhookApi } from "@/lib/api/webhooks";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeSelector } from "@/components/date-range-selector";

export default function WebhooksPage() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [dateRange, setDateRange] = useState("24h");
  const [dateRangeHours, setDateRangeHours] = useState(24);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date(end.getTime() - dateRangeHours * 60 * 60 * 1000);
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  };

  const { data: status, isLoading } = useQuery({
    queryKey: ["webhook-status", deploymentId],
    queryFn: () => webhookApi.getStatus(deploymentId!),
  });

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["webhook-analytics", deploymentId, dateRangeHours],
    queryFn: () => webhookApi.getAnalytics(deploymentId!, getDateRange()),
    enabled: !!status?.is_activated,
    staleTime: 30 * 1000, 
  });

  const activateMutation = useMutation({
    mutationFn: () => webhookApi.activate(deploymentId!),
    onSuccess: () => {
      toast.success("Webhooks activated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["webhook-status", deploymentId],
      });
    },
    onError: () => {
      toast.error("Failed to activate webhooks");
    },
  });

  // Rotate secret mutation
  const rotateSecretMutation = useMutation({
    mutationFn: () => webhookApi.rotateSecret(deploymentId!),
    onSuccess: () => {
      toast.success("Signing secret rotated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["webhook-status", deploymentId],
      });
      setShowSecret(true);
    },
    onError: () => {
      toast.error("Failed to rotate signing secret");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading webhooks...
          </span>
        </div>
      </div>
    );
  }

  if (!status?.is_activated) {
    return (
      <div>
        <Heading>Webhooks</Heading>
        <div className="text-center py-12">
          <BoltIcon className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Webhooks not enabled
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by enabling webhooks to receive real-time platform
            events.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <>
                  <Spinner size="xs" className="mr-2" />
                  Activating...
                </>
              ) : (
                <>
                  <BoltIcon className="mr-2 h-4 w-4" />
                  Enable Webhooks
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { app, stats } = status;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <Heading>Webhooks</Heading>
          <p className="text-zinc-500 mt-1 dark:text-zinc-400">
            Manage webhook endpoints and monitor deliveries
          </p>
        </div>
        <Badge color={app?.is_active ? "green" : "zinc"}>
          {app?.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Date Range Selector */}
      <div className="mt-6 flex justify-end">
        <DateRangeSelector
          value={dateRange}
          onChange={(value, hours) => {
            setDateRange(value);
            setDateRangeHours(hours);
          }}
        />
      </div>

      {/* Stats */}
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
        <Stat
          title="Active Endpoints"
          value={stats?.active_endpoints?.toString() || "0"}
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Total Deliveries"
          value={
            isAnalyticsLoading
              ? "Loading..."
              : analytics?.total_deliveries !== undefined
                ? analytics.total_deliveries.toLocaleString()
                : stats?.total_deliveries !== undefined
                  ? stats.total_deliveries.toLocaleString()
                  : "0"
          }
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Success Rate"
          value={
            isAnalyticsLoading
              ? "Loading..."
              : analytics?.success_rate !== undefined
                ? `${analytics.success_rate.toFixed(1)}%`
                : stats?.success_rate !== undefined
                  ? `${stats.success_rate.toFixed(1)}%`
                  : "N/A"
          }
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Failed Deliveries"
          value={analytics?.failed_deliveries?.toString() || "0"}
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Avg Response Time"
          value={
            analytics?.avg_response_time_ms
              ? `${analytics.avg_response_time_ms.toFixed(0)}ms`
              : "N/A"
          }
          change=""
          showPeriodText={false}
        />
      </div>

      {/* Configuration */}
      <div className="mt-14">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Webhook Configuration
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your webhook app settings and signing secret
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              App Name
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{app?.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Signing Secret
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm font-mono text-gray-900 dark:bg-zinc-800 dark:text-gray-100">
                {showSecret
                  ? app?.signing_secret
                  : "••••••••••••••••••••••••"}
              </code>
              <Button
                outline
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Hide" : "Show"}
              </Button>
              <Button
                outline
                onClick={() => rotateSecretMutation.mutate()}
                disabled={rotateSecretMutation.isPending}
              >
                {rotateSecretMutation.isPending ? (
                  <>
                    <Spinner size="xs" className="mr-2" />
                    Rotating...
                  </>
                ) : (
                  "Rotate"
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Use this secret to verify webhook signatures in your
              application
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Created
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              {app?.created_at
                ? new Date(app.created_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
