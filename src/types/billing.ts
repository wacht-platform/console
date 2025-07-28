export interface StripeAccount {
  id: string;
  stripe_account_id: string;
  account_type: 'express' | 'standard' | 'custom';
  charges_enabled: boolean;
  details_submitted: boolean;
  setup_completed_at?: string;
  dashboard_url?: string;
  country?: string;
  default_currency?: string;
  is_setup_complete: boolean;
}

export interface BillingPlan {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  stripe_price_id: string;
  billing_interval: 'month' | 'year' | 'week' | 'day';
  amount_cents: number;
  amount: number; // amount in currency units
  currency: string;
  trial_period_days?: number;
  usage_type?: 'licensed' | 'metered';
  features: Record<string, any>;
  is_active: boolean;
  display_order: number;
  is_trial_available: boolean;
  is_metered: boolean;
}

export interface Subscription {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  ended_at?: string;
  collection_method: 'charge_automatically' | 'send_invoice';
  customer_email?: string;
  customer_name?: string;
  metadata: Record<string, any>;
  billing_plan?: BillingPlan;
  // Computed fields
  is_active: boolean;
  is_in_trial: boolean;
  is_canceled: boolean;
  is_past_due: boolean;
  days_until_period_end: number;
  trial_days_remaining?: number;
}

export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount_due_cents: number;
  amount_due: number;
  amount_paid_cents: number;
  amount_paid: number;
  amount_remaining_cents: number;
  amount_remaining: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  invoice_pdf_url?: string;
  hosted_invoice_url?: string;
  invoice_number?: string;
  due_date?: string;
  paid_at?: string;
  period_start?: string;
  period_end?: string;
  attempt_count: number;
  next_payment_attempt?: string;
  metadata: Record<string, any>;
  // Computed fields
  is_paid: boolean;
  is_overdue: boolean;
  days_until_due?: number;
  is_partially_paid: boolean;
}

export interface PaymentMethod {
  id: string;
  created_at: string;
  updated_at: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  payment_method_type: 'card' | 'bank_account';
  is_default: boolean;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  bank_name?: string;
  bank_last4?: string;
  metadata: Record<string, any>;
  // Computed fields
  display_name: string;
  is_card: boolean;
  is_bank_account: boolean;
  is_expired: boolean;
  expires_soon: boolean;
}

export interface UsageRecord {
  id: string;
  created_at: string;
  metric_name: string;
  quantity: number;
  timestamp: string;
  stripe_usage_record_id?: string;
  billing_period_start: string;
  billing_period_end: string;
  metadata: Record<string, any>;
  // Computed fields
  is_in_current_billing_period: boolean;
  is_synced_to_stripe: boolean;
}

export interface UsageMetricSummary {
  metric_name: string;
  total_quantity: number;
  period_start: string;
  period_end: string;
  record_count: number;
  // Computed fields
  average_per_day: number;
  average_per_record: number;
}

export interface UsageSummary {
  deployment_id: string;
  period_start: string;
  period_end: string;
  metrics: UsageMetricSummary[];
  total_records: number;
}

export interface BillingDashboard {
  stripe_account?: StripeAccount;
  active_subscriptions: Subscription[];
  recent_invoices: Invoice[];
  billing_plans: BillingPlan[];
  payment_methods: PaymentMethod[];
  usage_summary?: UsageSummary;
}

// Request types
export interface InitiateStripeConnectRequest {
  account_type: 'express' | 'standard';
  country?: string;
  refresh_url?: string;
  return_url?: string;
}

export interface CreateBillingPlanRequest {
  name: string;
  description?: string;
  amount_cents: number;
  currency?: string;
  billing_interval: 'month' | 'year' | 'week' | 'day';
  trial_period_days?: number;
  usage_type?: 'licensed' | 'metered';
  features?: Record<string, any>;
  display_order?: number;
}

export interface UpdateBillingPlanRequest {
  name?: string;
  description?: string;
  trial_period_days?: number;
  features?: Record<string, any>;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateSubscriptionRequest {
  billing_plan_id: string;
  customer_email: string;
  customer_name?: string;
  payment_method_id?: string;
  trial_period_days?: number;
  collection_method?: 'charge_automatically' | 'send_invoice';
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  billing_plan_id?: string;
  cancel_at_period_end?: boolean;
  collection_method?: 'charge_automatically' | 'send_invoice';
  metadata?: Record<string, any>;
}

export interface CreatePaymentMethodRequest {
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  set_as_default?: boolean;
}

export interface RecordUsageRequest {
  metric_name: string;
  quantity: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface BillingListQuery {
  limit?: number;
  offset?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
}

export interface UsageQuery {
  metric_name?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

// Response types
export interface StripeConnectResponse {
  onboarding_url: string;
  account_id: string;
}