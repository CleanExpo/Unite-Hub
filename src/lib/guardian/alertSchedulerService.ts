import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Guardian Alert Scheduler Service (G37)
 * Manages per-tenant scheduling configuration for automated alert evaluation
 */

export interface GuardianAlertSchedule {
  tenant_id: string;
  interval_minutes: number;
  debounce_minutes: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get alert schedule configuration for a tenant
 */
export async function getGuardianAlertSchedule(
  tenantId: string
): Promise<GuardianAlertSchedule | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guardian_alert_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[Guardian G37] Failed to fetch alert schedule:', error);
    return null;
  }

  return data as GuardianAlertSchedule | null;
}

/**
 * Create or update alert schedule configuration for a tenant
 */
export async function upsertGuardianAlertSchedule(args: {
  tenantId: string;
  intervalMinutes: number;
  debounceMinutes: number;
}): Promise<GuardianAlertSchedule> {
  const supabase = await createClient();

  // Validate inputs
  if (args.intervalMinutes < 1 || args.intervalMinutes > 1440) {
    throw new Error('interval_minutes must be between 1 and 1440');
  }
  if (args.debounceMinutes < 1 || args.debounceMinutes > 1440) {
    throw new Error('debounce_minutes must be between 1 and 1440');
  }

  const { data, error } = await supabase
    .from('guardian_alert_schedules')
    .upsert(
      {
        tenant_id: args.tenantId,
        interval_minutes: args.intervalMinutes,
        debounce_minutes: args.debounceMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('[Guardian G37] Failed to upsert alert schedule:', error);
    throw error;
  }

  return data as GuardianAlertSchedule;
}

/**
 * Mark that scheduled evaluation ran for a tenant
 * Uses admin client to bypass RLS (called from cron endpoint)
 */
export async function markAlertScheduleRun(tenantId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('guardian_alert_schedules')
    .update({ last_run_at: new Date().toISOString() })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Guardian G37] Failed to mark schedule run:', error);
  }
}

/**
 * Get all tenant schedules due for evaluation
 * Uses admin client to bypass RLS (called from cron endpoint)
 */
export async function getDueAlertSchedules(): Promise<GuardianAlertSchedule[]> {
  const { data, error } = await supabaseAdmin
    .from('guardian_alert_schedules')
    .select('*')
    .order('last_run_at', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('[Guardian G37] Failed to fetch due schedules:', error);
    return [];
  }

  // Filter schedules that are due for evaluation
  const now = Date.now();
  const dueSchedules = (data as GuardianAlertSchedule[]).filter((schedule) => {
    if (!schedule.last_run_at) return true; // Never run before

    const lastRunMs = new Date(schedule.last_run_at).getTime();
    const intervalMs = schedule.interval_minutes * 60 * 1000;
    return now - lastRunMs >= intervalMs;
  });

  return dueSchedules;
}
