/**
 * POST /api/founder/xero/map-tenant
 *
 * Maps a business key to a specific Xero tenant within its licence group.
 * This saves the mapping but does NOT enable sync — sync is enabled only
 * after the user confirms all mappings via the confirm-mapping endpoint.
 *
 * Body: {
 *   business_key: string       — e.g. 'unite-group', 'restore-assist', 'disaster-recovery'
 *   licence_name: 'carsi' | 'dr_nrpg'
 *   xero_tenant_id: string     — UUID from Xero /connections API
 *   xero_org_name: string      — display name from Xero
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { mapBusinessTenant } from '@/lib/accounting/xero-founder-service';
import type { LicenceName } from '@/lib/accounting/xero-founder-service';

// Valid business keys for each licence
const CARSI_BUSINESSES = ['carsi', 'restore-assist', 'unite-group', 'ato', 'synthex'];
const DR_NRPG_BUSINESSES = ['disaster-recovery', 'nrpg'];
const ALL_VALID_BUSINESSES = [...CARSI_BUSINESSES, ...DR_NRPG_BUSINESSES];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_key, licence_name, xero_tenant_id, xero_org_name } = body as {
      business_key?: string;
      licence_name?: LicenceName;
      xero_tenant_id?: string;
      xero_org_name?: string;
    };

    // Validate required fields
    if (!business_key?.trim()) {
      return NextResponse.json({ error: 'business_key is required.' }, { status: 400 });
    }
    if (!licence_name || !['carsi', 'dr_nrpg'].includes(licence_name)) {
      return NextResponse.json({ error: 'licence_name must be carsi or dr_nrpg.' }, { status: 400 });
    }
    if (!xero_tenant_id?.trim()) {
      return NextResponse.json({ error: 'xero_tenant_id is required.' }, { status: 400 });
    }

    // Validate business key is recognised
    if (!ALL_VALID_BUSINESSES.includes(business_key)) {
      return NextResponse.json(
        { error: `Unknown business_key '${business_key}'. Valid keys: ${ALL_VALID_BUSINESSES.join(', ')}.` },
        { status: 400 }
      );
    }

    // Validate licence/business alignment
    if (licence_name === 'carsi' && !CARSI_BUSINESSES.includes(business_key)) {
      return NextResponse.json(
        { error: `Business '${business_key}' does not belong to the CARSI licence. Expected one of: ${CARSI_BUSINESSES.join(', ')}.` },
        { status: 400 }
      );
    }
    if (licence_name === 'dr_nrpg' && !DR_NRPG_BUSINESSES.includes(business_key)) {
      return NextResponse.json(
        { error: `Business '${business_key}' does not belong to the DR/NRPG licence. Expected one of: ${DR_NRPG_BUSINESSES.join(', ')}.` },
        { status: 400 }
      );
    }

    await mapBusinessTenant(
      business_key,
      licence_name,
      xero_tenant_id.trim(),
      xero_org_name?.trim() ?? ''
    );

    return NextResponse.json({
      success: true,
      message: `Business '${business_key}' mapped to Xero tenant '${xero_org_name ?? xero_tenant_id}'. Sync is disabled until you confirm mappings.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to map tenant.';
    console.error('[xero/map-tenant] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
