// app/api/media/search/route.ts
// Phase 2: Media Search API
// Full-text search across transcripts and AI analysis
// CREATED: 2025-01-17

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * GET /api/media/search?workspaceId={id}&q={query}&fileType={type}&projectId={id}
 * Search media files by content (transcripts, AI analysis, filenames)
 */
export async function GET(req: NextRequest) {
  try {
    // ✅ CORRECT AUTH PATTERN
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = data.user.id;
    }

    const { searchParams } = req.nextUrl;
    const workspaceId = searchParams.get('workspaceId');
    const query = searchParams.get('q');
    const fileType = searchParams.get('fileType');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json({
        error: 'workspaceId required for workspace isolation'
      }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Build query
    let dbQuery = supabase
      .from('media_files')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (fileType) {
      dbQuery = dbQuery.eq('file_type', fileType);
    }

    if (projectId) {
      dbQuery = dbQuery.eq('project_id', projectId);
    }

    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    // Full-text search if query provided
    if (query && query.trim().length > 0) {
      // Search across filename, transcript, and AI analysis using full_text_search column
      dbQuery = dbQuery.textSearch('full_text_search', query, {
        type: 'websearch', // Supports multiple words and phrases
        config: 'english',
      });
    }

    const { data: media, error, count } = await dbQuery;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({
        error: 'Search failed',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      media: media || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });

  } catch (error) {
    console.error('❌ Media search error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
