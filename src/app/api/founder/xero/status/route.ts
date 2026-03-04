/**
 * GET /api/founder/xero/status
 *
 * Returns the connection status of both Xero licence groups
 * plus all mapped business tenants.
 *
 * Response: LicenceStatus (see xero-founder-service.ts)
 */

import { NextResponse } from 'next/server';
import { getLicenceStatus } from '@/lib/accounting/xero-founder-service';

export async function GET() {
  try {
    const status = await getLicenceStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read Xero status.';
    console.error('[xero/status] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
