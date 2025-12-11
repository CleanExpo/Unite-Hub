/**
 * Founder Weekly Digest API
 *
 * POST: Generate new weekly digest
 * GET: Fetch existing digests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { weeklyDigestService } from '@/lib/founderMemory';

export async function POST(req: NextRequest) {
  try {
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
    const { workspaceId, weekStartDate } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const weekStart = weekStartDate ? new Date(weekStartDate) : getLastMondayDate();

    const digest = await weeklyDigestService.generateDigest({
      founderId: userId,
      workspaceId,
      weekStart,
    });

    return NextResponse.json({
      success: true,
      digest: {
        id: digest.id,
        weekStart: digest.weekStart.toISOString(),
        weekEnd: digest.weekEnd.toISOString(),
        executiveSummary: digest.executiveSummary,
        wins: digest.winsJson,
        risks: digest.risksJson,
        opportunities: digest.opportunitiesJson,
        recommendations: digest.recommendationsJson,
        momentumSnapshot: digest.momentumSnapshotJson,
        patternsSummary: digest.patternsSummaryJson,
        keyMetrics: digest.keyMetricsJson,
        generatedAt: digest.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] POST /api/founder/memory/weekly-digest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const digestId = req.nextUrl.searchParams.get('digestId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '12');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Fetch specific digest
    if (digestId) {
      const digest = await weeklyDigestService.getDigestById(digestId, workspaceId);

      if (!digest) {
        return NextResponse.json({ error: 'Digest not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        digest: {
          id: digest.id,
          weekStart: digest.weekStart.toISOString(),
          weekEnd: digest.weekEnd.toISOString(),
          executiveSummary: digest.executiveSummary,
          wins: digest.winsJson,
          risks: digest.risksJson,
          opportunities: digest.opportunitiesJson,
          recommendations: digest.recommendationsJson,
          momentumSnapshot: digest.momentumSnapshotJson,
          patternsSummary: digest.patternsSummaryJson,
          keyMetrics: digest.keyMetricsJson,
          generatedAt: digest.generatedAt.toISOString(),
        },
      });
    }

    // Fetch digest history
    const digests = await weeklyDigestService.getDigestHistory(userId, workspaceId, limit);

    return NextResponse.json({
      success: true,
      digests: digests.map((d) => ({
        id: d.id,
        weekStart: d.weekStart.toISOString(),
        weekEnd: d.weekEnd.toISOString(),
        executiveSummary: d.executiveSummary,
        wins: d.winsJson,
        risks: d.risksJson,
        opportunities: d.opportunitiesJson,
        recommendations: d.recommendationsJson,
        momentumSnapshot: d.momentumSnapshotJson,
        patternsSummary: d.patternsSummaryJson,
        keyMetrics: d.keyMetricsJson,
        generatedAt: d.generatedAt.toISOString(),
      })),
      count: digests.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/weekly-digest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getLastMondayDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
