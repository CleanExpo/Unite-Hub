import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianInsightsSummary } from '@/lib/guardian/insightsService';

/**
 * Guardian Insights Summary API (G50)
 * GET /api/guardian/insights/summary
 *
 * Returns high-level Guardian metrics for the tenant.
 * Access: All Guardian roles (viewer, analyst, admin)
 */

const ALLOWED = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];

export async function GET() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const summary = await getGuardianInsightsSummary(tenantId);

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    console.error('[Guardian G50] Insights summary failed:', error);
    return NextResponse.json(
      { error: 'Unable to load Guardian insights summary.' },
      { status: 400 }
    );
  }
}
