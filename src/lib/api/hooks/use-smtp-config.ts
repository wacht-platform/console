import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { CustomSmtpConfig, SmtpConfigRequest } from "@/types/deployment";

interface SmtpConfigParams {
  deploymentId: string;
}

async function getSmtpConfig(
  params: SmtpConfigParams
): Promise<CustomSmtpConfig | null> {
  const { data } = await apiClient.get<CustomSmtpConfig | null>(
    `/deployments/${params.deploymentId}/settings/email/smtp`
  );
  return data;
}

async function verifySmtpConnection(
  deploymentId: string,
  config: SmtpConfigRequest
): Promise<void> {
  await apiClient.post(
    `/deployments/${deploymentId}/settings/email/smtp/verify`,
    config
  );
}

async function updateSmtpConfig(
  deploymentId: string,
  config: SmtpConfigRequest
): Promise<CustomSmtpConfig> {
  const { data } = await apiClient.post<CustomSmtpConfig>(
    `/deployments/${deploymentId}/settings/email/smtp`,
    config
  );
  return data;
}

async function removeSmtpConfig(deploymentId: string): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/settings/email/smtp`
  );
}

export function useSmtpConfig(deploymentId: string | undefined) {
  return useQuery({
    queryKey: ["smtp-config", deploymentId],
    queryFn: () => getSmtpConfig({ deploymentId: deploymentId! }),
    enabled: !!deploymentId,
  });
}

export function useVerifySmtpConnection() {
  return useMutation({
    mutationFn: ({
      deploymentId,
      config,
    }: {
      deploymentId: string;
      config: SmtpConfigRequest;
    }) => verifySmtpConnection(deploymentId, config),
  });
}

export function useUpdateSmtpConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deploymentId,
      config,
    }: {
      deploymentId: string;
      config: SmtpConfigRequest;
    }) => updateSmtpConfig(deploymentId, config),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["smtp-config", variables.deploymentId],
      });
      queryClient.setQueryData(
        ["smtp-config", variables.deploymentId],
        data
      );
    },
  });
}

export function useRemoveSmtpConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) => removeSmtpConfig(deploymentId),
    onSuccess: (_, deploymentId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["smtp-config", deploymentId],
      });
      queryClient.setQueryData(["smtp-config", deploymentId], null);
    },
  });
}
