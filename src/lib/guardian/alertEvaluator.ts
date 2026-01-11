import { createClient } from '@/lib/supabase/server';
import type { GuardianAlertRule } from '@/lib/guardian/alertRulesService';

/**
 * Guardian Alert Evaluation Engine (G36 Phase 1)
 *
 * Minimal condition DSL supported:
 * - Metric-based (warehouse data):
 *   { "metric": "errors_per_minute", "op": "greater_than", "value": 20 }
 *
 * - Field-based (telemetry events):
 *   { "field": "status_code", "op": "equals", "value": 500 }
 *
 * - Existence checks:
 *   { "field": "error_message", "op": "exists" }
 *
 * Operators: equals, greater_than, less_than, exists
 */

export type AlertCondition = {
  metric?: string; // For warehouse metrics
  field?: string; // For telemetry event fields
  op: 'equals' | 'greater_than' | 'less_than' | 'exists';
  value?: unknown;
};

export interface FiredAlertEvent {
  ruleId: string;
  severity: string;
  source: string;
  message: string;
  payload: unknown;
}

/**
 * Evaluate all active Guardian alert rules against current data
 * Returns events that matched conditions (not yet inserted to DB)
 */
export async function evaluateGuardianAlertRules(
  tenantId: string,
  rules: GuardianAlertRule[]
): Promise<FiredAlertEvent[]> {
  const supabase = await createClient();
  const firedEvents: FiredAlertEvent[] = [];

  // Fetch latest warehouse rollup samples (if table exists)
  // Note: This table may not exist yet - evaluation will skip if missing
  const { data: warehouseRollups } = await supabase
    .from('warehouse_rollups_hourly')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('bucket_start', { ascending: false })
    .limit(20)
    .then((res) => ({ data: res.data }))
    .catch(() => ({ data: null }));

  // Fetch latest telemetry events (if table exists)
  // Note: This table may not exist yet - evaluation will skip if missing
  const { data: telemetryEvents } = await supabase
    .from('telemetry_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(200)
    .then((res) => ({ data: res.data }))
    .catch(() => ({ data: null }));

  // Evaluate each active rule
  for (const rule of rules) {
    if (!rule.is_active) continue;

    const cond = rule.condition as AlertCondition;
    if (!cond || typeof cond !== 'object' || !cond.op) continue;

    let matched = false;
    let payload: unknown = {};

    // Evaluate against warehouse metrics
    if (cond.metric && warehouseRollups && warehouseRollups.length > 0) {
      const sample = warehouseRollups[0];
      const metricValue = (sample as Record<string, unknown>)[cond.metric];

      if (metricValue !== undefined) {
        if (cond.op === 'greater_than' && typeof metricValue === 'number' && typeof cond.value === 'number') {
          matched = metricValue > cond.value;
        } else if (cond.op === 'less_than' && typeof metricValue === 'number' && typeof cond.value === 'number') {
          matched = metricValue < cond.value;
        } else if (cond.op === 'equals') {
          matched = metricValue == cond.value;
        } else if (cond.op === 'exists') {
          matched = metricValue !== null && metricValue !== undefined;
        }

        if (matched) {
          payload = { sample, metricValue, evaluatedAt: new Date().toISOString() };
        }
      }
    }

    // Evaluate against telemetry event fields
    if (!matched && cond.field && telemetryEvents && telemetryEvents.length > 0) {
      for (const evt of telemetryEvents) {
        const fieldValue = (evt as Record<string, unknown>)[cond.field];
        if (fieldValue === undefined) continue;

        if (cond.op === 'equals') {
          matched = fieldValue == cond.value;
        } else if (cond.op === 'greater_than' && typeof fieldValue === 'number' && typeof cond.value === 'number') {
          matched = fieldValue > cond.value;
        } else if (cond.op === 'less_than' && typeof fieldValue === 'number' && typeof cond.value === 'number') {
          matched = fieldValue < cond.value;
        } else if (cond.op === 'exists') {
          matched = fieldValue !== null && fieldValue !== undefined;
        }

        if (matched) {
          payload = { event: evt, fieldValue, evaluatedAt: new Date().toISOString() };
          break;
        }
      }
    }

    // If condition matched, queue alert event
    if (matched) {
      firedEvents.push({
        ruleId: rule.id,
        severity: rule.severity,
        source: rule.source,
        message: `Rule '${rule.name}' fired due to condition match`,
        payload,
      });
    }
  }

  return firedEvents;
}
