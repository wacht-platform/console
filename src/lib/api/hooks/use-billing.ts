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

export interface DodoProduct {
  id: number;
  plan_name: string;
  product_id: string;
  display_name: string;
  description: string;
  base_price_cents: number;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  billing_account_id: string;
  provider_customer_id: string;
  provider_subscription_id: string;
  product_id?: string;
  plan_name?: string;
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
  pulse_balance_cents: number;
  created_at?: string;
  updated_at?: string;
  subscription?: Subscription;
}

export interface CreateCheckoutRequest {
  plan_name: string;
  legal_name: string;
  billing_email: string;
  billing_phone?: string;
  tax_id?: string;
  return_url: string;
}

export interface CheckoutResponse {
  checkout_id: string;
  type: string;
  checkout_url: string;
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
export function useInvoices(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await apiClient.get("/billing/invoices");
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}


// Change subscription plan
export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPlanName: string) => {
      await apiClient.post("/billing/change-plan", { plan_name: newPlanName });
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
export function useUsageMetrics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["usage-metrics"],
    queryFn: async () => {
      const { data } = await apiClient.get<UsageResponse>("/billing/usage");
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
// Pulse Credits types
export interface PulseTransaction {
  id: string;
  billing_account_id: string;
  amount_pulse_cents: number;
  transaction_type: "purchase" | "usage_sms" | "usage_ai" | "refund" | "adjustment";
  reference_id?: string;
  created_at: string;
}

export interface BuyPulseRequest {
  pulse_amount: number;
  return_url: string;
}

// List available pulse products (denominations)
export function usePulseProducts() {
  return useQuery({
    queryKey: ["pulse-products"],
    queryFn: async () => {
      const { data } = await apiClient.get<DodoProduct[]>(`/billing/pulse/products`);
      return data;
    },
  });
}

// List pulse transactions
export function usePulseTransactions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["pulse-transactions"],
    queryFn: async () => {
      const { data } = await apiClient.get<PulseTransaction[]>(`/billing/pulse/transactions`);
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

// Buy pulse credits
export function useBuyPulse() {
  return useMutation({
    mutationFn: async (data: BuyPulseRequest) => {
      const { data: response } = await apiClient.post<CheckoutResponse>(
        `/billing/pulse/buy`,
        data,
      );
      return response;
    },
  });
}
