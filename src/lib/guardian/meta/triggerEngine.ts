/**
 * Guardian Z13: Trigger Evaluation Engine
 * Evaluates meta triggers and fires actions when thresholds are met
 * Supports cooldowns to prevent trigger spam
 */

import { getSupabaseServer } from '@/lib/supabase';
import { runTasksForTenant } from './metaTaskRunner';
import { logMetaAuditEvent } from './metaAuditService';

/**
 * Meta signal snapshot (all Z-series metrics)
 */
export interface MetaSignals {
  readiness_overall_score?: number;
  readiness_status?: string;
  adoption_core_score?: number;
  adoption_rate?: number;
  edition_fit_score?: number;
  uplift_completion_ratio?: number;
  kpi_on_track_count?: number;
  kpi_on_track_percent?: number;
  kpi_total_count?: number;
  kpi_on_track_pct?: number;
  goals_on_track_count?: number;
  goals_behind_track_count?: number;
  goals_total_count?: number;
  stack_overall_status?: string;
  blocker_count?: number;
  warning_count?: number;
  last_export_age_days?: number;
  [key: string]: any;
}

/**
 * Load current meta signals for a tenant
 * Returns PII-free, meta-only data
 */
export async function loadCurrentMetaSignals(tenantId: string): Promise<MetaSignals> {
  const supabase = getSupabaseServer();
  const signals: MetaSignals = {};

  try {
    // Z01: Readiness
    const { data: readiness } = await supabase
      .from('guardian_tenant_readiness_scores')
      .select('overall_guardian_score, status')
      .eq('tenant_id', tenantId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (readiness) {
      signals.readiness_overall_score = readiness.overall_guardian_score;
      signals.readiness_status = readiness.status;
    }

    // Z02: Adoption
    const { data: adoption } = await supabase
      .from('guardian_tenant_adoption_scores')
      .select('adoption_rate')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (adoption) {
      signals.adoption_rate = adoption.adoption_rate;
    }

    // Z08: KPIs
    const { data: kpis } = await supabase
      .from('guardian_meta_program_goals')
      .select('status')
      .eq('tenant_id', tenantId);

    if (kpis && kpis.length > 0) {
      signals.kpi_total_count = kpis.length;
      signals.kpi_on_track_count = kpis.filter((k) => k.status === 'on_track').length;
      signals.kpi_on_track_pct = Math.round((signals.kpi_on_track_count / kpis.length) * 100);
    }

    // Z12: Improvement cycles (optional)
    const { data: cycles } = await supabase
      .from('guardian_meta_improvement_cycles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    signals.active_improvement_cycles = cycles?.length || 0;

    // Z11: Last export age
    const { data: exports } = await supabase
      .from('guardian_meta_export_bundles')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (exports) {
      const ageMs = Date.now() - new Date(exports.created_at).getTime();
      signals.last_export_age_days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    }
  } catch (error) {
    console.error('[Z13 Trigger Engine] Error loading signals:', error);
    // Continue with partial signals
  }

  return signals;
}

/**
 * Evaluate a trigger condition
 * Supports numeric and string comparisons
 */
export function evaluateTrigger(
  trigger: {
    metric_key: string;
    comparator: string;
    threshold: any;
  },
  signals: MetaSignals
): boolean {
  const metricValue = signals[trigger.metric_key];

  if (metricValue === undefined || metricValue === null) {
    return false; // Metric not available
  }

  const threshold = trigger.threshold;

  switch (trigger.comparator) {
    case 'lt':
      return Number(metricValue) < Number(threshold);
    case 'lte':
      return Number(metricValue) <= Number(threshold);
    case 'gt':
      return Number(metricValue) > Number(threshold);
    case 'gte':
      return Number(metricValue) >= Number(threshold);
    case 'eq':
      return String(metricValue) === String(threshold);
    case 'neq':
      return String(metricValue) !== String(threshold);
    default:
      return false;
  }
}

/**
 * Check if a trigger is within cooldown
 */
function isWithinCooldown(lastFiredAt: Date | null, cooldownHours: number, now: Date): boolean {
  if (!lastFiredAt) return false;
  const elapsedMs = now.getTime() - new Date(lastFiredAt).getTime();
  return elapsedMs < cooldownHours * 60 * 60 * 1000;
}

/**
 * Run triggers for a tenant
 * Evaluates all active triggers and fires actions if conditions are met
 */
export async function runTriggersForTenant(
  tenantId: string,
  now: Date = new Date()
): Promise<{
  evaluated: number;
  fired: number;
  errors: Array<{ triggerId: string; error: string }>;
}> {
  const supabase = getSupabaseServer();
  const result = {
    evaluated: 0,
    fired: 0,
    errors: [] as Array<{ triggerId: string; error: string }>,
  };

  try {
    // Load current meta signals
    const signals = await loadCurrentMetaSignals(tenantId);

    // Get all active triggers for tenant
    const { data: triggers, error: queryError } = await supabase
      .from('guardian_meta_automation_triggers')
      .select('id, trigger_key, metric_key, comparator, threshold, actions, cooldown_hours, last_fired_at, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (queryError) {
      console.error('[Z13 Trigger Engine] Query error:', queryError);
      result.errors.push({
        triggerId: 'query',
        error: queryError.message,
      });
      return result;
    }

    if (!triggers || triggers.length === 0) {
      return result; // No triggers to evaluate
    }

    // Evaluate each trigger
    for (const trigger of triggers) {
      result.evaluated++;

      try {
        // Skip if within cooldown
        if (isWithinCooldown(trigger.last_fired_at ? new Date(trigger.last_fired_at) : null, trigger.cooldown_hours || 24, now)) {
          continue; // Within cooldown, skip
        }

        // Evaluate trigger condition
        if (!evaluateTrigger(trigger, signals)) {
          continue; // Condition not met
        }

        // Condition met: fire actions
        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from('guardian_meta_automation_executions')
          .insert({
            tenant_id: tenantId,
            trigger_id: trigger.id,
            task_types: trigger.actions?.map((a: any) => a.taskType) || [],
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (execError || !execution) {
          throw new Error(`Failed to create execution: ${execError?.message}`);
        }

        // Run actions
        const taskTypes = trigger.actions?.map((a: any) => a.taskType) || [];
        const config: Record<string, any> = {};

        // Build config from actions
        for (const action of trigger.actions || []) {
          config[action.taskType] = action.config || {};
        }

        const taskResult = await runTasksForTenant(tenantId, taskTypes, config, 'system:trigger');

        // Update execution to completed
        await supabase
          .from('guardian_meta_automation_executions')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            summary: taskResult.summary,
          })
          .eq('id', execution.id);

        // Update trigger: last_fired_at
        await supabase
          .from('guardian_meta_automation_triggers')
          .update({
            last_fired_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', trigger.id);

        // Log audit event
        await logMetaAuditEvent({
          tenantId,
          actor: 'system:trigger',
          source: 'automation',
          action: 'trigger_fired',
          entityType: 'trigger',
          entityId: trigger.id,
          summary: `Trigger fired: ${trigger.trigger_key}`,
          details: {
            triggerKey: trigger.trigger_key,
            metricKey: trigger.metric_key,
            metricValue: signals[trigger.metric_key],
            threshold: trigger.threshold,
          },
        });

        result.fired++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push({
          triggerId: trigger.id,
          error: errorMsg,
        });

        console.error(`[Z13 Trigger Engine] Trigger ${trigger.id} failed:`, error);
      }
    }

    return result;
  } catch (error) {
    console.error('[Z13 Trigger Engine] Unexpected error:', error);
    result.errors.push({
      triggerId: 'unexpected',
      error: error instanceof Error ? error.message : String(error),
    });
    return result;
  }
}
