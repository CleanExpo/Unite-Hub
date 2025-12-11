import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { generateRuleSuggestions } from '@/lib/guardian/ai/ruleAssistant';

/**
 * Guardian AI Rule Suggestions API (H01)
 * POST /api/guardian/ai/rules/suggest
 *
 * Returns AI-generated rule suggestions using Claude Sonnet 4.5.
 * Access: guardian_admin only (rule authoring is admin-only operation)
 *
 * Graceful degradation: Returns 503 if ANTHROPIC_API_KEY not configured
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function POST(req: Request) {
  try {
    // Enforce admin-only access
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[Guardian H01] ANTHROPIC_API_KEY not configured');
      return NextResponse.json(
        {
          error: 'Guardian AI suggestions are not configured for this environment.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));

    // Validate and limit input sizes to prevent abuse
    const ruleName = String(body.ruleName || '').slice(0, 200);
    const existingDescription = String(body.existingDescription || '').slice(0, 1000);

    const input = {
      tenantId,
      userId,
      ruleId: body.ruleId || null,
      ruleName: ruleName || undefined,
      severity: body.severity as any,
      source: body.source as any,
      channel: body.channel as any,
      existingConditions: body.existingConditions,
      existingDescription: existingDescription || undefined,
      contextMeta: {
        requestedAt: new Date().toISOString(),
      },
    };

    // Generate suggestions via AI service
    const suggestions = await generateRuleSuggestions(input);

    return NextResponse.json({
      suggestions,
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
        { error: 'Guardian AI suggestions require admin access.', code: 'FORBIDDEN' },
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
          error: 'Guardian AI suggestions are not configured.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Generic error
    console.error('[Guardian H01] AI suggestion API failed:', error);
    return NextResponse.json(
      {
        error: 'Unable to generate rule suggestions.',
        code: 'AI_GENERATION_FAILED',
        details: message.slice(0, 200),
      },
      { status: 500 }
    );
  }
}
