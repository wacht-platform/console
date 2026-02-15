import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "./use-projects";
import { toast } from "sonner";
import type {
  CreateWebhookEventCatalogRequest,
  WebhookEventCatalog,
} from "@/types/webhook-catalog";

function extractCatalogs(payload: unknown): WebhookEventCatalog[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data as WebhookEventCatalog[];
  return [];
}

function extractCatalog(payload: unknown): WebhookEventCatalog {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid event catalog response");
  }
  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    return record.data as WebhookEventCatalog;
  }
  return record as unknown as WebhookEventCatalog;
}

async function listWebhookEventCatalogs(
  deploymentId: string,
): Promise<WebhookEventCatalog[]> {
  const response = await apiClient.get(
    `/deployments/${deploymentId}/webhooks/event-catalogs`,
  );
  return extractCatalogs(response.data);
}

async function createWebhookEventCatalog(
  deploymentId: string,
  request: CreateWebhookEventCatalogRequest,
): Promise<WebhookEventCatalog> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/webhooks/event-catalogs`,
    request,
  );
  return extractCatalog(response.data);
}

export function useWebhookEventCatalogs() {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id?.toString();

  return useQuery({
    queryKey: ["webhook-event-catalogs", deploymentId],
    queryFn: () => listWebhookEventCatalogs(deploymentId!),
    enabled: !!deploymentId,
  });
}

export function useCreateWebhookEventCatalog() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: CreateWebhookEventCatalogRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return createWebhookEventCatalog(selectedDeployment.id.toString(), request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook-event-catalogs"] });
      toast.success("Event catalog created");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create event catalog";
      toast.error(message);
    },
  });
}
