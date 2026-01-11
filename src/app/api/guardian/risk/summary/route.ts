import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { listGuardianRiskScores } from '@/lib/guardian/riskScoreService';

/**
 * Guardian Risk Summary API (G47)
 * GET /api/guardian/risk/summary
 *
 * Returns historical risk scores for the tenant.
 * Access: All Guardian roles (viewer, analyst, admin)
 */

const ALLOWED = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];

export async function GET() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const items = await listGuardianRiskScores(tenantId, 60);

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error('[Guardian G47] Risk summary failed:', error);
    return NextResponse.json({ error: 'Risk summary unavailable.' }, { status: 400 });
  }
}
