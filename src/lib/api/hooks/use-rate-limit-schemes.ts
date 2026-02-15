import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "./use-projects";
import { toast } from "sonner";
import type {
  CreateRateLimitSchemeRequest,
  RateLimitScheme,
  UpdateRateLimitSchemeRequest,
} from "@/types/rate-limit-scheme";

function extractSchemes(payload: unknown): RateLimitScheme[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.schemes)) return record.schemes as RateLimitScheme[];
  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.schemes)) return nested.schemes as RateLimitScheme[];
  }
  return [];
}

function extractScheme(payload: unknown): RateLimitScheme {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid rate limit scheme response");
  }
  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    return record.data as RateLimitScheme;
  }
  return record as unknown as RateLimitScheme;
}

async function listRateLimitSchemes(deploymentId: string): Promise<RateLimitScheme[]> {
  const response = await apiClient.get(
    `/deployments/${deploymentId}/api-auth/rate-limit-schemes`,
  );
  return extractSchemes(response.data);
}

async function createRateLimitScheme(
  deploymentId: string,
  request: CreateRateLimitSchemeRequest,
): Promise<RateLimitScheme> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/api-auth/rate-limit-schemes`,
    request,
  );
  return extractScheme(response.data);
}

async function updateRateLimitScheme(
  deploymentId: string,
  slug: string,
  request: UpdateRateLimitSchemeRequest,
): Promise<RateLimitScheme> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/api-auth/rate-limit-schemes/${slug}`,
    request,
  );
  return extractScheme(response.data);
}

export function useRateLimitSchemes() {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id?.toString();

  return useQuery({
    queryKey: ["api-auth-rate-limit-schemes", deploymentId],
    queryFn: () => listRateLimitSchemes(deploymentId!),
    enabled: !!deploymentId,
  });
}

export function useCreateRateLimitScheme() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: CreateRateLimitSchemeRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return createRateLimitScheme(selectedDeployment.id.toString(), request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-auth-rate-limit-schemes"] });
      toast.success("Rate limit scheme created");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create rate limit scheme";
      toast.error(message);
    },
  });
}

export function useUpdateRateLimitScheme() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async ({
      slug,
      request,
    }: {
      slug: string;
      request: UpdateRateLimitSchemeRequest;
    }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return updateRateLimitScheme(selectedDeployment.id.toString(), slug, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-auth-rate-limit-schemes"] });
      toast.success("Rate limit scheme updated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update rate limit scheme";
      toast.error(message);
    },
  });
}
