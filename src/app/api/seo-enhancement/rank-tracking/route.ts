/**
 * Rank Tracking API Route
 * GET /api/seo-enhancement/rank-tracking?workspaceId=&brandSlug=
 * Returns tracked keywords with position history for the last 7 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

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

    // Query last 7 days of rank tracking data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFloor = sevenDaysAgo.toISOString().split('T')[0];

    let query = supabase
      .from('rank_tracking')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('date_recorded', dateFloor)
      .order('date_recorded', { ascending: false })
      .order('position', { ascending: true })
      .limit(500);

    if (brandSlug) {
      query = query.eq('brand_slug', brandSlug);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('[rank-tracking] DB error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        keywords: [],
        isStub: true,
        message: 'No rank tracking data yet. Configure DataForSEO integration to start tracking.',
      });
    }

    // Group by keyword, build trend arrays
    const keywordMap = new Map<string, {
      keyword: string;
      position: number | null;
      change: number;
      volume: number;
      url: string | null;
      cpc: number;
      difficulty: number;
      trend: { date: string; position: number | null }[];
    }>();

    for (const row of rows) {
      const key = row.keyword;
      if (!keywordMap.has(key)) {
        keywordMap.set(key, {
          keyword: row.keyword,
          position: row.position,
          change: row.change ?? 0,
          volume: row.volume ?? 0,
          url: row.url,
          cpc: Number(row.cpc) || 0,
          difficulty: row.difficulty ?? 0,
          trend: [],
        });
      }
      keywordMap.get(key)!.trend.push({
        date: row.date_recorded,
        position: row.position,
      });
    }

    // Sort trends chronologically within each keyword
    for (const entry of keywordMap.values()) {
      entry.trend.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Sort keywords by position (ascending), nulls last
    const keywords = Array.from(keywordMap.values()).sort((a, b) => {
      if (a.position === null && b.position === null) return 0;
      if (a.position === null) return 1;
      if (b.position === null) return -1;
      return a.position - b.position;
    });

    return NextResponse.json({
      keywords: keywords.slice(0, 20),
      recordedAt: rows[0]?.date_recorded,
      brandSlug: brandSlug || null,
      totalTracked: keywordMap.size,
    });
  } catch (error) {
    console.error('[rank-tracking] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
