import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BoltIcon } from "@heroicons/react/24/outline";
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
        <div className="text-center py-12">
          <BoltIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-normal">
            Webhooks not enabled
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
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
      <div className="space-y-6">
        <div className="flex justify-end">
          <DateRangeSelector
            value={dateRange}
            onChange={(value, hours) => {
              setDateRange(value);
              setDateRangeHours(hours);
            }}
          />
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_endpoints?.toString() || "0"}</div>
              <p className="text-xs text-muted-foreground">
                Active webhook destinations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isAnalyticsLoading
                  ? "Loading..."
                  : analytics?.total_deliveries !== undefined
                    ? analytics.total_deliveries.toLocaleString()
                    : stats?.total_deliveries !== undefined
                      ? stats.total_deliveries.toLocaleString()
                      : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all endpoints
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isAnalyticsLoading
                  ? "Loading..."
                  : analytics?.success_rate !== undefined
                    ? `${analytics.success_rate.toFixed(1)}%`
                    : stats?.success_rate !== undefined
                      ? `${stats.success_rate.toFixed(1)}%`
                      : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery success rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Failed Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.failed_deliveries?.toString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.avg_response_time_ms
                  ? `${analytics.avg_response_time_ms.toFixed(0)}ms`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average endpoint latency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Manage your webhook app settings and signing secret for securing your endpoints.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium leading-none">
                  App Name
                </label>
                <p className="text-sm text-muted-foreground">{app?.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium leading-none">
                  Created At
                </label>
                <p className="text-sm text-muted-foreground">
                  {app?.created_at
                    ? new Date(app.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Signing Secret
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono text-foreground break-all">
                  {showSecret
                    ? app?.signing_secret
                    : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                </code>
                <Button
                  variant="outline"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? "Hide" : "Show"}
                </Button>
                <Button
                  variant="outline"
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
              <p className="text-xs text-muted-foreground">
                Use this secret to verify webhook signatures in your application.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
