/**
 * GET /api/founder/integrations/status
 *
 * Returns combined integration status for all 5 Unite-Group businesses.
 * Founder-only route — no workspace_id filter required.
 *
 * Response shape:
 * {
 *   xero:     { [businessKey]: 'connected' | 'mapped' | 'disconnected' },
 *   stripe:   { [businessKey]: 'connected' | 'disconnected' },
 *   google:   { [businessKey]: 'connected' | 'disconnected' },
 *   openclaw: 'connected' | 'disconnected'
 * }
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getStripeKeyForBusiness } from '@/lib/stripe-mrr';

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESSES = [
  'disaster-recovery',
  'restore-assist',
  'ato',
  'nrpg',
  'unite-group',
] as const;

type BusinessKey = (typeof BUSINESSES)[number];
type XeroStatus = 'connected' | 'mapped' | 'disconnected';
type BinaryStatus = 'connected' | 'disconnected';

// ─── Xero status helper ────────────────────────────────────────────────────────

async function getXeroStatus(): Promise<Record<BusinessKey, XeroStatus>> {
  const result: Record<BusinessKey, XeroStatus> = {
    'disaster-recovery': 'disconnected',
    'restore-assist': 'disconnected',
    ato: 'disconnected',
    nrpg: 'disconnected',
    'unite-group': 'disconnected',
  };

  try {
    const { data: tenants, error } = await supabaseAdmin
      .from('xero_business_tenants')
      .select('business_key, confirmed_at, xero_tenant_id')
      .in('business_key', [...BUSINESSES]);

    if (error) {
      console.warn('[integrations/status] Xero query error:', error.message);
      return result;
    }

    for (const row of tenants ?? []) {
      const key = row.business_key as BusinessKey;
      if (!BUSINESSES.includes(key)) continue;

      if (row.confirmed_at !== null) {
        result[key] = 'connected';
      } else if (row.xero_tenant_id) {
        result[key] = 'mapped';
      }
    }
  } catch (err) {
    console.warn('[integrations/status] Xero check failed:', err);
  }

  return result;
}

// ─── Stripe status helper ─────────────────────────────────────────────────────

function getStripeStatus(): Record<BusinessKey, BinaryStatus> {
  const result: Record<BusinessKey, BinaryStatus> = {
    'disaster-recovery': 'disconnected',
    'restore-assist': 'disconnected',
    ato: 'disconnected',
    nrpg: 'disconnected',
    'unite-group': 'disconnected',
  };

  for (const biz of BUSINESSES) {
    const key = getStripeKeyForBusiness(biz);
    if (key && key.length > 0) {
      result[biz] = 'connected';
    }
  }

  return result;
}

// ─── Google status helper ─────────────────────────────────────────────────────

async function getGoogleStatus(): Promise<Record<BusinessKey, BinaryStatus>> {
  const result: Record<BusinessKey, BinaryStatus> = {
    'disaster-recovery': 'disconnected',
    'restore-assist': 'disconnected',
    ato: 'disconnected',
    nrpg: 'disconnected',
    'unite-group': 'disconnected',
  };

  try {
    // email_integrations stores OAuth tokens for Gmail/Google Calendar
    // The table has a provider column — look for 'google' or 'gmail' rows
    const { data: rows, error } = await supabaseAdmin
      .from('email_integrations')
      .select('email_address, provider, status')
      .in('provider', ['google', 'gmail', 'google_calendar']);

    if (error) {
      // Table may not exist or column may differ — return all disconnected
      console.warn('[integrations/status] Google/email_integrations query error:', error.message);
      return result;
    }

    // If any connected Google row exists, mark unite-group as connected
    // (we don't have per-business partitioning on email_integrations yet)
    const hasGoogle = (rows ?? []).some(
      (r) => r.status === 'active' || r.status === 'connected' || r.status === 'syncing'
    );

    if (hasGoogle) {
      result['unite-group'] = 'connected';
    }
  } catch (err) {
    console.warn('[integrations/status] Google check failed:', err);
  }

  return result;
}

// ─── OpenClaw status helper ────────────────────────────────────────────────────

function getOpenclawStatus(): BinaryStatus {
  const key = process.env.OPENCLAW_API_KEY;
  return key && key.length > 0 ? 'connected' : 'disconnected';
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const [xero, google] = await Promise.all([
      getXeroStatus(),
      getGoogleStatus(),
    ]);

    const stripe = getStripeStatus();
    const openclaw = getOpenclawStatus();

    return NextResponse.json({
      xero,
      stripe,
      google,
      openclaw,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve integration status.';
    console.error('[integrations/status] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
