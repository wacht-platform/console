import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { apiClient } from "../client";
import type {
  BillingDashboard,
  StripeAccount,
  BillingPlan,
  Subscription,
  Invoice,
  PaymentMethod,
  UsageSummary,
  InitiateStripeConnectRequest,
  StripeConnectResponse,
  CreateBillingPlanRequest,
  UpdateBillingPlanRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CreatePaymentMethodRequest,
  RecordUsageRequest,
  BillingListQuery,
  UsageQuery,
} from "@/types/billing";
import type { PaginatedResponse } from "@/types/api";

// Stripe Connect hooks
export function useStripeAccount() {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["stripe-account", deploymentId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<StripeAccount>(
          `/deployments/${deploymentId}/billing/stripe/account`
        );
        return data;
      } catch (error: any) {
        // If 404, return null to indicate no account exists
        if (error.response?.status === 404) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    enabled: !!deploymentId,
  });
}

export function useInitiateStripeConnect() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: InitiateStripeConnectRequest) => {
      const { data } = await apiClient.post<StripeConnectResponse>(
        `/deployments/${deploymentId}/billing/stripe/connect`,
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe-account", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useDisconnectStripeAccount() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/deployments/${deploymentId}/billing/stripe/account`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripe-account", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useStripeDashboardUrl() {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["stripe-dashboard-url", deploymentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ dashboard_url: string }>(
        `/deployments/${deploymentId}/billing/stripe/dashboard-url`
      );
      return data;
    },
    enabled: !!deploymentId,
  });
}

// Billing Plans hooks
export function useBillingPlans(query?: BillingListQuery) {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["billing-plans", deploymentId, query],
    queryFn: async () => {
      const { data } = await apiClient.get<BillingPlan[]>(
        `/deployments/${deploymentId}/billing/plans`,
        { params: query }
      );
      return data;
    },
    enabled: !!deploymentId,
  });
}

export function useBillingPlan(planId: string) {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["billing-plan", deploymentId, planId],
    queryFn: async () => {
      const { data } = await apiClient.get<BillingPlan>(
        `/deployments/${deploymentId}/billing/plans/${planId}`
      );
      return data;
    },
    enabled: !!deploymentId && !!planId,
  });
}

export function useCreateBillingPlan() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: CreateBillingPlanRequest) => {
      const { data } = await apiClient.post<BillingPlan>(
        `/deployments/${deploymentId}/billing/plans`,
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-plans", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useUpdateBillingPlan(planId: string) {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: UpdateBillingPlanRequest) => {
      const { data } = await apiClient.patch<BillingPlan>(
        `/deployments/${deploymentId}/billing/plans/${planId}`,
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-plans", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-plan", deploymentId, planId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useDeleteBillingPlan(planId: string) {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/deployments/${deploymentId}/billing/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-plans", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

// Subscriptions hooks
export function useSubscriptions(query?: BillingListQuery) {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["subscriptions", deploymentId, query],
    queryFn: async () => {
      const { data } = await apiClient.get<Subscription[]>(
        `/deployments/${deploymentId}/billing/subscriptions`,
        { params: query }
      );
      return data;
    },
    enabled: !!deploymentId,
  });
}

export function useSubscription(subscriptionId: string) {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["subscription", deploymentId, subscriptionId],
    queryFn: async () => {
      const { data } = await apiClient.get<Subscription>(
        `/deployments/${deploymentId}/billing/subscriptions/${subscriptionId}`
      );
      return data;
    },
    enabled: !!deploymentId && !!subscriptionId,
  });
}

export function useCreateSubscription() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: CreateSubscriptionRequest) => {
      const { data } = await apiClient.post<Subscription>(
        `/deployments/${deploymentId}/billing/subscriptions`,
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useUpdateSubscription(subscriptionId: string) {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: UpdateSubscriptionRequest) => {
      const { data } = await apiClient.patch<Subscription>(
        `/deployments/${deploymentId}/billing/subscriptions/${subscriptionId}`,
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["subscription", deploymentId, subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useCancelSubscription(subscriptionId: string) {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/deployments/${deploymentId}/billing/subscriptions/${subscriptionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["subscription", deploymentId, subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

// Billing Dashboard hook
export function useBillingDashboard() {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["billing-dashboard", deploymentId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<BillingDashboard>(
          `/deployments/${deploymentId}/billing`
        );
        return data;
      } catch (error: any) {
        // If 404 or no Stripe account, return null
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!deploymentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage tracking hooks
export function useRecordUsage() {
  const { deploymentId } = useParams();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: RecordUsageRequest) => {
      const { data } = await apiClient.post(
        `/deployments/${deploymentId}/billing/usage`,
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usage-summary", deploymentId] });
      queryClient.invalidateQueries({ queryKey: ["billing-dashboard", deploymentId] });
    },
  });
}

export function useUsageSummary(query?: UsageQuery) {
  const { deploymentId } = useParams();
  
  return useQuery({
    queryKey: ["usage-summary", deploymentId, query],
    queryFn: async () => {
      const { data } = await apiClient.get<UsageSummary>(
        `/deployments/${deploymentId}/billing/usage`,
        { params: query }
      );
      return data;
    },
    enabled: !!deploymentId,
  });
}