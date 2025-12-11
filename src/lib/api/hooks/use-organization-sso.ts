import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/api/client";
import { useProjects } from "./use-projects";

export interface OrganizationDomain {
    id: string;
    organization_id: string;
    fqdn: string;
    verified: boolean;
    verification_token?: string;
    verification_dns_record_type?: string;
    verification_dns_record_name?: string;
    verification_dns_record_data?: string;
    verification_attempts: number;
    created_at: string;
    updated_at: string;
}

export interface EnterpriseConnection {
    id: string;
    organization_id: string;
    domain_id?: string;
    protocol: "saml" | "oidc";
    // SAML fields
    idp_entity_id?: string;
    idp_sso_url?: string;
    idp_certificate?: string;
    // OIDC fields
    oidc_client_id?: string;
    oidc_issuer_url?: string;
    oidc_scopes?: string;
    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface CreateDomainRequest {
    fqdn: string;
}

export interface CreateConnectionRequest {
    domain_id?: string;
    protocol: "saml" | "oidc";
    // SAML fields
    idp_entity_id?: string;
    idp_sso_url?: string;
    idp_certificate?: string;
    // OIDC fields
    oidc_client_id?: string;
    oidc_client_secret?: string;
    oidc_issuer_url?: string;
    oidc_scopes?: string;
}

export interface UpdateConnectionRequest {
    // SAML fields
    idp_entity_id?: string;
    idp_sso_url?: string;
    idp_certificate?: string;
    // OIDC fields
    oidc_client_id?: string;
    oidc_client_secret?: string;
    oidc_issuer_url?: string;
    oidc_scopes?: string;
}

interface PaginatedResponse<T> {
    data: T[];
    has_more: boolean;
    limit?: number;
    offset?: number;
}

// --- Domains ---

export function useOrganizationDomains(organizationId: string) {
    const { selectedDeployment } = useProjects();

    return useQuery({
        queryKey: ["organization-domains", selectedDeployment?.id, organizationId],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<OrganizationDomain>>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/domains`
            );
            return data.data; // Extract the data array from paginated response
        },
        enabled: !!selectedDeployment?.id && !!organizationId,
    });
}

export function useCreateOrganizationDomain() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            data,
        }: {
            organizationId: string;
            data: CreateDomainRequest;
        }) => {
            const { data: response } = await api.post<{
                domain: OrganizationDomain;
                verification_token: string;
            }>(`/deployments/${selectedDeployment!.id}/organizations/${organizationId}/domains`, data);
            return response;
        },
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-domains", selectedDeployment?.id, organizationId],
            });
        },
    });
}

export function useDeleteOrganizationDomain() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            domainId,
        }: {
            organizationId: string;
            domainId: string;
        }) => {
            await api.delete(`/deployments/${selectedDeployment!.id}/organizations/${organizationId}/domains/${domainId}`);
        },
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-domains", selectedDeployment?.id, organizationId],
            });
        },
    });
}

export function useVerifyOrganizationDomain() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            domainId,
        }: {
            organizationId: string;
            domainId: string;
        }) => {
            const { data } = await api.post<{ verified: boolean; message?: string }>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/domains/${domainId}/verify`
            );
            return data;
        },
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-domains", selectedDeployment?.id, organizationId],
            });
        },
    });
}

// --- Connections ---

export function useOrganizationConnections(organizationId: string) {
    const { selectedDeployment } = useProjects();

    return useQuery({
        queryKey: ["organization-connections", selectedDeployment?.id, organizationId],
        queryFn: async () => {
            const { data } = await api.get<PaginatedResponse<EnterpriseConnection>>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections`
            );
            return data.data; // Extract the data array from paginated response
        },
        enabled: !!selectedDeployment?.id && !!organizationId,
    });
}

export function useCreateEnterpriseConnection() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            data,
        }: {
            organizationId: string;
            data: CreateConnectionRequest;
        }) => {
            const { data: response } = await api.post<EnterpriseConnection>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections`,
                data
            );
            return response;
        },
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-connections", selectedDeployment?.id, organizationId],
            });
        },
    });
}

export function useUpdateEnterpriseConnection() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            connectionId,
            data,
        }: {
            organizationId: string;
            connectionId: string;
            data: UpdateConnectionRequest;
        }) => {
            const { data: response } = await api.post<EnterpriseConnection>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections/${connectionId}`,
                data
            );
            return response;
        },
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-connections", selectedDeployment?.id, organizationId],
            });
        },
    });
}

export function useDeleteEnterpriseConnection() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            connectionId,
        }: {
            organizationId: string;
            connectionId: string;
        }) => {
            await api.delete(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections/${connectionId}`
            );
        },
        onSuccess: (_, { organizationId }) => {
            queryClient.invalidateQueries({
                queryKey: ["organization-connections", selectedDeployment?.id, organizationId],
            });
        },
    });
}

// --- SCIM Token Management ---

export interface SCIMTokenInfo {
    exists: boolean;
    scim_base_url: string;
    token?: {
        token?: string;
        token_prefix: string;
        enabled: boolean;
        created_at: string;
        updated_at: string;
        last_used_at?: string;
    };
}

export function useSCIMToken(organizationId: string, connectionId: string) {
    const { selectedDeployment } = useProjects();

    return useQuery({
        queryKey: ["scim-token", selectedDeployment?.id, organizationId, connectionId],
        queryFn: async () => {
            const { data } = await api.get<SCIMTokenInfo>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections/${connectionId}/scim-token`
            );
            return data;
        },
        enabled: !!selectedDeployment?.id && !!organizationId && !!connectionId,
    });
}

export function useGenerateSCIMToken() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            connectionId,
        }: {
            organizationId: string;
            connectionId: string;
        }) => {
            const { data } = await api.post<SCIMTokenInfo>(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections/${connectionId}/scim-token`
            );
            return data;
        },
        onSuccess: (_, { organizationId, connectionId }) => {
            queryClient.invalidateQueries({
                queryKey: ["scim-token", selectedDeployment?.id, organizationId, connectionId],
            });
        },
    });
}

export function useRevokeSCIMToken() {
    const queryClient = useQueryClient();
    const { selectedDeployment } = useProjects();

    return useMutation({
        mutationFn: async ({
            organizationId,
            connectionId,
        }: {
            organizationId: string;
            connectionId: string;
        }) => {
            await api.delete(
                `/deployments/${selectedDeployment!.id}/organizations/${organizationId}/connections/${connectionId}/scim-token`
            );
        },
        onSuccess: (_, { organizationId, connectionId }) => {
            queryClient.invalidateQueries({
                queryKey: ["scim-token", selectedDeployment?.id, organizationId, connectionId],
            });
        },
    });
}
