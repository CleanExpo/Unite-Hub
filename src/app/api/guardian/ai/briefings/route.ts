import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { generateExecutiveBriefing } from '@/lib/guardian/ai/executiveBriefing';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Executive Briefings API (H07)
 * GET: List historical briefings
 * POST: Generate new briefing
 *
 * Access: guardian_admin only
 * Graceful degradation: Returns 503 if AI disabled
 */

const ADMIN_ONLY = ['guardian_admin'];

export async function GET(req: Request) {
  try {
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    const url = new URL(req.url);
    const periodLabel = url.searchParams.get('periodLabel') || undefined;
    const limit = Number(url.searchParams.get('limit') || '30');

    const supabase = await createClient();

    let query = supabase
      .from('guardian_ai_briefings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    if (periodLabel) {
      query = query.eq('period_label', periodLabel);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ briefings: data ?? [] });
  } catch (error: unknown) {
    console.error('[Guardian H07] Failed to fetch briefings:', error);
    return NextResponse.json({ error: 'Unable to fetch briefings.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ADMIN_ONLY as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    // Check if ANTHROPIC_API_KEY configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'Guardian executive briefings are not configured for this environment.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const periodLabel = (body.periodLabel || '24h') as '24h' | '7d' | '30d' | 'custom';

    // Calculate period based on label
    let periodEnd = new Date();
    let periodStart: Date;

    if (body.periodStart && body.periodEnd) {
      periodStart = new Date(body.periodStart);
      periodEnd = new Date(body.periodEnd);
    } else {
      switch (periodLabel) {
        case '24h':
          periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          periodStart = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Validate period
    if (periodStart >= periodEnd) {
      return NextResponse.json({ error: 'periodStart must be before periodEnd' }, { status: 400 });
    }

    const windowDays = (periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000);
    if (windowDays > 30) {
      return NextResponse.json(
        { error: 'Period window cannot exceed 30 days' },
        { status: 400 }
      );
    }

    // Check if briefing already exists for this period
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('guardian_ai_briefings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period_start', periodStart.toISOString())
      .eq('period_end', periodEnd.toISOString())
      .eq('period_label', periodLabel)
      .maybeSingle();

    if (existing) {
      console.log('[Guardian H07] Returning existing briefing:', {
        tenantId,
        periodLabel,
      });
      return NextResponse.json({
        briefing: existing,
        meta: {
          cached: true,
          generatedAt: existing.created_at,
        },
      });
    }

    // Generate new briefing
    const result = await generateExecutiveBriefing({
      tenantId,
      periodStart,
      periodEnd,
      periodLabel,
      createdBy: userId,
    });

    // Fetch the stored briefing
    const { data: created } = await supabase
      .from('guardian_ai_briefings')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period_start', periodStart.toISOString())
      .eq('period_end', periodEnd.toISOString())
      .eq('period_label', periodLabel)
      .maybeSingle();

    return NextResponse.json({
      briefing: created,
      meta: {
        cached: false,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = String(error);

    if (message.includes('FEATURE_DISABLED')) {
      return NextResponse.json(
        {
          error: 'Executive briefings are disabled for this tenant.',
          code: 'FEATURE_DISABLED',
        },
        { status: 403 }
      );
    }

    if (message.includes('QUOTA_EXCEEDED')) {
      return NextResponse.json(
        { error: 'Daily AI quota exceeded.', code: 'QUOTA_EXCEEDED' },
        { status: 429 }
      );
    }

    console.error('[Guardian H07] Briefing generation failed:', error);
    return NextResponse.json(
      {
        error: 'Unable to generate executive briefing.',
        details: message.slice(0, 200),
      },
      { status: 500 }
    );
  }
}
