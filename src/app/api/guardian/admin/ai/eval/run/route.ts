import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { runEvaluationBatch } from '@/lib/guardian/ai/aiEvaluator';

/**
 * Guardian AI Evaluation Run API (H06)
 * POST /api/guardian/admin/ai/eval/run
 *
 * Triggers evaluation batch for AI quality testing.
 * Access: guardian_admin only
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function POST(req: Request) {
  try {
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const body = await req.json().catch(() => ({}));

    const result = await runEvaluationBatch({
      scenarioIds: body.scenarioIds,
      feature: body.feature,
      tenantId: body.tenantScope === 'global-only' ? undefined : tenantId,
      triggeredBy: userId,
    });

    console.log('[Guardian H06] Evaluation batch complete:', {
      tenantId,
      runIds: result.runIds.length,
      summary: result.summary,
    });

    return NextResponse.json({
      runIds: result.runIds,
      summary: result.summary,
      meta: {
        triggeredBy: userId,
        triggeredAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('[Guardian H06] Evaluation run failed:', error);
    return NextResponse.json(
      { error: 'Evaluation run failed.', details: String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}
