import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "./use-projects";
import type {
  CreateOAuthAppRequest,
  CreateOAuthClientRequest,
  OAuthApp,
  OAuthClient,
  OAuthDomainVerificationResponse,
  OAuthGrant,
  RotateOAuthClientSecretResponse,
  SetOAuthScopeMappingRequest,
  UpdateOAuthScopeRequest,
  UpdateOAuthAppRequest,
  UpdateOAuthClientRequest,
} from "@/types/oauth-management";

function getNestedRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const top = payload as Record<string, unknown>;
  if (top.data && typeof top.data === "object") {
    return top.data as Record<string, unknown>;
  }
  return top;
}

function getArrayField<T>(payload: unknown, key: string): T[] {
  const record = getNestedRecord(payload);
  const value = record[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

async function listOAuthApps(deploymentId: string): Promise<OAuthApp[]> {
  const response = await apiClient.get(`/deployments/${deploymentId}/oauth/apps`);
  return getArrayField<OAuthApp>(response.data, "apps");
}

async function createOAuthApp(
  deploymentId: string,
  request: CreateOAuthAppRequest,
): Promise<OAuthApp> {
  const formData = new FormData();
  formData.append("slug", request.slug);
  formData.append("name", request.name);
  if (request.description) formData.append("description", request.description);
  if (request.fqdn) formData.append("fqdn", request.fqdn);
  if (request.logo_file) formData.append("logo", request.logo_file);
  if (request.supported_scopes?.length) {
    formData.append("supported_scopes", request.supported_scopes.join(","));
  }
  if (request.scope_definitions?.length) {
    formData.append("scope_definitions", JSON.stringify(request.scope_definitions));
  }
  if (typeof request.allow_dynamic_client_registration === "boolean") {
    formData.append(
      "allow_dynamic_client_registration",
      request.allow_dynamic_client_registration ? "true" : "false",
    );
  }

  const response = await apiClient.post(`/deployments/${deploymentId}/oauth/apps`, formData);
  return getNestedRecord(response.data) as unknown as OAuthApp;
}

async function updateOAuthApp(
  deploymentId: string,
  oauthAppSlug: string,
  request: UpdateOAuthAppRequest,
): Promise<OAuthApp> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}`,
    request,
  );
  return getNestedRecord(response.data) as unknown as OAuthApp;
}

async function verifyOAuthAppDomain(
  deploymentId: string,
  oauthAppSlug: string,
): Promise<OAuthDomainVerificationResponse> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/verify-domain`,
  );
  return getNestedRecord(response.data) as unknown as OAuthDomainVerificationResponse;
}

async function updateOAuthScope(
  deploymentId: string,
  oauthAppSlug: string,
  scope: string,
  request: UpdateOAuthScopeRequest,
): Promise<OAuthApp> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/scopes/${encodeURIComponent(scope)}`,
    request,
  );
  return getNestedRecord(response.data) as unknown as OAuthApp;
}

async function archiveOAuthScope(
  deploymentId: string,
  oauthAppSlug: string,
  scope: string,
): Promise<OAuthApp> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/scopes/${encodeURIComponent(scope)}/archive`,
  );
  return getNestedRecord(response.data) as unknown as OAuthApp;
}

async function unarchiveOAuthScope(
  deploymentId: string,
  oauthAppSlug: string,
  scope: string,
): Promise<OAuthApp> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/scopes/${encodeURIComponent(scope)}/unarchive`,
  );
  return getNestedRecord(response.data) as unknown as OAuthApp;
}

async function setOAuthScopeMapping(
  deploymentId: string,
  oauthAppSlug: string,
  scope: string,
  request: SetOAuthScopeMappingRequest,
): Promise<OAuthApp> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/scopes/${encodeURIComponent(scope)}/mapping`,
    request,
  );
  return getNestedRecord(response.data) as unknown as OAuthApp;
}

async function listOAuthClients(deploymentId: string, oauthAppSlug: string): Promise<OAuthClient[]> {
  const response = await apiClient.get(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients`,
  );
  return getArrayField<OAuthClient>(response.data, "clients");
}

async function createOAuthClient(
  deploymentId: string,
  oauthAppSlug: string,
  request: CreateOAuthClientRequest,
): Promise<OAuthClient> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients`,
    request,
  );
  return getNestedRecord(response.data) as unknown as OAuthClient;
}

async function updateOAuthClient(
  deploymentId: string,
  oauthAppSlug: string,
  oauthClientId: string,
  request: UpdateOAuthClientRequest,
): Promise<OAuthClient> {
  const response = await apiClient.patch(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients/${oauthClientId}`,
    request,
  );
  return getNestedRecord(response.data) as unknown as OAuthClient;
}

async function deactivateOAuthClient(
  deploymentId: string,
  oauthAppSlug: string,
  oauthClientId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients/${oauthClientId}`,
  );
}

async function rotateOAuthClientSecret(
  deploymentId: string,
  oauthAppSlug: string,
  oauthClientId: string,
): Promise<RotateOAuthClientSecretResponse> {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients/${oauthClientId}/rotate-secret`,
  );
  return getNestedRecord(response.data) as unknown as RotateOAuthClientSecretResponse;
}

async function listOAuthGrants(
  deploymentId: string,
  oauthAppSlug: string,
  oauthClientId: string,
): Promise<OAuthGrant[]> {
  const response = await apiClient.get(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients/${oauthClientId}/grants`,
  );
  return getArrayField<OAuthGrant>(response.data, "grants");
}

async function revokeOAuthGrant(
  deploymentId: string,
  oauthAppSlug: string,
  oauthClientId: string,
  grantId: string,
): Promise<void> {
  await apiClient.post(
    `/deployments/${deploymentId}/oauth/apps/${oauthAppSlug}/clients/${oauthClientId}/grants/${grantId}/revoke`,
  );
}

export function useOAuthApps() {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id?.toString();

  return useQuery({
    queryKey: ["oauth-apps", deploymentId],
    queryFn: () => listOAuthApps(deploymentId!),
    enabled: !!deploymentId,
  });
}

export function useCreateOAuthApp() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: CreateOAuthAppRequest) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      return createOAuthApp(selectedDeployment.id.toString(), request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-apps"] });
      toast.success("OAuth app created");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create OAuth app";
      toast.error(message);
    },
  });
}

export function useUpdateOAuthApp(oauthAppSlug?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: UpdateOAuthAppRequest) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      return updateOAuthApp(selectedDeployment.id.toString(), oauthAppSlug, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-apps"] });
      toast.success("OAuth app updated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update OAuth app";
      toast.error(message);
    },
  });
}

export function useVerifyOAuthAppDomain(oauthAppSlug?: string) {
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async () => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      return verifyOAuthAppDomain(selectedDeployment.id.toString(), oauthAppSlug);
    },
  });
}

export function useUpdateOAuthScope(oauthAppSlug?: string, scope?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: UpdateOAuthScopeRequest) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!scope) throw new Error("Scope not selected");
      return updateOAuthScope(selectedDeployment.id.toString(), oauthAppSlug, scope, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-apps"] });
      toast.success("Scope updated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update scope";
      toast.error(message);
    },
  });
}

export function useArchiveOAuthScope(oauthAppSlug?: string, scope?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async () => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!scope) throw new Error("Scope not selected");
      return archiveOAuthScope(selectedDeployment.id.toString(), oauthAppSlug, scope);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-apps"] });
      toast.success("Scope archived");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to archive scope";
      toast.error(message);
    },
  });
}

export function useUnarchiveOAuthScope(oauthAppSlug?: string, scope?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async () => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!scope) throw new Error("Scope not selected");
      return unarchiveOAuthScope(selectedDeployment.id.toString(), oauthAppSlug, scope);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-apps"] });
      toast.success("Scope unarchived");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to unarchive scope";
      toast.error(message);
    },
  });
}

export function useSetOAuthScopeMapping(oauthAppSlug?: string, scope?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: SetOAuthScopeMappingRequest) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!scope) throw new Error("Scope not selected");
      return setOAuthScopeMapping(
        selectedDeployment.id.toString(),
        oauthAppSlug,
        scope,
        request,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-apps"] });
      toast.success("Scope mapping updated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update scope mapping";
      toast.error(message);
    },
  });
}

export function useOAuthClients(oauthAppSlug?: string) {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id?.toString();

  return useQuery({
    queryKey: ["oauth-clients", deploymentId, oauthAppSlug],
    queryFn: () => listOAuthClients(deploymentId!, oauthAppSlug!),
    enabled: !!deploymentId && !!oauthAppSlug,
  });
}

export function useCreateOAuthClient(oauthAppSlug?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: CreateOAuthClientRequest) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      return createOAuthClient(selectedDeployment.id.toString(), oauthAppSlug, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast.success("OAuth client created");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create OAuth client";
      toast.error(message);
    },
  });
}

export function useUpdateOAuthClient(oauthAppSlug?: string, oauthClientId?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (request: UpdateOAuthClientRequest) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!oauthClientId) throw new Error("OAuth client not selected");
      return updateOAuthClient(
        selectedDeployment.id.toString(),
        oauthAppSlug,
        oauthClientId,
        request,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast.success("OAuth client updated");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update OAuth client";
      toast.error(message);
    },
  });
}

export function useDeactivateOAuthClient(oauthAppSlug?: string, oauthClientId?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async () => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!oauthClientId) throw new Error("OAuth client not selected");
      return deactivateOAuthClient(selectedDeployment.id.toString(), oauthAppSlug, oauthClientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast.success("OAuth client deactivated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to deactivate OAuth client";
      toast.error(message);
    },
  });
}

export function useRotateOAuthClientSecret(oauthAppSlug?: string, oauthClientId?: string) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async () => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug) throw new Error("OAuth app not selected");
      if (!oauthClientId) throw new Error("OAuth client not selected");
      return rotateOAuthClientSecret(
        selectedDeployment.id.toString(),
        oauthAppSlug,
        oauthClientId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      toast.success("OAuth client secret rotated");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to rotate OAuth client secret";
      toast.error(message);
    },
  });
}

export function useOAuthGrants(
  oauthAppSlug?: string,
  oauthClientId?: string,
) {
  const { selectedDeployment } = useProjects();
  const deploymentId = selectedDeployment?.id?.toString();
  const enabled = !!deploymentId && !!oauthAppSlug && !!oauthClientId;

  return useQuery({
    queryKey: ["oauth-grants", deploymentId, oauthAppSlug, oauthClientId],
    queryFn: () =>
      listOAuthGrants(deploymentId!, oauthAppSlug!, oauthClientId!),
    enabled,
  });
}

export function useRevokeOAuthGrant(
  oauthAppSlug?: string,
  oauthClientId?: string,
) {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async (grantId: string) => {
      if (!selectedDeployment?.id) throw new Error("No deployment selected");
      if (!oauthAppSlug || !oauthClientId) {
        throw new Error("OAuth app and OAuth client are required");
      }
      return revokeOAuthGrant(
        selectedDeployment.id.toString(),
        oauthAppSlug,
        oauthClientId,
        grantId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oauth-grants"] });
      toast.success("OAuth grant revoked");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to revoke OAuth grant";
      toast.error(message);
    },
  });
}
