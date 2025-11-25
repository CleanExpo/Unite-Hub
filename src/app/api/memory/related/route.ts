/**
 * GET /api/memory/related
 * Find memories related to a specific memory through relationship graph
 *
 * Traverses the memory relationship graph to discover connected memories
 * at various depths for knowledge discovery and context assembly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { MemoryRetriever } from '@/lib/memory';
import { apiRateLimit } from '@/lib/api-rate-limit';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(
      `memory-related:${clientId}`,
      150, // 150 requests
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

    // Parse query parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const memoryId = req.nextUrl.searchParams.get('memoryId');
    const maxDepth = parseInt(req.nextUrl.searchParams.get('maxDepth') || '2', 10);
    const limitPerDepth = parseInt(req.nextUrl.searchParams.get('limitPerDepth') || '5', 10);
    const relationshipTypes = req.nextUrl.searchParams.get('relationshipTypes')?.split(',');

    // Validate required parameters
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId query parameter is required' },
        { status: 400 }
      );
    }

    if (!memoryId) {
      return NextResponse.json(
        { error: 'memoryId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify workspace access
    const supabase = await getSupabaseServer();

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
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

    // Verify memory exists in workspace
    const { data: memory, error: memError } = await supabase
      .from('ai_memory')
      .select('id')
      .eq('id', memoryId)
      .eq('workspace_id', workspaceId)
      .single();

    if (memError || !memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    // Find related memories
    const retriever = new MemoryRetriever();

    const graph = await retriever.findRelated({
      workspaceId,
      memoryId,
      relationshipTypes,
      maxDepth: Math.min(maxDepth, 5), // Cap at 5 levels
      limitPerDepth: Math.min(limitPerDepth, 20), // Cap at 20 per level
    });

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'memory_related_searched',
      resource_type: 'memory',
      resource_id: memoryId,
      details: {
        totalRelated: graph.totalRelated,
        depthTraversed: Object.keys(graph.byDepth).length,
        relationshipTypesCovered: graph.relationshipTypesCovered,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        rootMemoryId: graph.rootMemoryId,
        relatedMemories: graph.byDepth,
        totalRelated: graph.totalRelated,
        relationshipTypesCovered: graph.relationshipTypesCovered,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error finding related memories:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: 'Failed to find related memories',
        details: message,
      },
      { status: 500 }
    );
  }
}
