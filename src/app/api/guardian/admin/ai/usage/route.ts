import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAiUsageSummary } from '@/lib/guardian/ai/aiUsageAggregator';

/**
 * Guardian AI Usage Admin API (H05)
 * GET: Fetch AI usage summary (admin only)
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function GET(req: Request) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    // Parse window parameter from query string
    const url = new URL(req.url);
    const windowHours = Number(url.searchParams.get('windowHours') || '24');

    // Validate window
    if (windowHours < 1 || windowHours > 720) {
      return NextResponse.json(
        { error: 'windowHours must be between 1 and 720' },
        { status: 400 }
      );
    }

    const usage = await getGuardianAiUsageSummary(tenantId, windowHours);

    return NextResponse.json({
      usage,
      meta: {
        tenantId,
        windowHours,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN') ? 403 : 401;
    console.error('[Guardian H05] AI usage summary failed:', error);
    return NextResponse.json({ error: 'Access denied.' }, { status: code });
  }
}
