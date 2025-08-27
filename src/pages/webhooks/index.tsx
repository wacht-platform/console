import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleTabs, Tab } from "@/components/ui/simple-tabs";
import { Heading, Subheading } from "@/components/ui/heading";
import { Stat } from "@/components/stat";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  BoltIcon,
  GlobeAltIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhookApi } from "@/lib/api/webhooks";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { DateRangeSelector } from "@/components/date-range-selector";

export default function WebhooksPage() {
  const { deploymentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [dateRange, setDateRange] = useState("24h");
  const [dateRangeHours, setDateRangeHours] = useState(24);

  // Calculate date range for API
  const getDateRange = () => {
    const end = new Date();
    const start = new Date(end.getTime() - dateRangeHours * 60 * 60 * 1000);
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  };

  // Fetch webhook status
  const { data: status, isLoading } = useQuery({
    queryKey: ["webhook-status", deploymentId],
    queryFn: () => webhookApi.getStatus(deploymentId!),
  });

  // Fetch webhook analytics with date range
  const { data: analytics } = useQuery({
    queryKey: ["webhook-analytics", deploymentId, dateRangeHours],
    queryFn: () => webhookApi.getAnalytics(deploymentId!, getDateRange()),
    enabled: !!status?.is_activated,
  });

  // Fetch webhook endpoints
  const { data: endpointsData } = useQuery({
    queryKey: ["webhook-endpoints", deploymentId],
    queryFn: () => webhookApi.getEndpoints(deploymentId!),
    enabled: status?.is_activated,
  });
  
  const endpoints = endpointsData?.endpoints || [];

  // Fetch recent deliveries - use unique key to avoid cache conflicts
  const { data: deliveriesData } = useQuery({
    queryKey: ["webhook-recent-deliveries", deploymentId],
    queryFn: () => webhookApi.getDeliveries(deploymentId!, { limit: 5 }),
    enabled: status?.is_activated,
    staleTime: 30 * 1000, // Keep fresh for 30 seconds
  });
  
  const recentDeliveries = deliveriesData?.deliveries;

  // Activate webhooks mutation
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
          <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Webhooks not enabled
          </h3>
          <p className="mt-1 text-sm text-gray-500">
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
          value={analytics?.total_deliveries?.toLocaleString() || stats?.total_deliveries?.toLocaleString() || "0"}
          change=""
          showPeriodText={false}
        />
        <Stat
          title="Success Rate"
          value={
            analytics?.success_rate
              ? `${analytics.success_rate.toFixed(1)}%`
              : stats?.success_rate
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

      {/* Configuration and Navigation Tabs */}
      <div className="mt-14">
        <SimpleTabs>
          <Tab label="Configuration">
            <div className="mt-4">
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden dark:bg-zinc-900 dark:ring-white/10">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Webhook Configuration
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your webhook app settings and signing secret
                  </p>
                </div>
                <div className="px-6 py-4 space-y-4">
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
          </Tab>

          <Tab label="Endpoints">
            <div className="mt-4">
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden dark:bg-zinc-900 dark:ring-white/10">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Webhook Endpoints
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Configure endpoints to receive webhook events
                      </p>
                    </div>
                    <Button onClick={() => navigate(`endpoints`)}>
                      Manage Endpoints
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {!endpoints || endpoints.length === 0 ? (
                    <div className="text-center py-12">
                      <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        No endpoints configured
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by configuring your first webhook endpoint.
                      </p>
                      <div className="mt-6">
                        <Button onClick={() => navigate(`endpoints`)}>
                          Add First Endpoint
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {endpoints.slice(0, 3).map((endpoint) => (
                        <div
                          key={endpoint.id}
                          className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-gray-200 dark:border-zinc-700"
                          onClick={() => navigate(`endpoints`)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <GlobeAltIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {endpoint.url}
                                </p>
                              </div>
                              <Badge
                                color={endpoint.is_active ? "green" : "zinc"}
                                className="flex-shrink-0"
                              >
                                {endpoint.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {endpoint.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {endpoint.description}
                              </p>
                            )}
                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <BoltIcon className="h-4 w-4" />
                                <span>{endpoint.subscriptions?.length || 0} event subscription{endpoint.subscriptions?.length !== 1 ? "s" : ""}</span>
                              </div>
                              {endpoint.consecutive_failures && endpoint.consecutive_failures > 0 && (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <ExclamationCircleIcon className="h-4 w-4" />
                                  <span>{endpoint.consecutive_failures} consecutive failures</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ArrowRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      ))}
                      {endpoints.length > 3 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                          <Button
                            plain
                            className="w-full py-3"
                            onClick={() => navigate(`endpoints`)}
                          >
                            View all {endpoints.length} endpoints
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tab>

          <Tab label="Recent Deliveries">
            <div className="mt-4">
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden dark:bg-zinc-900 dark:ring-white/10">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Recent Deliveries
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        View recent webhook delivery attempts
                      </p>
                    </div>
                    <Button onClick={() => navigate(`deliveries`)}>
                      View All Deliveries
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {!recentDeliveries || recentDeliveries.length === 0 ? (
                    <div className="text-center py-12">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        No deliveries yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Webhook deliveries will appear here once events are
                        triggered.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentDeliveries.map((delivery) => (
                        <div
                          key={delivery.delivery_id}
                          className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-gray-200 dark:border-zinc-700"
                          onClick={() => navigate(`deliveries/${delivery.delivery_id}`)}
                        >
                          <div className="flex items-center gap-4">
                            {delivery.status === "success" ? (
                              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                            ) : delivery.status === "failed" ? (
                              <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                            ) : delivery.status === "retrying" ? (
                              <ArrowPathIcon className="h-6 w-6 text-yellow-500 animate-spin flex-shrink-0" />
                            ) : (
                              <ExclamationCircleIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                                  {delivery.event_name}
                                </p>
                                <Badge
                                  color={
                                    delivery.status === "success"
                                      ? "green"
                                      : delivery.status === "failed"
                                        ? "red"
                                        : delivery.status === "retrying"
                                          ? "yellow"
                                          : "zinc"
                                  }
                                >
                                  {delivery.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="h-4 w-4" />
                                  <span>{new Date(delivery.timestamp).toLocaleString()}</span>
                                </div>
                                {delivery.response_time_ms && (
                                  <div className="flex items-center gap-1">
                                    <span>⚡</span>
                                    <span>{delivery.response_time_ms}ms</span>
                                  </div>
                                )}
                                {delivery.http_status_code && (
                                  <div className="flex items-center gap-1">
                                    <span>🌐</span>
                                    <span>HTTP {delivery.http_status_code}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <ArrowRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      ))}
                      {stats?.total_deliveries && stats.total_deliveries > 5 && (
                        <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                          <Button
                            plain
                            className="w-full py-3"
                            onClick={() => navigate(`deliveries`)}
                          >
                            View all {stats.total_deliveries.toLocaleString()} deliveries
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tab>
        </SimpleTabs>
      </div>

      {/* Quick Actions */}
      <div className="mt-14">
        <Subheading>Quick Actions</Subheading>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div
            className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:ring-white/10 transition-colors"
            onClick={() => navigate(`endpoints`)}
          >
            <div className="px-6 py-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Manage Endpoints
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Add, edit, or remove webhook endpoints
              </p>
            </div>
          </div>
          <div
            className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:ring-white/10 transition-colors"
            onClick={() => navigate(`deliveries`)}
          >
            <div className="px-6 py-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Delivery History
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                View and retry webhook deliveries
              </p>
            </div>
          </div>
          <div
            className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:ring-white/10 transition-colors"
            onClick={() => navigate(`analytics`)}
          >
            <div className="px-6 py-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Analytics</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Monitor webhook performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
