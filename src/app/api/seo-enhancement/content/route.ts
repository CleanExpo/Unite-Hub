/**
 * Content Optimization API Route
 * POST - Create new content analysis
 * GET - Get analysis history or specific result
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { contentOptimizationService } from '@/lib/seoEnhancement';

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
    const { workspaceId, url, targetKeyword, secondaryKeywords } = body;

    if (!workspaceId || !url || !targetKeyword) {
      return NextResponse.json(
        { error: 'workspaceId, url, and targetKeyword are required' },
        { status: 400 }
      );
    }

    const job = await contentOptimizationService.createContentAnalysis({
      workspaceId,
      url,
      targetKeyword,
      secondaryKeywords,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('[API] Content Optimization POST error:', error);
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
    const jobId = searchParams.get('jobId');
    const url = searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (jobId) {
      const result = await contentOptimizationService.getContentAnalysis(jobId);
      return NextResponse.json({ result });
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const history = await contentOptimizationService.getContentAnalysisHistory(workspaceId, {
      limit,
      url: url || undefined,
    });

    return NextResponse.json({ analyses: history });
  } catch (error) {
    console.error('[API] Content Optimization GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
