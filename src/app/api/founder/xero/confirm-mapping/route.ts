/**
 * POST /api/founder/xero/confirm-mapping
 *
 * Confirms all tenant mappings for a licence group and enables sync.
 * Must only be called after the user has reviewed the mapping table in the setup UI.
 *
 * Body: { licence_name: 'carsi' | 'dr_nrpg' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmTenantMappings } from '@/lib/accounting/xero-founder-service';
import type { LicenceName } from '@/lib/accounting/xero-founder-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licence_name } = body as { licence_name?: LicenceName };

    if (!licence_name || !['carsi', 'dr_nrpg'].includes(licence_name)) {
      return NextResponse.json(
        { error: 'licence_name must be carsi or dr_nrpg.' },
        { status: 400 }
      );
    }

    await confirmTenantMappings(licence_name);

    return NextResponse.json({
      success: true,
      message: `Tenant mappings confirmed for '${licence_name}' licence. Sync is now enabled for mapped businesses.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to confirm mappings.';
    console.error('[xero/confirm-mapping] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
