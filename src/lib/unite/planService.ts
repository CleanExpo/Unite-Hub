/**
 * Plan Service
 * Phase: D65 - Plans, Pricing & Quota Enforcement
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// PLANS
// ============================================================================

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  billing_interval: string;
  currency: string;
  base_price: number;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function createPlan(
  input: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
): Promise<Plan> {
  const { data, error } = await supabaseAdmin
    .from('unite_plans')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create plan: ${error.message}`);
  return data as Plan;
}

export async function listPlans(filters?: {
  category?: string;
  is_active?: boolean;
  limit?: number;
}): Promise<Plan[]> {
  let query = supabaseAdmin
    .from('unite_plans')
    .select('*')
    .order('display_order')
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list plans: ${error.message}`);
  return data as Plan[];
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_plans')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to get plan: ${error.message}`);
  return data as Plan | null;
}

export async function updatePlan(planId: string, updates: Partial<Plan>): Promise<Plan> {
  const { data, error } = await supabaseAdmin
    .from('unite_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update plan: ${error.message}`);
  return data as Plan;
}

// ============================================================================
// PLAN FEATURES
// ============================================================================

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  name: string;
  description?: string;
  limit_value?: number;
  limit_unit?: string;
  soft_limit: boolean;
  overage_rate?: number;
  metadata?: Record<string, unknown>;
}

export async function createFeature(input: Omit<PlanFeature, 'id'>): Promise<PlanFeature> {
  const { data, error } = await supabaseAdmin
    .from('unite_plan_features')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create feature: ${error.message}`);
  return data as PlanFeature;
}

export async function listFeatures(planId: string): Promise<PlanFeature[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_plan_features')
    .select('*')
    .eq('plan_id', planId)
    .order('feature_key');

  if (error) throw new Error(`Failed to list features: ${error.message}`);
  return data as PlanFeature[];
}

// ============================================================================
// TENANT SUBSCRIPTIONS
// ============================================================================

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  external_customer_id?: string;
  external_subscription_id?: string;
  status: string;
  starts_at: string;
  renews_at?: string;
  cancels_at?: string;
  trial_ends_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createSubscription(
  tenantId: string,
  input: Omit<TenantSubscription, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<TenantSubscription> {
  const { data, error } = await supabaseAdmin
    .from('unite_tenant_subscriptions')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create subscription: ${error.message}`);
  return data as TenantSubscription;
}

export async function getActiveSubscription(
  tenantId: string
): Promise<TenantSubscription | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116')
    throw new Error(`Failed to get subscription: ${error.message}`);
  return data as TenantSubscription | null;
}

export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<TenantSubscription>
): Promise<TenantSubscription> {
  const { data, error } = await supabaseAdmin
    .from('unite_tenant_subscriptions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', subscriptionId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update subscription: ${error.message}`);
  return data as TenantSubscription;
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAt?: string
): Promise<TenantSubscription> {
  return updateSubscription(subscriptionId, {
    status: 'canceled',
    cancels_at: cancelAt || new Date().toISOString(),
  });
}
