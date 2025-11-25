/**
 * POST /api/memory/retrieve
 * Retrieve and rank memories using hybrid search
 *
 * Implements multi-modal retrieval combining keyword search, temporal decay,
 * confidence filtering, and optional relationship traversal.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { MemoryRetriever, MemoryRanker } from '@/lib/memory';
import { apiRateLimit } from '@/lib/api-rate-limit';

interface RetrieveMemoryBody {
  workspaceId: string;
  query: string;
  memoryTypes?: string[];
  limit?: number;
  offset?: number;
  minImportance?: number;
  minConfidence?: number;
  includeRelated?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(
      `memory-retrieve:${clientId}`,
      200, // 200 requests
      3600 // per hour
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    // Authentication
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

    // Parse request body
    const body: RetrieveMemoryBody = await req.json();

    // Validate required fields
    if (!body.workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (!body.query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', body.workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Verify user is owner of workspace's org
    const { data: orgAccess, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .single();

    if (orgError || !orgAccess || orgAccess.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Retrieve memories
    const retriever = new MemoryRetriever();
    const ranker = new MemoryRanker();

    const retrieveResult = await retriever.retrieve({
      workspaceId: body.workspaceId,
      query: body.query,
      memoryTypes: body.memoryTypes,
      limit: body.limit || 10,
      offset: body.offset || 0,
      minImportance: body.minImportance,
      minConfidence: body.minConfidence,
      includeRelated: body.includeRelated !== false,
    });

    // Rank the results
    const rankingResult = await ranker.rank({
      memories: retrieveResult.memories.map(m => ({
        id: m.id,
        memoryType: m.memoryType,
        importance: m.importance,
        confidence: m.confidence,
        createdAt: m.createdAt,
        recallPriority: m.recallPriority,
      })),
      context: {
        query: body.query,
      },
    });

    // Combine retrieved data with ranking
    const rankedMemories = rankingResult.rankedMemories.map(ranked => {
      const original = retrieveResult.memories.find(m => m.id === ranked.id);
      return {
        ...original,
        rank: ranked.rank,
        percentile: ranked.percentile,
        scoreBreakdown: ranked.scoreBreakdown,
      };
    });

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'memory_retrieved',
      resource_type: 'memory',
      resource_id: body.workspaceId,
      details: {
        query: body.query,
        resultCount: rankedMemories.length,
        executionTime: retrieveResult.executionTimeMs,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        memories: rankedMemories,
        relatedMemories: retrieveResult.relatedMemories,
        totalCount: retrieveResult.totalCount,
        executionTimeMs: retrieveResult.executionTimeMs,
        retrievalStrategy: retrieveResult.retrievalStrategy,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving memories:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: 'Failed to retrieve memories',
        details: message,
      },
      { status: 500 }
    );
  }
}
