/**
 * Founder Intel Briefing API
 * Phase 80: Generate on-demand briefings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { summariseSignalsForBriefing } from '@/lib/founderIntel/founderIntelAggregationService';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      timeframe_days = 7,
      include_opportunities = true,
      include_risks = true,
      include_recommendations = true,
    } = body;

    // Calculate timeframe
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - timeframe_days);

    const briefing = await summariseSignalsForBriefing(
      'global',
      {
        start: start.toISOString(),
        end: now.toISOString(),
      },
      {
        timeframe_days,
        include_opportunities,
        include_risks,
        include_recommendations,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        briefing,
        generated_at: now.toISOString(),
        timeframe_days,
      },
    });
  } catch (error) {
    console.error('Briefing generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
