/**
 * GET /api/founder/xero/tenants/[licence]
 *
 * Returns the list of Xero tenants (organisations) connected to the
 * specified licence group. Requires the licence to be connected first.
 *
 * Used by the setup UI's mapping step to show which Xero orgs are available
 * for the user to map to business keys.
 *
 * Response: { tenants: Array<{ tenantId, tenantName, tenantType }> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantsForLicence } from '@/lib/accounting/xero-founder-service';
import type { LicenceName } from '@/lib/accounting/xero-founder-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ licence: string }> }
) {
  const { licence } = await params;

  if (!['carsi', 'dr_nrpg'].includes(licence)) {
    return NextResponse.json(
      { error: `Invalid licence '${licence}'. Must be 'carsi' or 'dr_nrpg'.` },
      { status: 400 }
    );
  }

  try {
    const tenants = await getTenantsForLicence(licence as LicenceName);
    return NextResponse.json({ tenants });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tenants.';
    console.error(`[xero/tenants/${licence}] Error:`, message);

    // Return structured error so the UI can display the specific reason
    return NextResponse.json({ error: message, tenants: [] }, { status: 500 });
  }
}
