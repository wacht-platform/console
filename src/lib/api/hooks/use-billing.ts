import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface Subscription {
  id: string;
  user_id: string;
  chargebee_customer_id: string;
  chargebee_subscription_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCheckoutRequest {
  plan_id: string;
  email: string;
  name?: string;
  user_id: number;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface PortalResponse {
  portal_url: string;
}

// Get subscription for a specific user
export function useSubscription(userId?: string) {
  return useQuery({
    queryKey: ["subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await apiClient.get<Subscription>(
        `/billing/users/${userId}/subscription`
      );
      return data;
    },
    enabled: !!userId,
  });
}

// Create checkout session
export function useCreateCheckout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCheckoutRequest) => {
      const { data: response } = await apiClient.post<CheckoutResponse>(
        `/billing/checkout`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}

// Get customer portal URL
export function useCustomerPortal(userId?: string) {
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID required");
      const { data } = await apiClient.get<PortalResponse>(
        `/billing/users/${userId}/portal`
      );
      return data;
    },
  });
}

// Cancel subscription
export function useCancelSubscription(userId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User ID required");
      await apiClient.post(`/billing/users/${userId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
    },
  });
}