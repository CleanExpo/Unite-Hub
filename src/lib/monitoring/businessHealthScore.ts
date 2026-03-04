/**
 * Business Health Score Engine
 *
 * Computes a simple health status for each of the 5 Unite-Group businesses
 * by checking Stripe connectivity, Xero connectivity, and recent alert events.
 *
 * Score logic:
 *   healthy  — Stripe key present, Xero confirmed, no alerts in 24 h
 *   warning  — One signal missing OR 1-2 recent alerts
 *   critical — Two or more signals missing OR 3+ recent alerts
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getStripeKeyForBusiness } from '@/lib/stripe-mrr';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface BusinessHealth {
  businessId: string;
  name: string;
  score: HealthStatus;
  stripeConnected: boolean;
  xeroConnected: boolean;
  recentAlertCount: number;
}

// ─── Business Registry ────────────────────────────────────────────────────────

const BUSINESSES: Array<{ id: string; name: string }> = [
  { id: 'disaster-recovery', name: 'Disaster Recovery' },
  { id: 'restore-assist',    name: 'RestoreAssist'      },
  { id: 'ato',               name: 'ATO'                },
  { id: 'nrpg',              name: 'NRPG'               },
  { id: 'unite-group',       name: 'Unite Group'        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when the Stripe env var for the business is populated. */
function checkStripeConnected(businessId: string): boolean {
  const key = getStripeKeyForBusiness(businessId);
  return !!key && key.trim().length > 0;
}

/**
 * Returns true when a confirmed Xero tenant mapping exists for the business.
 * Catches gracefully if the table does not exist yet (42P01).
 */
async function checkXeroConnected(businessId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('xero_business_tenants')
      .select('id')
      .eq('business_key', businessId)
      .not('confirmed_at', 'is', null)
      .limit(1);

    if (error) {
      if ((error as any).code === '42P01') return false;
      return false;
    }
    return !!(data && data.length > 0);
  } catch {
    return false;
  }
}

/**
 * Returns the count of alert_events fired for this business in the last 24 hours.
 * Catches gracefully if the table does not exist yet (42P01).
 */
async function getRecentAlertCount(businessId: string): Promise<number> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabaseAdmin
      .from('alert_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('fired_at', since);

    if (error) {
      if ((error as any).code === '42P01') return 0;
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Derive a health status from the three signal values. */
function deriveScore(
  stripeConnected: boolean,
  xeroConnected: boolean,
  recentAlertCount: number,
): HealthStatus {
  const missingSignals = (stripeConnected ? 0 : 1) + (xeroConnected ? 0 : 1);

  if (missingSignals >= 2 || recentAlertCount >= 3) return 'critical';
  if (missingSignals >= 1 || recentAlertCount >= 1) return 'warning';
  return 'healthy';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute health scores for all 5 Unite-Group businesses in parallel.
 * Always resolves — individual failures are caught and expressed as 'critical'.
 */
export async function getHealthScores(): Promise<BusinessHealth[]> {
  const results = await Promise.allSettled(
    BUSINESSES.map(async (biz) => {
      const [xeroConnected, recentAlertCount] = await Promise.all([
        checkXeroConnected(biz.id),
        getRecentAlertCount(biz.id),
      ]);
      const stripeConnected = checkStripeConnected(biz.id);
      const score = deriveScore(stripeConnected, xeroConnected, recentAlertCount);

      return {
        businessId:       biz.id,
        name:             biz.name,
        score,
        stripeConnected,
        xeroConnected,
        recentAlertCount,
      } satisfies BusinessHealth;
    })
  );

  return results.map((result, idx) => {
    if (result.status === 'fulfilled') return result.value;

    // Fallback for unexpected errors — surface as critical so the UI shows a signal
    console.error(`[businessHealthScore] Failed for ${BUSINESSES[idx].id}:`, result.reason);
    return {
      businessId:       BUSINESSES[idx].id,
      name:             BUSINESSES[idx].name,
      score:            'critical' as HealthStatus,
      stripeConnected:  false,
      xeroConnected:    false,
      recentAlertCount: 0,
    };
  });
}
