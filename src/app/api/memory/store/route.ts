/**
 * POST /api/memory/store
 * Store a memory entry in the unified memory system
 *
 * Handles memory storage with automatic keyword extraction,
 * embedding queueing, and initial relationship management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';
import { apiRateLimit } from '@/lib/api-rate-limit';

interface StoreMemoryBody {
  workspaceId: string;
  agent: string;
  memoryType: string;
  content: Record<string, any>;
  importance?: number;
  confidence?: number;
  uncertaintyNotes?: string;
  keywords?: string[];
  source?: string;
  parentMemoryId?: string;
  metadata?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await apiRateLimit(
      `memory-store:${clientId}`,
      100, // 100 requests
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
    const body: StoreMemoryBody = await req.json();

    // Validate required fields
    if (!body.workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (!body.agent) {
      return NextResponse.json(
        { error: 'agent is required' },
        { status: 400 }
      );
    }

    if (!body.memoryType) {
      return NextResponse.json(
        { error: 'memoryType is required' },
        { status: 400 }
      );
    }

    if (!body.content) {
      return NextResponse.json(
        { error: 'content is required' },
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

    // Store the memory
    const memoryStore = new MemoryStore();

    const result = await memoryStore.store({
      workspaceId: body.workspaceId,
      agent: body.agent,
      memoryType: body.memoryType as any,
      content: body.content,
      importance: body.importance,
      confidence: body.confidence,
      uncertaintyNotes: body.uncertaintyNotes,
      keywords: body.keywords,
      source: body.source,
      metadata: body.metadata,
      parentMemoryId: body.parentMemoryId,
    });

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      workspace_id: body.workspaceId,
      user_id: userId,
      action: 'memory_stored',
      resource_type: 'memory',
      resource_id: result.memoryId,
      details: {
        memoryType: body.memoryType,
        agent: body.agent,
        importance: body.importance ?? 50,
        confidence: body.confidence ?? 70,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        memoryId: result.memoryId,
        recallPriority: result.recallPriority,
        embeddingQueued: result.embeddingQueued,
        keywords: result.keywords,
        timestamp: result.timestamp,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error storing memory:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: 'Failed to store memory',
        details: message,
      },
      { status: 500 }
    );
  }
}
