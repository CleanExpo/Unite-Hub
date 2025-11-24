/**
 * Tenant Scaling Adapter
 * Phase 90: Tenant-scoped scaling operations
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Compute tenant scaling health
 */
export async function computeTenantScaling(tenantId: string) {
  const supabase = await getSupabaseServer();

  // Get latest scaling snapshot
  const { data: snapshot } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!snapshot) {
    return null;
  }

  return {
    currentMode: snapshot.current_mode,
    healthScore: snapshot.overall_scaling_health_score,
    utilisationRatio: snapshot.utilisation_ratio,
    recommendation: snapshot.recommendation,
    createdAt: snapshot.created_at,
  };
}

/**
 * Recommend scaling mode for tenant
 */
export async function recommendTenantMode(tenantId: string) {
  const scaling = await computeTenantScaling(tenantId);

  if (!scaling) {
    return 'hold';
  }

  // Simple recommendation logic
  if (scaling.healthScore < 30) {
    return 'freeze';
  } else if (scaling.healthScore < 50) {
    return 'decrease_mode';
  } else if (scaling.healthScore > 80 && scaling.utilisationRatio > 0.8) {
    return 'increase_mode';
  }

  return 'hold';
}

/**
 * Get tenant scaling history
 */
export async function getTenantScalingHistory(
  tenantId: string,
  days: number = 30
) {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('scaling_health_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get scaling history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant's current scaling mode
 */
export async function getTenantCurrentMode(tenantId: string) {
  const scaling = await computeTenantScaling(tenantId);
  return scaling?.currentMode || 'cautious';
}
