/**
 * Founder Overload Detection API
 *
 * GET: Get current overload analysis
 * POST: Run fresh overload detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { overloadDetectionService } from '@/lib/founderMemory';

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

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const analysis = await overloadDetectionService.getLatestAnalysis(userId, workspaceId);

    if (!analysis) {
      return NextResponse.json({
        success: true,
        analysis: null,
        message: 'No overload analysis found. Run POST to generate one.',
      });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        overallSeverity: analysis.overallSeverity,
        overallScore: analysis.overallScore,
        indicators: analysis.indicators,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/overload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const analysis = await overloadDetectionService.analyzeOverload({
      founderId: userId,
      workspaceId,
    });

    return NextResponse.json({
      success: true,
      analysis: {
        overallSeverity: analysis.overallSeverity,
        overallScore: analysis.overallScore,
        indicators: analysis.indicators,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] POST /api/founder/memory/overload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
