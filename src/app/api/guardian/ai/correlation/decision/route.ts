import { NextRequest, NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Correlation Decision API (H03)
 * POST /api/guardian/ai/correlation/decision
 *
 * Records user decisions on AI correlation recommendations (telemetry only).
 * Does NOT auto-apply changes to correlation data (advisory only).
 *
 * Access: guardian_analyst and guardian_admin only
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

type RouteContext = {
  params: Promise<Record<string, never>>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // Enforce analyst+ access
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const reviewId = body.reviewId as string | undefined;
    const decision = body.decision as 'accepted' | 'dismissed' | undefined;

    // Validate inputs
    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    if (!decision || !['accepted', 'dismissed'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be "accepted" or "dismissed"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify review exists and belongs to tenant
    const { data: existing, error: fetchError } = await supabase
      .from('guardian_ai_correlation_reviews')
      .select('id, tenant_id')
      .eq('id', reviewId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      return NextResponse.json(
        { error: 'Review not found or access denied' },
        { status: 404 }
      );
    }

    // Update review with decision
    const applied = decision === 'accepted';
    const { error: updateError } = await supabase
      .from('guardian_ai_correlation_reviews')
      .update({
        applied,
        applied_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('[Guardian H03] Failed to record decision:', updateError);
      throw updateError;
    }

    console.log('[Guardian H03] Decision recorded:', {
      reviewId,
      tenantId,
      decision,
      applied,
    });

    return NextResponse.json({
      ok: true,
      reviewId,
      decision,
      applied,
    });
  } catch (error: unknown) {
    const message = String(error);

    if (message.includes('FORBIDDEN')) {
      return NextResponse.json(
        { error: 'Access denied.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    console.error('[Guardian H03] Decision recording failed:', error);
    return NextResponse.json(
      { error: 'Unable to record decision.', details: message.slice(0, 200) },
      { status: 500 }
    );
  }
}
