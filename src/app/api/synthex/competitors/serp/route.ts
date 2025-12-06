/**
 * Synthex Competitor SERP API
 * Phase B30: SERP Tracking and Analysis
 *
 * POST - Fetch SERP data for competitor keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchCompetitorSERP,
  getCompetitorKeywords,
  getKeywordGaps,
} from '@/lib/synthex/competitorIntelligenceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const competitorId = searchParams.get('competitorId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Get keyword gaps across all competitors
    if (action === 'gaps') {
      const gaps = await getKeywordGaps(tenantId);
      return NextResponse.json({ gaps, count: gaps.length });
    }

    // Get keywords for specific competitor
    if (competitorId) {
      const keywords = await getCompetitorKeywords(tenantId, competitorId, limit);
      return NextResponse.json({ keywords, count: keywords.length });
    }

    return NextResponse.json({ error: 'competitorId or action is required' }, { status: 400 });
  } catch (error) {
    console.error('Error in competitors/serp GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, competitor_id, keyword, keywords } = body;

    if (!tenant_id || !competitor_id) {
      return NextResponse.json(
        { error: 'tenant_id and competitor_id are required' },
        { status: 400 }
      );
    }

    // Batch fetch for multiple keywords
    if (keywords && Array.isArray(keywords)) {
      const results = [];
      for (const kw of keywords.slice(0, 10)) { // Limit to 10 at a time
        try {
          const result = await fetchCompetitorSERP(tenant_id, competitor_id, kw);
          results.push({ keyword: kw, ...result });
        } catch (err) {
          results.push({ keyword: kw, error: (err as Error).message });
        }
      }
      return NextResponse.json({ results });
    }

    // Single keyword fetch
    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const result = await fetchCompetitorSERP(tenant_id, competitor_id, keyword);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in competitors/serp POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
