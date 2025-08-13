import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabItem } from "@/components/ui/tabs";
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface WebhookApp {
  id: number;
  name: string;
  signing_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookStats {
  total_deliveries: number;
  success_rate: number;
  active_endpoints: number;
  failed_deliveries_24h: number;
}

interface WebhookStatus {
  is_activated: boolean;
  app: WebhookApp | null;
  stats: WebhookStats | null;
}

export default function WebhooksPage() {
  const { deploymentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);

  // Fetch webhook status
  const { data: status, isLoading } = useQuery({
    queryKey: ["webhook-status", deploymentId],
    queryFn: async () => {
      const response = await apiClient.get(`/deployments/${deploymentId}/webhooks/status`);
      return response.data as WebhookStatus;
    },
  });

  // Activate webhooks mutation
  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/activate`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Webhooks activated successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-status", deploymentId] });
    },
    onError: () => {
      toast.error("Failed to activate webhooks");
    },
  });

  // Rotate secret mutation
  const rotateSecretMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/deployments/${deploymentId}/webhooks/rotate-secret`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Signing secret rotated successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-status", deploymentId] });
      setShowSecret(true);
    },
    onError: () => {
      toast.error("Failed to rotate signing secret");
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!status?.is_activated) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BoltIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Enable Webhooks</CardTitle>
              <CardDescription className="text-base mt-2">
                Receive real-time notifications about platform events for this deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Real-time Platform Events</p>
                    <p className="text-sm text-muted-foreground">
                      Get instant notifications when users sign up, create organizations, and more
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Secure & Reliable</p>
                    <p className="text-sm text-muted-foreground">
                      HMAC signature verification, automatic retries, and delivery guarantees
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <ChartBarIcon className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Comprehensive Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor delivery success rates, response times, and endpoint health
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => activateMutation.mutate()}
                  disabled={activateMutation.isPending}
                >
                  {activateMutation.isPending ? (
                    <>
                      <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Activate Webhooks
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { app, stats } = status;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Manage webhook endpoints and monitor deliveries
          </p>
        </div>
        <Badge variant={app?.is_active ? "default" : "secondary"}>
          {app?.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_endpoints || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <BoltIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_deliveries?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.success_rate ? `${(stats.success_rate * 100).toFixed(1)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed (24h)</CardTitle>
            <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failed_deliveries_24h || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration and Navigation Tabs */}
      <Tabs defaultIndex={0} variant="pills" size="md">
        <TabItem label="Configuration">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Manage your webhook app settings and signing secret
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">App Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{app?.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Signing Secret</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {showSecret ? app?.signing_secret : "••••••••••••••••••••••••"}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateSecretMutation.mutate()}
                      disabled={rotateSecretMutation.isPending}
                    >
                      Rotate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use this secret to verify webhook signatures in your application
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {app?.created_at ? new Date(app.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabItem>

        <TabItem label="Endpoints">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Webhook Endpoints</CardTitle>
                    <CardDescription>
                      Configure endpoints to receive webhook events
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate(`endpoints`)}>
                    Manage Endpoints
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats?.active_endpoints === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No endpoints configured yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => navigate(`endpoints`)}
                    >
                      Add First Endpoint
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You have {stats?.active_endpoints} active endpoint{stats?.active_endpoints !== 1 ? 's' : ''}.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabItem>

        <TabItem label="Recent Deliveries">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Deliveries</CardTitle>
                    <CardDescription>
                      View recent webhook delivery attempts
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate(`deliveries`)}>
                    View All Deliveries
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Delivery history will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </TabItem>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`endpoints`)}>
          <CardHeader>
            <CardTitle className="text-base">Manage Endpoints</CardTitle>
            <CardDescription>Add, edit, or remove webhook endpoints</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`deliveries`)}>
          <CardHeader>
            <CardTitle className="text-base">Delivery History</CardTitle>
            <CardDescription>View and retry webhook deliveries</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`analytics`)}>
          <CardHeader>
            <CardTitle className="text-base">Analytics</CardTitle>
            <CardDescription>Monitor webhook performance metrics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}