import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface WebhookDelivery {
  delivery_id: number;
  app_id: number;
  app_name: string;
  endpoint_id: number;
  endpoint_url: string;
  event_name: string;
  status: "pending" | "success" | "failed" | "retrying" | "filtered";
  http_status_code?: number;
  response_time_ms?: number;
  attempt_number: number;
  error_message?: string;
  filtered_reason?: string;
  timestamp: string;
}

interface DeliveryDetails extends WebhookDelivery {
  payload?: any;
  response_body?: string;
  headers_sent?: Record<string, string>;
}

export default function WebhookDeliveriesPage() {
  const { deploymentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch deliveries
  const { data: deliveries, isLoading, refetch } = useQuery({
    queryKey: ["webhook-deliveries", deploymentId, statusFilter, eventFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (eventFilter) params.append("event_name", eventFilter);
      params.append("limit", "100");
      
      const response = await apiClient.get(
        `/deployments/${deploymentId}/webhooks/deliveries?${params.toString()}`
      );
      return response.data.deliveries as WebhookDelivery[];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch delivery details
  const fetchDeliveryDetails = async (deliveryId: number) => {
    const response = await apiClient.get(
      `/deployments/${deploymentId}/webhooks/deliveries/${deliveryId}`
    );
    setSelectedDelivery(response.data);
    setShowDetailsDialog(true);
  };

  // Retry delivery mutation
  const retryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      const response = await apiClient.post(
        `/deployments/${deploymentId}/webhooks/deliveries/${deliveryId}/retry`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Webhook delivery retried successfully!");
      queryClient.invalidateQueries({ queryKey: ["webhook-deliveries"] });
    },
    onError: () => {
      toast.error("Failed to retry webhook delivery");
    },
  });

  const getStatusBadge = (delivery: WebhookDelivery) => {
    switch (delivery.status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "retrying":
        return (
          <Badge variant="outline">
            <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
            Retrying
          </Badge>
        );
      case "filtered":
        return (
          <Badge variant="secondary">
            <FunnelIcon className="h-3 w-3 mr-1" />
            Filtered
          </Badge>
        );
      default:
        return <Badge variant="secondary">{delivery.status}</Badge>;
    }
  };

  const getHttpStatusBadge = (code?: number) => {
    if (!code) return null;
    
    const variant = code >= 200 && code < 300 ? "default" 
                  : code >= 400 && code < 500 ? "destructive"
                  : code >= 500 ? "destructive" 
                  : "secondary";
    
    return <Badge variant={variant}>HTTP {code}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/deployments/${deploymentId}/webhooks`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Webhooks
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Delivery History</h1>
            <p className="text-muted-foreground mt-1">
              Monitor webhook delivery attempts and troubleshoot issues
            </p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="retrying">Retrying</SelectItem>
                <SelectItem value="filtered">Filtered</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by event name..."
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardContent className="p-0">
          {deliveries && deliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-sm">Event</th>
                    <th className="p-4 font-medium text-sm">Endpoint</th>
                    <th className="p-4 font-medium text-sm">Status</th>
                    <th className="p-4 font-medium text-sm">Response</th>
                    <th className="p-4 font-medium text-sm">Time</th>
                    <th className="p-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <tr key={delivery.delivery_id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-mono text-sm">{delivery.event_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Attempt {delivery.attempt_number}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm truncate max-w-xs" title={delivery.endpoint_url}>
                          {delivery.endpoint_url}
                        </p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(delivery)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getHttpStatusBadge(delivery.http_status_code)}
                          {delivery.response_time_ms && (
                            <span className="text-xs text-muted-foreground">
                              {delivery.response_time_ms}ms
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(delivery.timestamp), "MMM d, HH:mm:ss")}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchDeliveryDetails(delivery.delivery_id)}
                          >
                            Details
                          </Button>
                          {(delivery.status === "failed" || delivery.status === "filtered") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryMutation.mutate(delivery.delivery_id)}
                              disabled={retryMutation.isPending}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No deliveries found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== "all" || eventFilter
                  ? "Try adjusting your filters"
                  : "Webhook deliveries will appear here once events are triggered"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>
              Full details of webhook delivery attempt
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Delivery ID</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDelivery.delivery_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedDelivery)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Event Name</label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedDelivery.event_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Endpoint</label>
                  <p className="text-sm text-muted-foreground break-all">
                    {selectedDelivery.endpoint_url}
                  </p>
                </div>
                {selectedDelivery.http_status_code && (
                  <div>
                    <label className="text-sm font-medium">HTTP Status</label>
                    <div className="mt-1">
                      {getHttpStatusBadge(selectedDelivery.http_status_code)}
                    </div>
                  </div>
                )}
                {selectedDelivery.response_time_ms && (
                  <div>
                    <label className="text-sm font-medium">Response Time</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDelivery.response_time_ms}ms
                    </p>
                  </div>
                )}
              </div>

              {selectedDelivery.error_message && (
                <div>
                  <label className="text-sm font-medium">Error Message</label>
                  <div className="mt-1 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive">
                      {selectedDelivery.error_message}
                    </p>
                  </div>
                </div>
              )}

              {selectedDelivery.filtered_reason && (
                <div>
                  <label className="text-sm font-medium">Filter Reason</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDelivery.filtered_reason}
                  </p>
                </div>
              )}

              {selectedDelivery.payload && (
                <div>
                  <label className="text-sm font-medium">Payload</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(selectedDelivery.payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedDelivery.response_body && (
                <div>
                  <label className="text-sm font-medium">Response Body</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md overflow-x-auto text-xs">
                    {selectedDelivery.response_body}
                  </pre>
                </div>
              )}

              {selectedDelivery.headers_sent && (
                <div>
                  <label className="text-sm font-medium">Headers Sent</label>
                  <pre className="mt-1 p-3 bg-muted rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(selectedDelivery.headers_sent, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}