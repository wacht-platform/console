import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhookApi } from "@/lib/api/webhooks";
import { toast } from "sonner";
import { SkeletonTableRows } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function WebhookDeliveriesPage() {
  const { deploymentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  // Fetch deliveries - use specific key to avoid cache conflicts
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "webhook-deliveries-list",
      deploymentId,
      statusFilter,
      eventFilter,
      currentPage,
    ],
    queryFn: () =>
      webhookApi.getDeliveries(deploymentId!, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        event_name: eventFilter || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
      }),
    // refetchInterval: 10000, // Temporarily disabled - use manual refresh button
    staleTime: 5 * 1000, // Data is fresh for 5 seconds
    gcTime: 30 * 1000, // Keep cache for 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Prevent duplicate fetches on focus
  });

  const deliveries = data?.deliveries;
  const hasMore = data?.has_more || false;

  // Reset page when filters change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const handleEventFilterChange = (value: string) => {
    setEventFilter(value);
    setCurrentPage(0);
  };

  // Retry delivery mutation
  const retryMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      webhookApi.retryDelivery(deploymentId!, deliveryId),
    onSuccess: () => {
      toast.success("Webhook delivery retried successfully!");
      // Invalidate the exact query to avoid cache issues
      queryClient.invalidateQueries({
        queryKey: [
          "webhook-deliveries-list",
          deploymentId,
          statusFilter,
          eventFilter,
          currentPage,
        ],
        exact: true,
      });
    },
    onError: () => {
      toast.error("Failed to retry webhook delivery");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge color="green">Success</Badge>;
      case "failed":
        return <Badge color="amber">Failed</Badge>;
      case "permanently_failed":
        return <Badge color="red">Permanently Failed</Badge>;
      case "pending":
        return <Badge color="blue">Pending</Badge>;
      case "retrying":
        return <Badge color="amber">Retrying</Badge>;
      case "filtered":
        return <Badge color="zinc">Filtered</Badge>;
      case "replayed":
        return <Badge color="purple">Replayed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-normal tracking-tight">Webhook Deliveries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor and manage webhook delivery attempts
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event name..."
            value={eventFilter}
            onChange={(e) => handleEventFilterChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed (Retryable)</SelectItem>
            <SelectItem value="permanently_failed">Permanently Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="filtered">Filtered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonTableRows rows={10} columns={6} withAvatar={false} />
          ) : !deliveries || deliveries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center px-6 py-16">
                <div className="flex flex-col items-center">
                  <ClockIcon className="h-12 w-12 text-zinc-400 mb-4" />
                  <h3 className="text-sm font-normal text-zinc-900 dark:text-zinc-100">
                    No deliveries found
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {statusFilter !== "all" || eventFilter
                      ? "Try adjusting your filters"
                      : "Webhook deliveries will appear here once events are triggered"}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            deliveries.map((delivery: any) => (
              <TableRow
                key={delivery.delivery_id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() =>
                  navigate(
                    `/project/${deploymentId}/deployment/${deploymentId}/webhooks/deliveries/${delivery.delivery_id}${delivery.status === "pending" ? "?status=pending" : ""}`,
                  )
                }
              >
                <TableCell
                  style={{ paddingLeft: "2rem", paddingRight: "1.5rem" }}
                >
                  <div>
                    <code className="text-sm font-medium text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                      {delivery.event_name}
                    </code>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Attempt {delivery.attempt_number} of{" "}
                      {delivery.max_attempts || 5}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="max-w-xs">
                    <div
                      className="text-sm text-zinc-900 dark:text-zinc-100 truncate"
                      title={delivery.endpoint_url}
                    >
                      {new URL(delivery.endpoint_url).hostname}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {new URL(delivery.endpoint_url).pathname}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  {getStatusBadge(delivery.status)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  {delivery.http_status_code ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        color={
                          delivery.http_status_code >= 200 &&
                            delivery.http_status_code < 300
                            ? "green"
                            : delivery.http_status_code >= 400 &&
                              delivery.http_status_code < 500
                              ? "amber"
                              : "red"
                        }
                      >
                        {delivery.http_status_code}
                      </Badge>
                      {delivery.response_time_ms && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {delivery.response_time_ms}ms
                        </span>
                      )}
                    </div>
                  ) : delivery.error_message ? (
                    <span
                      className="text-xs text-red-600 dark:text-red-400"
                      title={delivery.error_message}
                    >
                      {delivery.error_message.length > 30
                        ? `${delivery.error_message.substring(0, 30)}...`
                        : delivery.error_message}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="text-sm text-zinc-900 dark:text-zinc-100">
                    {format(new Date(delivery.timestamp), "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {format(new Date(delivery.timestamp), "h:mm:ss a")}
                  </div>
                </TableCell>
                <TableCell
                  style={{
                    paddingLeft: "1.5rem",
                    paddingRight: "2rem",
                    textAlign: "right",
                  }}
                >
                  <div className="flex items-center justify-end gap-2">
                    {delivery.status !== "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          retryMutation.mutate(delivery.delivery_id);
                        }}
                        disabled={retryMutation.isPending}
                        title="Retry delivery"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <ChevronRightIcon className="h-4 w-4 text-zinc-400" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {deliveries && deliveries.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} -{" "}
            {Math.min((currentPage + 1) * pageSize, currentPage * pageSize + deliveries.length)}{" "}
            of {hasMore ? "many" : currentPage * pageSize + deliveries.length} deliveries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!hasMore}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
