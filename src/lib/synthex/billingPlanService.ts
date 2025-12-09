/**
 * Synthex Billing Plan Service
 * Phase B33: Billing, Plans, and Usage Metering Engine
 *
 * Works with synthex_billing_plans, synthex_subscriptions, synthex_usage_meters
 * from migration 439. Extends existing billingService.ts functionality.
 */

import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// Types
// =====================================================

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  currency: string;
  limits: PlanLimits;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  ai_tokens: number;
  emails_sent: number;
  contacts: number;
  campaigns: number;
  events: number;
  api_calls: number;
  team_members: number;
  [key: string]: number;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancel_at?: string;
  canceled_at?: string;
  external_customer_id?: string;
  external_subscription_id?: string;
  payment_method?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  plan?: BillingPlan;
}

export interface UsageMeter {
  id: string;
  tenant_id: string;
  metric: string;
  quantity: number;
  period_start: string;
  period_end: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UsageSummaryItem {
  metric: string;
  used: number;
  limit: number;
  percentage: number;
  unlimited: boolean;
}

export interface UsageWarning {
  metric: string;
  level: 'warning' | 'critical' | 'exceeded';
  message: string;
  used: number;
  limit: number;
  percentage: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  subscription_id?: string;
  invoice_number?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  period_start?: string;
  period_end?: string;
  due_date?: string;
  paid_at?: string;
  external_invoice_id?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Plan Management
// =====================================================

/**
 * Get all available active plans
 */
export async function getAvailablePlans(): Promise<BillingPlan[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_billing_plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[BillingPlanService] Error fetching plans:', error);
    throw new Error(`Failed to fetch plans: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a plan by code
 */
export async function getPlanByCode(code: string): Promise<BillingPlan | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_billing_plans')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  return data;
}

/**
 * Get a plan by ID
 */
export async function getPlanById(planId: string): Promise<BillingPlan | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_billing_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  return data;
}

// =====================================================
// Subscription Management
// =====================================================

/**
 * Get tenant's current subscription with plan details
 */
export async function getTenantSubscription(tenantId: string): Promise<Subscription | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_subscriptions')
    .select(`
      *,
      plan:synthex_billing_plans(*)
    `)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    console.error('[BillingPlanService] Error fetching subscription:', error);
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }

  return data;
}

/**
 * Create or update a subscription
 */
export async function upsertSubscription(
  tenantId: string,
  planCode: string,
  externalIds?: {
    customerId?: string;
    subscriptionId?: string;
  }
): Promise<Subscription> {
  const supabase = supabaseAdmin;

  const plan = await getPlanByCode(planCode);
  if (!plan) {
    throw new Error(`Plan ${planCode} not found`);
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from('synthex_subscriptions')
    .upsert(
      {
        tenant_id: tenantId,
        plan_id: plan.id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        external_customer_id: externalIds?.customerId,
        external_subscription_id: externalIds?.subscriptionId,
        metadata: {},
      },
      {
        onConflict: 'tenant_id',
      }
    )
    .select(`
      *,
      plan:synthex_billing_plans(*)
    `)
    .single();

  if (error) {
    console.error('[BillingPlanService] Error upserting subscription:', error);
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }

  return data;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  tenantId: string,
  immediately: boolean = false
): Promise<Subscription> {
  const supabase = supabaseAdmin;

  const subscription = await getTenantSubscription(tenantId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    cancel_at: immediately ? now : subscription.current_period_end,
    canceled_at: now,
  };

  if (immediately) {
    updateData.status = 'canceled';
  }

  const { data, error } = await supabase
    .from('synthex_subscriptions')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .select(`
      *,
      plan:synthex_billing_plans(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }

  return data;
}

// =====================================================
// Usage Metering
// =====================================================

/**
 * Record usage for a metric
 */
export async function recordUsage(
  tenantId: string,
  metric: string,
  quantity: number,
  periodStart?: Date,
  periodEnd?: Date
): Promise<UsageMeter> {
  const supabase = supabaseAdmin;

  const now = new Date();
  const start = periodStart || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('synthex_usage_meters')
    .upsert(
      {
        tenant_id: tenantId,
        metric,
        quantity,
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        metadata: {},
      },
      {
        onConflict: 'tenant_id,metric,period_start',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[BillingPlanService] Error recording usage:', error);
    throw new Error(`Failed to record usage: ${error.message}`);
  }

  return data;
}

/**
 * Increment usage for a metric
 */
export async function incrementUsage(
  tenantId: string,
  metric: string,
  amount: number = 1
): Promise<UsageMeter> {
  const supabase = supabaseAdmin;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get current usage
  const { data: existing } = await supabase
    .from('synthex_usage_meters')
    .select('quantity')
    .eq('tenant_id', tenantId)
    .eq('metric', metric)
    .eq('period_start', periodStart.toISOString())
    .single();

  const newQuantity = (existing?.quantity || 0) + amount;

  return recordUsage(tenantId, metric, newQuantity, periodStart, periodEnd);
}

/**
 * Get usage summary for a tenant
 */
export async function getUsageSummary(
  tenantId: string,
  periodRange?: { start?: Date; end?: Date }
): Promise<UsageSummaryItem[]> {
  const supabase = supabaseAdmin;

  const now = new Date();
  const periodStart = periodRange?.start || new Date(now.getFullYear(), now.getMonth(), 1);

  // Get subscription with plan limits
  const subscription = await getTenantSubscription(tenantId);
  const limits = (subscription?.plan?.limits || {}) as PlanLimits;

  // Get usage for period
  const { data: usageData, error } = await supabase
    .from('synthex_usage_meters')
    .select('metric, quantity')
    .eq('tenant_id', tenantId)
    .gte('period_start', periodStart.toISOString());

  if (error) {
    console.error('[BillingPlanService] Error fetching usage:', error);
    throw new Error(`Failed to fetch usage: ${error.message}`);
  }

  // Aggregate usage by metric
  const usageByMetric: Record<string, number> = {};
  (usageData || []).forEach((record: { metric: string; quantity: number }) => {
    usageByMetric[record.metric] = (usageByMetric[record.metric] || 0) + record.quantity;
  });

  // Build summary for all metrics
  const metrics = [
    'ai_tokens',
    'emails_sent',
    'contacts',
    'campaigns',
    'events',
    'api_calls',
    'team_members',
  ];

  return metrics.map((metric) => {
    const used = usageByMetric[metric] || 0;
    const limit = limits[metric] ?? -1;
    const unlimited = limit === -1;
    const percentage = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

    return {
      metric,
      used,
      limit,
      percentage,
      unlimited,
    };
  });
}

/**
 * Classify usage against limits and return warnings
 */
export async function classifyUsageAgainstLimits(tenantId: string): Promise<UsageWarning[]> {
  const summary = await getUsageSummary(tenantId);
  const warnings: UsageWarning[] = [];

  summary.forEach((item) => {
    if (item.unlimited) {
return;
}

    const metricLabel = getMetricLabel(item.metric);

    if (item.percentage >= 100) {
      warnings.push({
        metric: item.metric,
        level: 'exceeded',
        message: `${metricLabel} limit exceeded (${item.used.toLocaleString()}/${item.limit.toLocaleString()})`,
        used: item.used,
        limit: item.limit,
        percentage: item.percentage,
      });
    } else if (item.percentage >= 90) {
      warnings.push({
        metric: item.metric,
        level: 'critical',
        message: `${metricLabel} approaching limit (${item.percentage}% used)`,
        used: item.used,
        limit: item.limit,
        percentage: item.percentage,
      });
    } else if (item.percentage >= 75) {
      warnings.push({
        metric: item.metric,
        level: 'warning',
        message: `${metricLabel} at ${item.percentage}% of limit`,
        used: item.used,
        limit: item.limit,
        percentage: item.percentage,
      });
    }
  });

  return warnings;
}

// =====================================================
// Invoice Management
// =====================================================

/**
 * Get invoices for a tenant
 */
export async function getInvoices(
  tenantId: string,
  options?: { status?: string; limit?: number }
): Promise<Invoice[]> {
  const supabase = supabaseAdmin;

  let query = supabase
    .from('synthex_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }

  return data || [];
}

/**
 * Create an invoice
 */
export async function createInvoice(
  tenantId: string,
  data: {
    amount: number;
    currency?: string;
    period_start?: string;
    period_end?: string;
    due_date?: string;
    line_items?: Invoice['line_items'];
  }
): Promise<Invoice> {
  const supabase = supabaseAdmin;

  const subscription = await getTenantSubscription(tenantId);

  const { data: invoice, error } = await supabase
    .from('synthex_invoices')
    .insert({
      tenant_id: tenantId,
      subscription_id: subscription?.id,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: 'draft',
      period_start: data.period_start,
      period_end: data.period_end,
      due_date: data.due_date,
      line_items: data.line_items || [],
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invoice: ${error.message}`);
  }

  return invoice;
}

// =====================================================
// Helpers
// =====================================================

/**
 * Get friendly label for a metric
 */
export function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    ai_tokens: 'AI Tokens',
    emails_sent: 'Emails Sent',
    contacts: 'Contacts',
    campaigns: 'Campaigns',
    events: 'Events Tracked',
    api_calls: 'API Calls',
    team_members: 'Team Members',
  };
  return labels[metric] || metric;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavings(
  monthlyPrice: number,
  yearlyPrice: number
): number {
  const monthlyTotal = monthlyPrice * 12;
  if (monthlyTotal === 0) {
return 0;
}
  const savings = monthlyTotal - yearlyPrice;
  return Math.round((savings / monthlyTotal) * 100);
}

// =====================================================
// Stripe Integration Placeholder
// =====================================================

/**
 * Create Stripe checkout session
 * TODO: Implement when STRIPE_SECRET_KEY is configured
 */
export async function createCheckoutSession(
  tenantId: string,
  planCode: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string } | { error: string }> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    console.warn('[BillingPlanService] Stripe not configured');
    return {
      error: 'Billing provider not configured. Please contact support.',
    };
  }

  // TODO: Implement Stripe checkout session creation
  // const stripe = new Stripe(stripeKey);
  // const plan = await getPlanByCode(planCode);
  // const session = await stripe.checkout.sessions.create({...});
  // return { url: session.url };

  return {
    error: 'Stripe integration pending implementation',
  };
}

/**
 * Handle Stripe webhook
 * TODO: Implement when STRIPE_SECRET_KEY is configured
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ received: boolean }> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.warn('[BillingPlanService] Stripe webhook not configured');
    return { received: false };
  }

  // TODO: Implement webhook handling
  // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  // switch (event.type) { ... }

  return { received: true };
}
