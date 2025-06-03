import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { Deployment } from "@/types/deployment";

interface VerifyDnsRecordsRequest {
  deploymentId: string;
}

async function verifyDnsRecords(request: VerifyDnsRecordsRequest): Promise<Deployment> {
  const { data } = await apiClient.post<Deployment>(
    `/deployment/${request.deploymentId}/verify-dns`
  );
  return data;
}

export function useVerifyDnsRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyDnsRecords,
    onSuccess: (deployment) => {
      // Invalidate projects query to refetch updated deployment data
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      // Update the specific deployment in cache if it exists
      queryClient.setQueryData(["deployment", deployment.id], deployment);
    },
    onError: (error) => {
      console.error("Failed to verify DNS records:", error);
    },
  });
}
