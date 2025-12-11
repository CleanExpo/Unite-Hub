import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { generateCorrelationRecommendations } from '@/lib/guardian/ai/correlationRefiner';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Correlation Review API (H03)
 * POST /api/guardian/ai/correlation/review
 *
 * Returns AI-generated suggestions for improving correlation clusters.
 * Access: guardian_analyst and guardian_admin only
 *
 * Graceful degradation: Returns 503 if ANTHROPIC_API_KEY not configured
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

export async function POST(req: Request) {
  try {
    // Enforce analyst+ access
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[Guardian H03] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        {
          error: 'Guardian correlation refinement is not configured for this environment.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const windowHours = Number(body.windowHours ?? 72);
    const limitClusters = Number(body.limitClusters ?? 50);

    // Validate parameters
    if (windowHours < 1 || windowHours > 720) {
      // 1 hour to 30 days
      return NextResponse.json(
        { error: 'windowHours must be between 1 and 720' },
        { status: 400 }
      );
    }

    if (limitClusters < 1 || limitClusters > 200) {
      return NextResponse.json(
        { error: 'limitClusters must be between 1 and 200' },
        { status: 400 }
      );
    }

    // Generate AI recommendations
    const result = await generateCorrelationRecommendations({
      tenantId,
      windowHours,
      limitClusters,
    });

    // Store recommendations in guardian_ai_correlation_reviews
    const supabase = await createClient();

    for (const rec of result.recommendations) {
      const { error: insertError } = await supabase
        .from('guardian_ai_correlation_reviews')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          cluster_ids: rec.targetClusterIds,
          suggested_action: rec.action,
          model: 'claude-sonnet-4-5-20250929',
          ai_score: rec.score,
          confidence: rec.confidence,
          rationale: rec.rationale.slice(0, 500), // Limit rationale length
          applied: false,
        });

      if (insertError) {
        console.error('[Guardian H03] Failed to store recommendation:', insertError);
        // Don't throw - best effort telemetry
      }
    }

    console.log('[Guardian H03] Correlation refinement complete:', {
      tenantId,
      recommendations: result.recommendations.length,
      clusters: result.clustersSummary.length,
    });

    return NextResponse.json({
      recommendations: result.recommendations,
      meta: {
        model: 'claude-sonnet-4-5-20250929',
        generatedAt: new Date().toISOString(),
        windowHours,
        clustersAnalyzed: result.clustersSummary.length,
      },
    });
  } catch (error: unknown) {
    const message = String(error);

    // Handle specific error cases
    if (message.includes('FORBIDDEN')) {
      return NextResponse.json(
        {
          error: 'Guardian correlation refinement requires analyst or admin access.',
          code: 'FORBIDDEN',
        },
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
          error: 'Guardian correlation refinement is not configured.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Generic error
    console.error('[Guardian H03] Correlation refinement API failed:', error);
    return NextResponse.json(
      {
        error: 'Unable to generate correlation recommendations.',
        code: 'AI_GENERATION_FAILED',
        details: message.slice(0, 200),
      },
      { status: 500 }
    );
  }
}
