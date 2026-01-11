import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { generateAnomalyDetection } from '@/lib/guardian/ai/anomalyEngine';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Anomaly Detection Run API (H02)
 * POST /api/guardian/anomaly/run
 *
 * Triggers AI-powered anomaly detection for the tenant.
 * Access: guardian_analyst and guardian_admin only
 *
 * Graceful degradation: Returns 503 if ANTHROPIC_API_KEY not configured
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

export async function POST(req: Request) {
  try {
    // Enforce analyst+ access
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[Guardian H02] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        {
          error: 'Guardian anomaly detection is not configured for this environment.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Parse request body (optional window parameter)
    const body = await req.json().catch(() => ({}));
    const windowHours = Number(body.windowHours ?? 24);

    // Validate window (1-168 hours = 1 hour to 7 days)
    if (windowHours < 1 || windowHours > 168) {
      return NextResponse.json(
        { error: 'windowHours must be between 1 and 168' },
        { status: 400 }
      );
    }

    // Generate anomaly detection using AI
    const result = await generateAnomalyDetection({
      tenantId,
      windowHours,
    });

    // Store result in guardian_anomaly_scores
    const supabase = await createClient();
    const { data: stored, error: insertError } = await supabase
      .from('guardian_anomaly_scores')
      .insert({
        tenant_id: tenantId,
        window_start: result.window_start,
        window_end: result.window_end,
        anomaly_score: result.anomaly_score,
        confidence: result.confidence,
        contributing_alert_ids: result.contributing.alerts,
        contributing_incident_ids: result.contributing.incidents,
        explanation: result.explanation,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[Guardian H02] Failed to store anomaly score:', insertError);
      throw insertError;
    }

    console.log('[Guardian H02] Anomaly detection stored:', {
      tenantId,
      anomalyScore: result.anomaly_score,
      confidence: result.confidence,
    });

    return NextResponse.json({
      anomaly: stored,
      meta: {
        model: 'claude-sonnet-4-5-20250929',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = String(error);

    // Handle specific error cases
    if (message.includes('FORBIDDEN')) {
      return NextResponse.json(
        { error: 'Guardian anomaly detection requires analyst or admin access.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (message.includes('UNAUTHENTICATED')) {
      return NextResponse.json(
        { error: 'Authentication required.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    if (message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Guardian anomaly detection is not configured.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Generic error
    console.error('[Guardian H02] Anomaly detection API failed:', error);
    return NextResponse.json(
      {
        error: 'Unable to generate anomaly detection.',
        code: 'ANOMALY_DETECTION_FAILED',
        details: message.slice(0, 200),
      },
      { status: 500 }
    );
  }
}
