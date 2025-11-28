/**
 * Search Suite Keywords API
 *
 * Manage keyword tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { keywordTrackingService, KeywordStatus } from '@/lib/searchSuite';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const projectId = req.nextUrl.searchParams.get('projectId');
    const type = req.nextUrl.searchParams.get('type');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    if (type === 'stats') {
      const stats = await keywordTrackingService.getKeywordStats(projectId);
      return NextResponse.json({ stats });
    }

    if (type === 'trends') {
      const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
      const trends = await keywordTrackingService.getRankingTrends(projectId, days);
      return NextResponse.json({ trends });
    }

    if (type === 'movers') {
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
      const movers = await keywordTrackingService.getTopMovers(projectId, limit);
      return NextResponse.json(movers);
    }

    if (type === 'suggestions') {
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
      const suggestions = await keywordTrackingService.getSuggestedKeywords(projectId, limit);
      return NextResponse.json({ suggestions });
    }

    // Default: get keywords list
    const status = req.nextUrl.searchParams.get('status')?.split(',') as KeywordStatus[] | undefined;
    const tags = req.nextUrl.searchParams.get('tags')?.split(',');
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const hasRank = req.nextUrl.searchParams.get('hasRank');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const result = await keywordTrackingService.getKeywords(
      projectId,
      {
        status,
        tags,
        search,
        hasRank: hasRank === 'true' ? true : hasRank === 'false' ? false : undefined,
      },
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[SearchSuite] Error fetching keywords:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { action, projectId, workspaceId, keywords, keywordId, keywordIds, options, csvContent } = body;

    if (action === 'add') {
      if (!projectId || !workspaceId || !keywords || !Array.isArray(keywords)) {
        return NextResponse.json(
          { error: 'projectId, workspaceId, and keywords array required' },
          { status: 400 }
        );
      }

      const result = await keywordTrackingService.addKeywords(projectId, workspaceId, keywords, options);
      return NextResponse.json(result);
    }

    if (action === 'update') {
      if (!keywordId) {
        return NextResponse.json({ error: 'keywordId required' }, { status: 400 });
      }

      await keywordTrackingService.updateKeyword(keywordId, options);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!keywordIds || !Array.isArray(keywordIds)) {
        return NextResponse.json({ error: 'keywordIds array required' }, { status: 400 });
      }

      await keywordTrackingService.deleteKeywords(keywordIds);
      return NextResponse.json({ success: true, deleted: keywordIds.length });
    }

    if (action === 'import') {
      if (!projectId || !workspaceId || !csvContent) {
        return NextResponse.json(
          { error: 'projectId, workspaceId, and csvContent required' },
          { status: 400 }
        );
      }

      const result = await keywordTrackingService.importKeywordsFromCsv(projectId, workspaceId, csvContent);
      return NextResponse.json(result);
    }

    if (action === 'export') {
      if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
      }

      const csv = await keywordTrackingService.exportKeywordsToCsv(projectId);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="keywords-${projectId}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SearchSuite] Error processing keyword action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
