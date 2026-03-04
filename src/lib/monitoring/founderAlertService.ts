/**
 * Founder Alert Service — UNI KPI Alerting
 *
 * Evaluates alert_rules for a given owner, fetches live metric values
 * across Stripe MRR, Xero invoice counts, and Xero connection status,
 * then fires alert_events when thresholds are crossed (once per 24 h).
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getStripeKeyForBusiness, fetchStripeMrr } from '@/lib/stripe-mrr';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertMetric = 'mrr' | 'invoice_count' | 'xero_connected';
export type AlertOperator = 'lt' | 'gt' | 'lte' | 'gte' | 'eq';

export interface AlertRule {
  id: string;
  owner_id: string;
  business_id: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  label: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertEvent {
  id: string;
  rule_id: string | null;
  owner_id: string;
  business_id: string;
  metric: AlertMetric;
  actual_value: number | null;
  threshold_value: number | null;
  label: string | null;
  fired_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Apply the comparison operator — returns true if the alert should fire. */
function compare(actual: number, operator: AlertOperator, threshold: number): boolean {
  switch (operator) {
    case 'lt':  return actual <  threshold;
    case 'gt':  return actual >  threshold;
    case 'lte': return actual <= threshold;
    case 'gte': return actual >= threshold;
    case 'eq':  return actual === threshold;
    default:    return false;
  }
}

/**
 * Fetch live MRR for a business via its Stripe restricted key.
 * Returns 0 when the key is absent or the Stripe call fails.
 */
async function fetchMrr(businessId: string): Promise<number> {
  try {
    const key = getStripeKeyForBusiness(businessId);
    if (!key) return 0;
    const result = await fetchStripeMrr(key);
    return result?.mrr ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Count invoices synced from Xero for the business in the last 7 days.
 * Returns 0 gracefully if the table does not exist (error code 42P01).
 */
async function fetchInvoiceCount(businessId: string): Promise<number> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabaseAdmin
      .from('xero_sync_log')
      .select('*', { count: 'exact', head: true })
      .eq('business_key', businessId)
      .gte('created_at', sevenDaysAgo);

    // 42P01 = relation does not exist — table not yet migrated
    if (error) {
      if ((error as any).code === '42P01') return 0;
      console.warn('[founderAlertService] xero_sync_log query error:', error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Returns 1 if the business has a confirmed Xero tenant mapping, otherwise 0.
 * Returns 0 gracefully if the table does not exist (error code 42P01).
 */
async function fetchXeroConnected(businessId: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('xero_business_tenants')
      .select('id')
      .eq('business_key', businessId)
      .not('confirmed_at', 'is', null)
      .limit(1);

    if (error) {
      if ((error as any).code === '42P01') return 0;
      console.warn('[founderAlertService] xero_business_tenants query error:', error.message);
      return 0;
    }
    return data && data.length > 0 ? 1 : 0;
  } catch {
    return 0;
  }
}

/** Dispatch to the correct metric fetcher. */
async function fetchMetricValue(metric: AlertMetric, businessId: string): Promise<number> {
  switch (metric) {
    case 'mrr':             return fetchMrr(businessId);
    case 'invoice_count':   return fetchInvoiceCount(businessId);
    case 'xero_connected':  return fetchXeroConnected(businessId);
    default:                return 0;
  }
}

/**
 * Check whether a rule already fired within the last 24 hours.
 * Suppresses duplicate noise — one alert per rule per day maximum.
 */
async function alreadyFiredToday(ruleId: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabaseAdmin
      .from('alert_events')
      .select('*', { count: 'exact', head: true })
      .eq('rule_id', ruleId)
      .gte('fired_at', since);

    if (error) {
      if ((error as any).code === '42P01') return false;
      return false;
    }
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate all enabled alert rules for `ownerId`.
 *
 * For each rule:
 *   1. Fetch the current metric value.
 *   2. Compare against threshold using the rule's operator.
 *   3. Skip if the rule already fired within the last 24 hours.
 *   4. Insert an alert_event record for newly triggered rules.
 *
 * Returns the list of newly fired alert events.
 */
export async function evaluateAlerts(ownerId: string): Promise<AlertEvent[]> {
  const firedEvents: AlertEvent[] = [];

  // 1. Load enabled rules for this owner
  let rules: AlertRule[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('alert_rules')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('enabled', true);

    if (error) {
      if ((error as any).code === '42P01') {
        console.warn('[founderAlertService] alert_rules table not yet created — run migration 502');
        return [];
      }
      console.error('[founderAlertService] Failed to load alert rules:', error.message);
      return [];
    }
    rules = (data as AlertRule[]) ?? [];
  } catch (err) {
    console.error('[founderAlertService] Unexpected error loading rules:', err);
    return [];
  }

  if (rules.length === 0) return [];

  // 2. Evaluate each rule
  for (const rule of rules) {
    try {
      const actualValue = await fetchMetricValue(rule.metric, rule.business_id);
      const shouldFire  = compare(actualValue, rule.operator, rule.threshold);

      if (!shouldFire) continue;

      const alreadyFired = await alreadyFiredToday(rule.id);
      if (alreadyFired) continue;

      // 3. Insert alert event
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('alert_events')
        .insert({
          rule_id:         rule.id,
          owner_id:        ownerId,
          business_id:     rule.business_id,
          metric:          rule.metric,
          actual_value:    actualValue,
          threshold_value: rule.threshold,
          label:           rule.label,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[founderAlertService] Failed to insert alert event:', insertError.message);
        continue;
      }

      firedEvents.push(inserted as AlertEvent);
    } catch (err) {
      console.error(`[founderAlertService] Error evaluating rule ${rule.id}:`, err);
    }
  }

  return firedEvents;
}
