/**
 * Guardian Z13: Scheduler Runner
 * Executes due schedules and updates next_run_at
 * Can be invoked manually or by an external job runner
 */

import { getSupabaseServer } from '@/lib/supabase';
import { computeNextRunAt, isDue } from './schedulerUtils';
import { runTasksForTenant } from './metaTaskRunner';
import { logMetaAuditEvent } from './metaAuditService';

export interface SchedulerRunResult {
  executed: number;
  failed: number;
  errors: Array<{ scheduleId: string; error: string }>;
}

/**
 * Run all due schedules for all tenants (or optionally a single tenant)
 * Returns count of executed schedules
 */
export async function runDueSchedules(
  now: Date = new Date(),
  options?: {
    maxSchedules?: number;
    tenantIdOverride?: string; // For testing/manual runs
  }
): Promise<SchedulerRunResult> {
  const supabase = getSupabaseServer();
  const result: SchedulerRunResult = {
    executed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Query all active schedules with next_run_at <= now
    let query = supabase
      .from('guardian_meta_automation_schedules')
      .select('id, tenant_id, schedule_key, task_types, config, next_run_at, cadence, run_at_hour, run_at_minute, day_of_week, day_of_month')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString());

    if (options?.tenantIdOverride) {
      query = query.eq('tenant_id', options.tenantIdOverride);
    }

    const { data: schedules, error: queryError } = await query;

    if (queryError) {
      console.error('[Z13 Scheduler] Query error:', queryError);
      result.errors.push({
        scheduleId: 'query',
        error: `Failed to load schedules: ${queryError.message}`,
      });
      return result;
    }

    if (!schedules || schedules.length === 0) {
      return result; // No schedules to run
    }

    // Limit to max schedules per run (prevent overwhelming)
    const toRun = schedules.slice(0, options?.maxSchedules || 10);

    // Run each schedule
    for (const schedule of toRun) {
      try {
        // Create execution record (status=running)
        const { data: execution, error: execError } = await supabase
          .from('guardian_meta_automation_executions')
          .insert({
            tenant_id: schedule.tenant_id,
            schedule_id: schedule.id,
            task_types: schedule.task_types,
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (execError || !execution) {
          throw new Error(`Failed to create execution: ${execError?.message}`);
        }

        // Run tasks
        const taskResult = await runTasksForTenant(
          schedule.tenant_id,
          schedule.task_types,
          schedule.config || {},
          'system:scheduler'
        );

        // Update execution status to completed
        await supabase
          .from('guardian_meta_automation_executions')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            summary: taskResult.summary,
          })
          .eq('id', execution.id);

        // Compute next_run_at
        const nextRunAt = computeNextRunAt(now, {
          cadence: schedule.cadence as 'hourly' | 'daily' | 'weekly' | 'monthly',
          runAtHour: schedule.run_at_hour,
          runAtMinute: schedule.run_at_minute,
          dayOfWeek: schedule.day_of_week,
          dayOfMonth: schedule.day_of_month,
        });

        // Update schedule: last_run_at and next_run_at
        await supabase
          .from('guardian_meta_automation_schedules')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRunAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', schedule.id);

        // Log audit event
        await logMetaAuditEvent({
          tenantId: schedule.tenant_id,
          actor: 'system:scheduler',
          source: 'automation',
          action: 'execute',
          entityType: 'schedule',
          entityId: schedule.id,
          summary: `Schedule executed: ${schedule.schedule_key}`,
          details: {
            scheduleKey: schedule.schedule_key,
            taskTypes: schedule.task_types,
            executionId: execution.id,
          },
        });

        result.executed++;
      } catch (error) {
        result.failed++;
        const scheduleId = schedule.id;
        const errorMsg = error instanceof Error ? error.message : String(error);

        result.errors.push({
          scheduleId,
          error: errorMsg,
        });

        // Try to mark execution as failed
        try {
          const { data: execution } = await supabase
            .from('guardian_meta_automation_executions')
            .select('id')
            .eq('schedule_id', schedule.id)
            .eq('status', 'running')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          if (execution) {
            await supabase
              .from('guardian_meta_automation_executions')
              .update({
                status: 'failed',
                error_message: errorMsg,
                finished_at: new Date().toISOString(),
              })
              .eq('id', execution.id);
          }
        } catch (updateError) {
          console.error('[Z13 Scheduler] Failed to update execution:', updateError);
        }

        console.error(`[Z13 Scheduler] Schedule ${scheduleId} failed:`, errorMsg);
      }
    }

    return result;
  } catch (error) {
    console.error('[Z13 Scheduler] Unexpected error:', error);
    result.errors.push({
      scheduleId: 'unexpected',
      error: error instanceof Error ? error.message : String(error),
    });
    return result;
  }
}

/**
 * Get the next N due schedules without executing them
 * Useful for preview/inspection
 */
export async function getDueSchedules(
  now: Date = new Date(),
  tenantId?: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  tenantId: string;
  scheduleKey: string;
  taskTypes: string[];
  nextRunAt: string;
}>> {
  const supabase = getSupabaseServer();

  let query = supabase
    .from('guardian_meta_automation_schedules')
    .select('id, tenant_id, schedule_key, task_types, next_run_at')
    .eq('is_active', true)
    .lte('next_run_at', now.toISOString())
    .order('next_run_at', { ascending: true })
    .limit(limit);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data } = await query;

  return (
    data?.map((s) => ({
      id: s.id,
      tenantId: s.tenant_id,
      scheduleKey: s.schedule_key,
      taskTypes: s.task_types,
      nextRunAt: s.next_run_at,
    })) || []
  );
}
