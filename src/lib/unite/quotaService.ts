/**
 * Quota Service
 * Phase: D65 - Plans, Pricing & Quota Enforcement
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getActiveSubscription, listFeatures } from './planService';

export interface QuotaSnapshot {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  feature_key: string;
  used_value: number;
  limit_value?: number;
  limit_unit?: string;
  overage_value: number;
  overage_cost: number;
  status: string;
  metadata?: Record<string, unknown>;
  computed_at: string;
}

export async function createQuotaSnapshot(
  tenantId: string,
  input: Omit<QuotaSnapshot, 'id' | 'tenant_id' | 'computed_at'>
): Promise<QuotaSnapshot> {
  const { data, error } = await supabaseAdmin
    .from('unite_quota_snapshots')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create quota snapshot: ${error.message}`);
  return data as QuotaSnapshot;
}

export async function listQuotaSnapshots(
  tenantId: string,
  filters?: {
    feature_key?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<QuotaSnapshot[]> {
  let query = supabaseAdmin
    .from('unite_quota_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('period_start', { ascending: false });

  if (filters?.feature_key) query = query.eq('feature_key', filters.feature_key);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.start_date) query = query.gte('period_start', filters.start_date);
  if (filters?.end_date) query = query.lte('period_start', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list quota snapshots: ${error.message}`);
  return data as QuotaSnapshot[];
}

/**
 * Check if tenant has exceeded quota for a feature
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function checkQuota(
  tenantId: string,
  featureKey: string,
  increment: number = 0
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number | null;
  soft_limit: boolean;
  overage_rate: number | null;
}> {
  try {
    // Get active subscription
    const subscription = await getActiveSubscription(tenantId);
    if (!subscription) {
      // No subscription = permissive default with warning
      console.warn(`[Quota] No active subscription for tenant ${tenantId}, allowing by default`);
      return {
        allowed: true,
        remaining: Infinity,
        limit: null,
        soft_limit: true,
        overage_rate: null,
      };
    }

    // Get plan features
    const features = await listFeatures(subscription.plan_id);
    const feature = features.find((f) => f.feature_key === featureKey);

    if (!feature || feature.limit_value === null || feature.limit_value === undefined) {
      // Feature not configured = permissive default
      console.warn(
        `[Quota] Feature ${featureKey} not configured for plan, allowing by default`
      );
      return {
        allowed: true,
        remaining: Infinity,
        limit: null,
        soft_limit: true,
        overage_rate: null,
      };
    }

    // Get current usage from daily rollup
    const periodStart = new Date();
    periodStart.setDate(1); // Start of current month
    const periodStartStr = periodStart.toISOString().split('T')[0];

    const { data: dailyUsage } = await supabaseAdmin
      .from('unite_usage_cost_daily')
      .select('usage_value')
      .eq('tenant_id', tenantId)
      .eq('dimension_key', featureKey)
      .gte('date', periodStartStr);

    const usedValue =
      dailyUsage?.reduce((sum, d) => sum + (d.usage_value || 0), 0) || 0;
    const totalUsed = usedValue + increment;
    const limit = feature.limit_value;
    const remaining = Math.max(0, limit - totalUsed);

    // Check if allowed
    const allowed = feature.soft_limit || totalUsed <= limit;

    return {
      allowed,
      remaining,
      limit,
      soft_limit: feature.soft_limit,
      overage_rate: feature.overage_rate || null,
    };
  } catch (error) {
    // On error, default to permissive with warning
    console.error(`[Quota] Error checking quota for ${featureKey}:`, error);
    return {
      allowed: true,
      remaining: 0,
      limit: null,
      soft_limit: true,
      overage_rate: null,
    };
  }
}

/**
 * Compute quota snapshot for current month
 */
export async function computeMonthlyQuota(tenantId: string): Promise<number> {
  const subscription = await getActiveSubscription(tenantId);
  if (!subscription) return 0;

  const features = await listFeatures(subscription.plan_id);

  const periodStart = new Date();
  periodStart.setDate(1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  periodEnd.setDate(0); // Last day of month

  const periodStartStr = periodStart.toISOString().split('T')[0];
  const periodEndStr = periodEnd.toISOString().split('T')[0];

  // Delete existing snapshots for this period
  await supabaseAdmin
    .from('unite_quota_snapshots')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('period_start', periodStartStr);

  // Get usage for each feature
  const snapshots = await Promise.all(
    features.map(async (feature) => {
      const { data: dailyUsage } = await supabaseAdmin
        .from('unite_usage_cost_daily')
        .select('usage_value')
        .eq('tenant_id', tenantId)
        .eq('dimension_key', feature.feature_key)
        .gte('date', periodStartStr)
        .lte('date', periodEndStr);

      const usedValue =
        dailyUsage?.reduce((sum, d) => sum + (d.usage_value || 0), 0) || 0;
      const limit = feature.limit_value || 0;
      const overage = feature.soft_limit ? 0 : Math.max(0, usedValue - limit);
      const overageCost = overage * (feature.overage_rate || 0);

      let status = 'ok';
      if (usedValue >= limit * 0.8) status = 'warning';
      if (usedValue >= limit) status = 'exceeded';

      return {
        tenant_id: tenantId,
        period_start: periodStartStr,
        period_end: periodEndStr,
        feature_key: feature.feature_key,
        used_value: usedValue,
        limit_value: limit,
        limit_unit: feature.limit_unit,
        overage_value: overage,
        overage_cost: overageCost,
        status,
      };
    })
  );

  const { error } = await supabaseAdmin.from('unite_quota_snapshots').insert(snapshots);
  if (error) throw new Error(`Failed to compute monthly quota: ${error.message}`);

  return snapshots.length;
}
