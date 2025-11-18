import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface BillingAccount {
  id: string;
  owner_id: string;
  owner_type: string;
  legal_name: string;
  tax_id?: string;
  billing_email: string;
  billing_phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  payment_method_status?: string;
  currency: string;
  locale: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  billing_account_id: string;
  chargebee_customer_id: string;
  chargebee_subscription_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface BillingAccountWithSubscription {
  id: string;
  owner_id: string;
  owner_type: string;
  legal_name: string;
  tax_id?: string;
  billing_email: string;
  billing_phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  status: string;
  payment_method_status?: string;
  currency: string;
  locale: string;
  created_at?: string;
  updated_at?: string;
  subscription?: Subscription;
}

export interface CreateCheckoutRequest {
  plan_id: string;
  legal_name: string;
  billing_email: string;
  billing_phone?: string;
  tax_id?: string;
}

export interface CheckoutResponse {
  id: string;
  type: string;
  url: string;
  state: string;
  embed?: boolean;
  created_at?: number;
  expires_at?: number;
}

export interface PortalResponse {
  portal_url: string;
}

// Get billing account (uses auth context - no user ID needed)
export function useBillingAccount() {
  return useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      const { data } =
        await apiClient.get<BillingAccountWithSubscription | null>(`/billing`);
      return data;
    },
  });
}

// Create checkout session
export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCheckoutRequest) => {
      const { data: response } = await apiClient.post<CheckoutResponse>(
        `/billing/checkout`,
        data,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

// Get customer portal URL
export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get<PortalResponse>(`/billing/portal`);
      return data;
    },
  });
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`/billing/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

// Get invoices list
export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await apiClient.get("/billing/invoices");
      return response.data;
    },
  });
}

// Get single invoice
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: async () => {
      const response = await apiClient.get(`/billing/invoices/${invoiceId}`);
      return response.data;
    },
    enabled: !!invoiceId,
  });
}

// Change subscription plan
export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPlanId: string) => {
      await apiClient.post("/billing/change-plan", { new_plan_id: newPlanId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

// Usage metrics types
export interface UsageSnapshot {
  metric_name: string;
  quantity: number;
  cost_cents?: number;
}

export interface UsageResponse {
  snapshots: UsageSnapshot[];
  billing_period: string;
}

// Get current usage metrics
export function useUsageMetrics() {
  return useQuery({
    queryKey: ["usage-metrics"],
    queryFn: async () => {
      const { data } = await apiClient.get<UsageResponse>("/billing/usage");
      return data;
    },
  });
}
