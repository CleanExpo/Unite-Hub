/**
 * POST /api/founder/xero/sync/[business]
 *
 * Triggers an invoice sync for the specified business from its mapped Xero tenant.
 *
 * Safety enforced by syncBusinessInvoices():
 *   - Mapping must exist in xero_business_tenants
 *   - sync_enabled must be true (set only after user confirms via setup UI)
 *   - confirmed_at must be set
 *
 * Response: SyncResult (business_key, records_synced, errors, completed_at)
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncBusinessInvoices } from '@/lib/accounting/xero-founder-service';

const VALID_BUSINESSES = [
  'carsi',
  'restore-assist',
  'unite-group',
  'ato',
  'synthex',
  'disaster-recovery',
  'nrpg',
];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ business: string }> }
) {
  const { business } = await params;

  if (!VALID_BUSINESSES.includes(business)) {
    return NextResponse.json(
      { error: `Unknown business '${business}'. Valid values: ${VALID_BUSINESSES.join(', ')}.` },
      { status: 400 }
    );
  }

  try {
    const result = await syncBusinessInvoices(business);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync failed.';
    console.error(`[xero/sync/${business}] Error:`, message);

    // 422 for business logic errors (not configured), 500 for unexpected errors
    const isMisconfigured =
      message.includes('No tenant mapping') ||
      message.includes('not enabled') ||
      message.includes('not been confirmed');

    return NextResponse.json({ error: message }, { status: isMisconfigured ? 422 : 500 });
  }
}
