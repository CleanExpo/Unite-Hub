/**
 * Tenant Orchestration Adapter
 * Phase 90: Tenant-scoped orchestration operations
 */

import { getSupabaseServer } from '@/lib/supabase';

/**
 * Get tenant's orchestration schedules
 */
export async function getTenantSchedules(tenantId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('orchestration_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('next_run_at', { ascending: true });

  if (error) {
    console.error('Failed to get tenant schedules:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tenant's assets (VIF, content, etc.)
 */
export async function getTenantAssets(tenantId: string) {
  const supabase = await getSupabaseServer();

  const [vifEntries, posts] = await Promise.all([
    supabase
      .from('vif_archive_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100),

    supabase
      .from('posting_engine_posts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return {
    vifEntries: vifEntries.data || [],
    posts: posts.data || [],
  };
}

/**
 * Get tenant's pending orchestration tasks
 */
export async function getTenantPendingTasks(tenantId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('orchestration_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .lte('next_run_at', new Date().toISOString());

  if (error) {
    console.error('Failed to get pending tasks:', error);
    return [];
  }

  return data || [];
}

/**
 * Create tenant orchestration schedule
 */
export async function createTenantSchedule(
  tenantId: string,
  schedule: {
    name: string;
    scheduleType: string;
    cronExpression?: string;
    payload: Record<string, any>;
  }
) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('orchestration_schedules')
    .insert({
      tenant_id: tenantId,
      name: schedule.name,
      schedule_type: schedule.scheduleType,
      cron_expression: schedule.cronExpression,
      payload: schedule.payload,
      active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`);
  }

  return data;
}
