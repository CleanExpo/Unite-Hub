import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { computeGuardianRiskScore } from '@/lib/guardian/riskScoreService';

/**
 * Guardian Risk Recompute API (G47)
 * POST /api/guardian/risk/recompute
 *
 * Triggers risk score computation for today.
 * Access: guardian_analyst and guardian_admin only
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

export async function POST() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const score = await computeGuardianRiskScore(tenantId);

    return NextResponse.json({ item: score });
  } catch (error: unknown) {
    console.error('[Guardian G47] Risk score computation failed:', error);
    return NextResponse.json(
      { error: 'Risk score computation failed.' },
      { status: 400 }
    );
  }
}
