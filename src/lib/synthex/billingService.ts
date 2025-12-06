/**
 * Synthex Billing Service
 * Handles subscription management, usage tracking, and entitlement checks
 * Phase B22: Synthex Plans, Billing & Entitlements Foundation
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =====================================================
// TYPES
// =====================================================

export interface SynthexPlan {
  id: string;
  code: 'FREE' | 'PRO' | 'AGENCY';
  name: string;
  description: string | null;
  monthly_price_cents: number;
  yearly_price_cents: number;
  features: string[];
  limits: PlanLimits;
  is_active: boolean;
}

export interface PlanLimits {
  max_contacts: number; // -1 = unlimited
  max_sends_per_month: number;
  max_ai_calls: number;
  max_campaigns: number;
  max_automations: number;
  max_team_members: number;
}

export interface SynthexSubscription {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'paused';
  billing_period: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  external_customer_id: string | null;
  external_subscription_id: string | null;
  plan?: SynthexPlan;
}

export interface UsageRecord {
  id: string;
  tenant_id: string;
  metric: UsageMetric;
  quantity: number;
  period_start: string;
  period_end: string;
  last_updated_at: string;
}

export type UsageMetric = 'emails_sent' | 'contacts' | 'ai_calls' | 'campaigns' | 'automations' | 'team_members';

export interface EntitlementCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  current?: number;
}

export interface UsageSummary {
  metric: UsageMetric;
  current: number;
  limit: number;
  percentage: number;
  unlimited: boolean;
}

// =====================================================
// PLAN MANAGEMENT
// =====================================================

/**
 * Get all available active plans
 */
export async function getAvailablePlans(): Promise<SynthexPlan[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_plans')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price_cents', { ascending: true });

  if (error) {
    console.error('[BillingService] Error fetching plans:', error);
    throw new Error(`Failed to fetch plans: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific plan by code
 */
export async function getPlanByCode(code: 'FREE' | 'PRO' | 'AGENCY'): Promise<SynthexPlan | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_plans')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[BillingService] Error fetching plan:', error);
    return null;
  }

  return data;
}

// =====================================================
// SUBSCRIPTION MANAGEMENT
// =====================================================

/**
 * Get tenant's current subscription with plan details
 */
export async function getTenantSubscription(tenantId: string): Promise<SynthexSubscription | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_subscriptions')
    .select(`
      *,
      plan:synthex_plans(*)
    `)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('[BillingService] Error fetching subscription:', error);
    return null;
  }

  return data;
}

/**
 * Update subscription plan (internal use - Stripe integration will handle this)
 */
export async function updateSubscriptionPlan(
  tenantId: string,
  planCode: 'FREE' | 'PRO' | 'AGENCY',
  billingPeriod: 'monthly' | 'yearly'
): Promise<SynthexSubscription | null> {
  const plan = await getPlanByCode(planCode);
  if (!plan) {
    throw new Error(`Plan ${planCode} not found`);
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_subscriptions')
    .update({
      plan_id: plan.id,
      billing_period: billingPeriod,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('[BillingService] Error updating subscription:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  return data;
}

/**
 * Cancel subscription (mark for cancellation at period end)
 */
export async function cancelSubscription(tenantId: string): Promise<void> {
  const subscription = await getTenantSubscription(tenantId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const { error } = await supabaseAdmin
    .from('synthex_subscriptions')
    .update({
      cancel_at: subscription.current_period_end,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[BillingService] Error canceling subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

// =====================================================
// USAGE TRACKING
// =====================================================

/**
 * Get current usage period (monthly)
 */
function getCurrentPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Record usage for a metric (upsert)
 */
export async function recordUsage(
  tenantId: string,
  metric: UsageMetric,
  quantity: number
): Promise<void> {
  const period = getCurrentPeriod();

  const { error } = await supabaseAdmin
    .from('synthex_usage_records')
    .upsert(
      {
        tenant_id: tenantId,
        metric,
        quantity,
        period_start: period.start,
        period_end: period.end,
        last_updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'tenant_id,metric,period_start,period_end',
      }
    );

  if (error) {
    console.error('[BillingService] Error recording usage:', error);
    throw new Error(`Failed to record usage: ${error.message}`);
  }
}

/**
 * Increment usage for a metric
 */
export async function incrementUsage(
  tenantId: string,
  metric: UsageMetric,
  amount: number = 1
): Promise<void> {
  const period = getCurrentPeriod();

  // Get current usage
  const { data: existing } = await supabaseAdmin
    .from('synthex_usage_records')
    .select('quantity')
    .eq('tenant_id', tenantId)
    .eq('metric', metric)
    .eq('period_start', period.start)
    .eq('period_end', period.end)
    .single();

  const newQuantity = (existing?.quantity || 0) + amount;
  await recordUsage(tenantId, metric, newQuantity);
}

/**
 * Get current usage for a metric
 */
export async function getUsage(
  tenantId: string,
  metric: UsageMetric
): Promise<number> {
  const period = getCurrentPeriod();

  const { data, error } = await supabaseAdmin
    .from('synthex_usage_records')
    .select('quantity')
    .eq('tenant_id', tenantId)
    .eq('metric', metric)
    .eq('period_start', period.start)
    .eq('period_end', period.end)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('[BillingService] Error fetching usage:', error);
    return 0;
  }

  return data?.quantity || 0;
}

/**
 * Get usage summary for all metrics
 */
export async function getUsageSummary(tenantId: string): Promise<UsageSummary[]> {
  const subscription = await getTenantSubscription(tenantId);
  if (!subscription?.plan) {
    return [];
  }

  const limits = subscription.plan.limits as PlanLimits;
  const metrics: UsageMetric[] = ['emails_sent', 'contacts', 'ai_calls', 'campaigns', 'automations', 'team_members'];

  const summaries = await Promise.all(
    metrics.map(async (metric) => {
      const current = await getUsage(tenantId, metric);
      const limit = getLimitForMetric(limits, metric);
      const unlimited = limit === -1;
      const percentage = unlimited ? 0 : Math.min(100, (current / limit) * 100);

      return {
        metric,
        current,
        limit,
        percentage,
        unlimited,
      };
    })
  );

  return summaries;
}

// =====================================================
// ENTITLEMENT CHECKS
// =====================================================

/**
 * Get limit value for a specific metric
 */
function getLimitForMetric(limits: PlanLimits, metric: UsageMetric): number {
  switch (metric) {
    case 'emails_sent':
      return limits.max_sends_per_month;
    case 'contacts':
      return limits.max_contacts;
    case 'ai_calls':
      return limits.max_ai_calls;
    case 'campaigns':
      return limits.max_campaigns;
    case 'automations':
      return limits.max_automations;
    case 'team_members':
      return limits.max_team_members;
    default:
      return 0;
  }
}

/**
 * Check if tenant can perform an action based on their plan
 */
export async function checkEntitlement(
  tenantId: string,
  metric: UsageMetric,
  requestedAmount: number = 1
): Promise<EntitlementCheck> {
  // Get subscription and plan
  const subscription = await getTenantSubscription(tenantId);

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No active subscription found',
    };
  }

  if (!subscription.plan) {
    return {
      allowed: false,
      reason: 'No plan associated with subscription',
    };
  }

  // Check subscription status
  if (subscription.status === 'canceled' || subscription.status === 'past_due') {
    return {
      allowed: false,
      reason: `Subscription is ${subscription.status}`,
    };
  }

  // Get plan limits
  const limits = subscription.plan.limits as PlanLimits;
  const limit = getLimitForMetric(limits, metric);

  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      remaining: -1,
      unlimited: true,
    } as any;
  }

  // Get current usage
  const current = await getUsage(tenantId, metric);
  const remaining = limit - current;

  // Check if request would exceed limit
  if (current + requestedAmount > limit) {
    return {
      allowed: false,
      reason: `${metric} limit reached (${current}/${limit})`,
      limit,
      current,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    limit,
    current,
    remaining,
  };
}

/**
 * Check if tenant can send emails
 */
export async function canSendEmail(tenantId: string, count: number = 1): Promise<EntitlementCheck> {
  return checkEntitlement(tenantId, 'emails_sent', count);
}

/**
 * Check if tenant can add contacts
 */
export async function canAddContacts(tenantId: string, count: number = 1): Promise<EntitlementCheck> {
  return checkEntitlement(tenantId, 'contacts', count);
}

/**
 * Check if tenant can make AI calls
 */
export async function canMakeAICall(tenantId: string, count: number = 1): Promise<EntitlementCheck> {
  return checkEntitlement(tenantId, 'ai_calls', count);
}

/**
 * Check if tenant can create campaigns
 */
export async function canCreateCampaign(tenantId: string): Promise<EntitlementCheck> {
  return checkEntitlement(tenantId, 'campaigns', 1);
}

/**
 * Check if tenant can create automations
 */
export async function canCreateAutomation(tenantId: string): Promise<EntitlementCheck> {
  return checkEntitlement(tenantId, 'automations', 1);
}

/**
 * Check if tenant can add team members
 */
export async function canAddTeamMember(tenantId: string): Promise<EntitlementCheck> {
  return checkEntitlement(tenantId, 'team_members', 1);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format price in cents to dollars
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;
  return Math.round((savings / monthlyTotal) * 100);
}

/**
 * Get friendly metric name
 */
export function getMetricName(metric: UsageMetric): string {
  const names: Record<UsageMetric, string> = {
    emails_sent: 'Emails Sent',
    contacts: 'Contacts',
    ai_calls: 'AI Calls',
    campaigns: 'Campaigns',
    automations: 'Automations',
    team_members: 'Team Members',
  };
  return names[metric] || metric;
}
