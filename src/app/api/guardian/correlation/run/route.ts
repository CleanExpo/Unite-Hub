import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { correlateRecentGuardianEvents } from '@/lib/guardian/correlationService';

/**
 * Guardian Correlation Run API (G46)
 * POST /api/guardian/correlation/run
 *
 * Triggers correlation engine to cluster recent alerts and incidents.
 * Access: guardian_analyst and guardian_admin only
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

export async function POST() {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const result = await correlateRecentGuardianEvents(tenantId);

    console.log('[Guardian G46] Correlation run complete:', {
      tenantId,
      clustersCreated: result.clustersCreated,
    });

    return NextResponse.json({
      ok: true,
      clustersCreated: result.clustersCreated,
    });
  } catch (error: unknown) {
    console.error('[Guardian G46] Correlation run failed:', error);
    return NextResponse.json({ error: 'Correlation run failed.' }, { status: 400 });
  }
}
