/**
 * API Route: /api/convex/search
 *
 * Handles advanced search and filtering:
 * - GET: Execute complex search queries
 * - POST: Save search filters, get analytics
 * - DELETE: Remove saved search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const searchText = req.nextUrl.searchParams.get('search');
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'score';
    const sortOrder = req.nextUrl.searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const analytics = req.nextUrl.searchParams.get('analytics') === 'true';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (analytics) {
      // Get search analytics for workspace
      const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
      const since = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from('convex_search_analytics')
        .select('search_text, filters, result_count')
        .eq('workspace_id', workspaceId)
        .gte('created_at', since);

      if (error) {
        logger.error('[SEARCH] Analytics error:', error);
        return NextResponse.json(
          { error: 'Failed to get analytics' },
          { status: 500 }
        );
      }

      const searches = data || [];
      const topTerms: Record<string, number> = {};
      const topFilters: Record<string, number> = {};
      let totalResults = 0;
      let successCount = 0;

      searches.forEach((s: any) => {
        if (s.search_text) {
          topTerms[s.search_text] = (topTerms[s.search_text] || 0) + 1;
        }

        if (s.filters) {
          const filters = typeof s.filters === 'string' ? JSON.parse(s.filters) : s.filters;
          if (Array.isArray(filters)) {
            filters.forEach((f: any) => {
              topFilters[f.field] = (topFilters[f.field] || 0) + 1;
            });
          }
        }

        if (s.result_count) {
          totalResults += s.result_count;
          if (s.result_count > 0) successCount++;
        }
      });

      const topSearchTerms = Object.entries(topTerms)
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topFiltersArray = Object.entries(topFilters)
        .map(([field, count]) => ({ field, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return NextResponse.json({
        totalSearches: searches.length,
        averageResults: searches.length > 0 ? totalResults / searches.length : 0,
        topSearchTerms,
        topFilters: topFiltersArray,
        successRate: searches.length > 0 ? (successCount / searches.length) * 100 : 0,
      });
    }

    // Execute search query
    let query = supabase
      .from('convex_strategy_scores')
      .select(
        'id, strategy_id, convex_score, compliance_status, created_at, metadata'
      )
      .eq('workspace_id', workspaceId);

    // Apply text search
    if (searchText) {
      query = query.ilike('metadata->businessName', `%${searchText}%`);
    }

    // Apply sorting
    const sortField = sortBy === 'score' ? 'convex_score' : 'created_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('[SEARCH] Query error:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    // Calculate relevance scores if search text provided
    let results = (data || []).map((r: any) => ({
      ...r,
      relevance: calculateRelevance(r, searchText),
    }));

    if (searchText) {
      results = results
        .filter((r: any) => r.relevance > 0)
        .sort((a: any, b: any) => b.relevance - a.relevance);
    }

    // Log search analytics
    if (searchText) {
      await supabase
        .from('convex_search_analytics')
        .insert([
          {
            workspace_id: workspaceId,
            search_text: searchText,
            result_count: results.length,
            user_id: 'anonymous', // Would need actual user context
          },
        ]);
    }

    logger.info(`[SEARCH] Search returned ${results.length} results`);

    return NextResponse.json({
      results,
      total: results.length,
      offset,
      limit,
    });
  } catch (error) {
    logger.error('[SEARCH] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
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
    const { workspaceId, action, name, description, filters, savedSearchId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    if (action === 'saveSearch') {
      if (!name || !filters) {
        return NextResponse.json(
          { error: 'Missing name or filters' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('convex_saved_searches')
        .insert([
          {
            workspace_id: workspaceId,
            name,
            description,
            filters,
            created_by: userId,
            usageCount: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('[SEARCH] Save search error:', error);
        return NextResponse.json(
          { error: 'Failed to save search' },
          { status: 500 }
        );
      }

      logger.info(`[SEARCH] Search saved: ${name}`);
      return NextResponse.json(data, { status: 201 });
    }

    if (action === 'loadSearch') {
      if (!savedSearchId) {
        return NextResponse.json(
          { error: 'Missing savedSearchId' },
          { status: 400 }
        );
      }

      // Update usage tracking
      const { data, error: updateError } = await supabase
        .from('convex_saved_searches')
        .update({
          last_used_at: new Date().toISOString(),
          usageCount: supabase.raw('usageCount + 1'),
        })
        .eq('id', savedSearchId)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (updateError) {
        logger.error('[SEARCH] Load search error:', updateError);
        return NextResponse.json(
          { error: 'Failed to load search' },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    }

    if (action === 'getSavedSearches') {
      const { data, error } = await supabase
        .from('convex_saved_searches')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('usageCount', { ascending: false });

      if (error) {
        logger.error('[SEARCH] Get saved searches error:', error);
        return NextResponse.json(
          { error: 'Failed to get saved searches' },
          { status: 500 }
        );
      }

      return NextResponse.json(data || []);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[SEARCH] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
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
    const { savedSearchId } = body;

    if (!savedSearchId) {
      return NextResponse.json(
        { error: 'Missing savedSearchId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_saved_searches')
      .delete()
      .eq('id', savedSearchId)
      .eq('created_by', userId);

    if (error) {
      logger.error('[SEARCH] Delete search error:', error);
      return NextResponse.json(
        { error: 'Failed to delete search' },
        { status: 500 }
      );
    }

    logger.info(`[SEARCH] Saved search deleted: ${savedSearchId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[SEARCH] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function
function calculateRelevance(result: any, searchText: string): number {
  if (!searchText) return 0;

  let score = 0;
  const searchLower = searchText.toLowerCase();
  const businessNameLower = (result.metadata?.businessName || '').toLowerCase();
  const frameworkLower = (result.metadata?.framework || '').toLowerCase();

  // Exact match
  if (businessNameLower === searchLower) score += 100;
  // Starts with
  else if (businessNameLower.startsWith(searchLower)) score += 80;
  // Contains
  else if (businessNameLower.includes(searchLower)) score += 60;

  // Framework match
  if (frameworkLower === searchLower) score += 20;
  else if (frameworkLower.includes(searchLower)) score += 10;

  return Math.min(100, score);
}
