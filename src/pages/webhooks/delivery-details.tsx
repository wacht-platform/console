import { useParams, useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { webhookApi } from "@/lib/api/webhooks";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { InlineLoader } from "@/components/ui/loading-screen";

export default function WebhookDeliveryDetailsPage() {
  const { deploymentId, deliveryId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  // Fetch delivery details
  const { data: delivery, isLoading } = useQuery({
    queryKey: ["webhook-delivery", deploymentId, deliveryId, status],
    queryFn: () => webhookApi.getDeliveryDetails(deploymentId!, deliveryId!, status || undefined),
  });

  // Retry delivery mutation
  const retryMutation = useMutation({
    mutationFn: () => webhookApi.retryDelivery(deploymentId!, deliveryId!),
    onSuccess: () => {
      toast.success("Delivery retry initiated");
      queryClient.invalidateQueries({
        queryKey: ["webhook-delivery", deploymentId, deliveryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["webhook-deliveries", deploymentId],
      });
    },
    onError: () => {
      toast.error("Failed to retry delivery");
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  if (!delivery) {
    return (
      <div>
        <Heading>Delivery Not Found</Heading>
        <p className="text-zinc-500 mt-2">
          The requested delivery could not be found.
        </p>
        <button
          className="mt-4 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 inline-flex items-center text-sm"
          onClick={() => navigate(`/project/${deploymentId}/deployment/${deploymentId}/webhooks/deliveries`)}
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to deliveries
        </button>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (delivery.status) {
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case "retrying":
        return <ArrowPathIcon className="h-6 w-6 text-yellow-500 animate-spin" />;
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate(`/project/${deploymentId}/deployment/${deploymentId}/webhooks/deliveries`)}
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-4 inline-flex items-center text-sm"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to deliveries
        </button>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <Heading>Delivery #{delivery.delivery_id}</Heading>
            <p className="text-sm text-zinc-500 mt-1">
              {new Date(delivery.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-900/5 dark:ring-zinc-100/10 rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Overview</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Event</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{delivery.event_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</dt>
              <dd className="mt-1">
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
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Endpoint</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{delivery.endpoint_url}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">HTTP Status</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {delivery.http_status_code || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Response Time</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {delivery.response_time_ms ? `${delivery.response_time_ms}ms` : "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Attempts</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {delivery.attempt_number} / {delivery.max_attempts}
              </dd>
            </div>
          </dl>

          {delivery.error_message && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error Message</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{delivery.error_message}</p>
            </div>
          )}

          {delivery.filtered_reason && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Filtered</p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">{delivery.filtered_reason}</p>
            </div>
          )}

          {delivery.next_retry_at && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Next Retry</p>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {new Date(delivery.next_retry_at).toLocaleString()}
              </p>
            </div>
          )}

          {delivery.status !== "pending" && (
            <div className="mt-6">
              <button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retryMutation.isPending ? (
                  <>
                    <Spinner size="xs" className="mr-2" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="mr-2 h-4 w-4" />
                    Retry Delivery
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payload */}
      {delivery.payload && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-900/5 dark:ring-zinc-100/10 rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Payload</h3>
            <button
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm inline-flex items-center"
              onClick={() => copyToClipboard(JSON.stringify(delivery.payload, null, 2), "Payload")}
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
              Copy
            </button>
          </div>
          <div className="px-6 py-4">
            <pre className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 overflow-x-auto">
              {JSON.stringify(delivery.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Response */}
      {delivery.response_body && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-900/5 dark:ring-zinc-100/10 rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Response</h3>
            <button
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm inline-flex items-center"
              onClick={() => copyToClipboard(delivery.response_body!, "Response")}
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
              Copy
            </button>
          </div>
          <div className="px-6 py-4">
            <pre className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 overflow-x-auto">
              {delivery.response_body}
            </pre>
          </div>
        </div>
      )}

      {/* Response Headers */}
      {delivery.response_headers && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-900/5 dark:ring-zinc-100/10 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Response Headers</h3>
            <button
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm inline-flex items-center"
              onClick={() => copyToClipboard(delivery.response_headers || "", "Response Headers")}
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
              Copy
            </button>
          </div>
          <div className="px-6 py-4">
            <pre className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 overflow-x-auto">
              {(() => {
                try {
                  const headers = JSON.parse(delivery.response_headers);
                  return JSON.stringify(headers, null, 2);
                } catch {
                  return delivery.response_headers;
                }
              })()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}