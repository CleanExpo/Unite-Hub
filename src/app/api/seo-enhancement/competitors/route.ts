/**
 * Competitor Gap Analysis API Route
 * POST - Add competitor, run analysis
 * GET - Get competitors, gap analyses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { competitorGapService } from '@/lib/seoEnhancement';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action, workspaceId, clientDomain } = body;

    if (!workspaceId || !clientDomain) {
      return NextResponse.json(
        { error: 'workspaceId and clientDomain are required' },
        { status: 400 }
      );
    }

    // Add competitor
    if (action === 'addCompetitor') {
      const { competitorDomain, competitorName } = body;

      if (!competitorDomain) {
        return NextResponse.json(
          { error: 'competitorDomain is required' },
          { status: 400 }
        );
      }

      const competitor = await competitorGapService.addCompetitor(
        workspaceId,
        clientDomain,
        competitorDomain,
        competitorName
      );

      return NextResponse.json({ competitor });
    }

    // Analyze keyword gap
    if (action === 'analyzeKeywords') {
      const analysis = await competitorGapService.analyzeKeywordGap(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ analysis });
    }

    // Analyze content gap
    if (action === 'analyzeContent') {
      const analysis = await competitorGapService.analyzeContentGap(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ analysis });
    }

    // Analyze backlink gap
    if (action === 'analyzeBacklinks') {
      const analysis = await competitorGapService.analyzeBacklinkGap(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ analysis });
    }

    // Run all analyses
    if (action === 'analyzeAll') {
      const [keywordGap, contentGap, backlinkGap] = await Promise.all([
        competitorGapService.analyzeKeywordGap(workspaceId, clientDomain),
        competitorGapService.analyzeContentGap(workspaceId, clientDomain),
        competitorGapService.analyzeBacklinkGap(workspaceId, clientDomain),
      ]);

      return NextResponse.json({ keywordGap, contentGap, backlinkGap });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] Competitors POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const clientDomain = searchParams.get('clientDomain');
    const type = searchParams.get('type') || 'competitors';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get competitor list
    if (type === 'competitors' && clientDomain) {
      const competitors = await competitorGapService.getCompetitors(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ competitors });
    }

    // Get keyword gap analysis
    if (type === 'keywords' && clientDomain) {
      const analysis = await competitorGapService.getKeywordGapAnalysis(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ analysis });
    }

    // Get content gap analysis
    if (type === 'content' && clientDomain) {
      const analysis = await competitorGapService.getContentGapAnalysis(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ analysis });
    }

    // Get backlink gap analysis
    if (type === 'backlinks' && clientDomain) {
      const analysis = await competitorGapService.getBacklinkGapAnalysis(
        workspaceId,
        clientDomain
      );
      return NextResponse.json({ analysis });
    }

    // Get all analyses
    if (type === 'all' && clientDomain) {
      const [competitors, keywordGap, contentGap, backlinkGap] = await Promise.all([
        competitorGapService.getCompetitors(workspaceId, clientDomain),
        competitorGapService.getKeywordGapAnalysis(workspaceId, clientDomain),
        competitorGapService.getContentGapAnalysis(workspaceId, clientDomain),
        competitorGapService.getBacklinkGapAnalysis(workspaceId, clientDomain),
      ]);

      return NextResponse.json({
        competitors,
        keywordGap,
        contentGap,
        backlinkGap,
      });
    }

    return NextResponse.json(
      { error: 'clientDomain is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Competitors GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
