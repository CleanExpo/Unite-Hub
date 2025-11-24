/**
 * Tenant Intel Adapter
 * Phase 90: Tenant-scoped intel operations
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Load tenant intel snapshots
 */
export async function loadTenantIntel(tenantId: string, limit: number = 10) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_intel_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load tenant intel:', error);
    return [];
  }

  return data || [];
}

/**
 * Load tenant alerts (early warnings)
 */
export async function loadTenantAlerts(tenantId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('early_warning_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('resolved', false)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load tenant alerts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant performance reality
 */
export async function loadTenantPerformance(tenantId: string, limit: number = 10) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('performance_reality_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load tenant performance:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant combat results
 */
export async function loadTenantCombatResults(tenantId: string, limit: number = 20) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('combat_rounds')
    .select(`
      *,
      combat_entries (*),
      combat_results (*)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load tenant combat results:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant intel summary
 */
export async function getTenantIntelSummary(tenantId: string) {
  const [intel, alerts, performance] = await Promise.all([
    loadTenantIntel(tenantId, 1),
    loadTenantAlerts(tenantId),
    loadTenantPerformance(tenantId, 1),
  ]);

  return {
    latestIntel: intel[0] || null,
    activeAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
    latestPerformance: performance[0] || null,
  };
}
