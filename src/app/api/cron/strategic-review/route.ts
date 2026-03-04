/**
 * Cron: 3-Hour Strategic Review
 * GET /api/cron/strategic-review
 *
 * Runs every 3 hours via Vercel Cron.
 * Fetches latest business signals from Supabase alerts,
 * generates a 3-paragraph market intelligence summary via Claude Haiku,
 * and inserts the result into the alerts table as a strategic_review type.
 *
 * Auth: CRON_SECRET header
 * Related to: UNI-1384
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── 1. Fetch latest business signals ────────────────────────────────────
    const { data: recentAlerts } = await supabaseAdmin
      .from('alerts')
      .select('type, severity, message, service, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: recentBriefings } = await supabaseAdmin
      .from('founder_weekly_briefings')
      .select('week_starting, summary_text')
      .order('created_at', { ascending: false })
      .limit(1);

    const signalContext = [
      'Recent alerts (last 20):',
      JSON.stringify(recentAlerts ?? [], null, 2),
      '',
      'Latest weekly briefing:',
      recentBriefings?.[0]?.summary_text ?? 'No briefings available',
    ].join('\n');

    // ── 2. Generate AI summary ──────────────────────────────────────────────
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY not configured' },
        { status: 200 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `You are the strategic intelligence engine for Unite-Group, an Australian multi-business conglomerate (Disaster Recovery, Restore Assist, ATO Consulting, NRPG, Unite Group).

Based on the following business signals, produce a concise 3-paragraph strategic review:
- Paragraph 1: Current operational status and any critical issues
- Paragraph 2: Key trends and patterns across the business units
- Paragraph 3: Recommended actions for the next 3 hours

Use Australian English. Be direct and data-driven. No filler.

Business signals:
${signalContext}`,
        },
      ],
    });

    const summary =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // ── 3. Store in alerts table ────────────────────────────────────────────
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('alerts')
      .insert({
        workspace_id: process.env.DEFAULT_WORKSPACE_ID ?? '00000000-0000-0000-0000-000000000000',
        type: 'strategic_review',
        severity: 'info',
        message: summary,
        service: 'strategic-review-cron',
        sent_at: new Date().toISOString(),
        acknowledged: false,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[cron/strategic-review] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      alertId: inserted?.id,
      summary: summary.slice(0, 200) + '...',
    });
  } catch (err) {
    console.error('[cron/strategic-review]', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 200 }
    );
  }
}
