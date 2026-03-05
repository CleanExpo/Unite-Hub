/**
 * CTR Optimisation API Route
 * GET /api/seo-enhancement/ctr?workspaceId=&brandSlug=
 * Returns CTR opportunities from Search Console cached data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { searchConsoleService } from '@/lib/analytics/searchConsoleService';

/** Rough CTR benchmarks by SERP position */
function expectedCtr(position: number): number {
  if (position <= 1) return 0.28;
  if (position <= 2) return 0.15;
  if (position <= 3) return 0.10;
  if (position <= 4) return 0.07;
  if (position <= 5) return 0.05;
  if (position <= 6) return 0.04;
  if (position <= 7) return 0.03;
  if (position <= 8) return 0.025;
  if (position <= 9) return 0.02;
  if (position <= 10) return 0.018;
  return 0.01;
}

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const brandSlug = req.nextUrl.searchParams.get('brandSlug');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch cached Search Console data
    const cachedData = await searchConsoleService.getCachedData(
      workspaceId,
      brandSlug || undefined,
      'google_search_console'
    );

    if (!cachedData || !cachedData.queries || cachedData.queries.length === 0) {
      return NextResponse.json({
        opportunities: [],
        isStub: true,
        message: 'No Search Console data available. Connect Google Search Console to see CTR opportunities.',
      });
    }

    // Calculate CTR opportunities
    const opportunities = cachedData.queries
      .filter((q) => q.impressions >= 10) // Minimum impressions for meaningful data
      .map((q) => {
        const ctrExpected = expectedCtr(Math.round(q.position));
        const ctrGap = ctrExpected - q.ctr;
        return {
          query: q.query,
          clicks: q.clicks,
          impressions: q.impressions,
          ctr: Math.round(q.ctr * 10000) / 10000,
          position: Math.round(q.position * 10) / 10,
          ctrExpected: Math.round(ctrExpected * 10000) / 10000,
          ctrGap: Math.round(ctrGap * 10000) / 10000,
        };
      })
      .filter((o) => o.ctrGap > 0) // Only show where there is an actual gap
      .sort((a, b) => b.ctrGap - a.ctrGap); // Biggest opportunities first

    return NextResponse.json({
      opportunities: opportunities.slice(0, 50),
      totalAnalysed: cachedData.queries.length,
      dateRange: {
        start: cachedData.dateStart,
        end: cachedData.dateEnd,
      },
      source: cachedData.source,
    });
  } catch (error) {
    console.error('[ctr] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
