/**
 * Orchestrator Dashboard - Task List API
 *
 * GET /api/orchestrator/dashboard/tasks
 * Query params:
 *   - status: 'completed' | 'failed' | 'running' | 'pending'
 *   - limit: number (default 50)
 *   - sortBy: 'created_at' | 'duration' | 'status' (default 'created_at')
 *   - order: 'asc' | 'desc' (default 'desc')
 *   - workspaceId: string (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'OrchestratorDashboard' });

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('orchestrator_tasks')
      .select('*')
      .eq('workspace_id', workspaceId);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Sort
    const ascending = order === 'asc';
    if (sortBy === 'duration') {
      // Sort by computed duration (end_time - start_time)
      query = query.order('total_time_ms', { ascending });
    } else if (sortBy === 'status') {
      query = query.order('status', { ascending });
    } else {
      // Default: created_at
      query = query.order('created_at', { ascending });
    }

    // Limit
    query = query.limit(limit);

    const { data: tasks, error } = await query;

    if (error) {
      logger.error('Failed to fetch tasks', { error: error.message, workspaceId });
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    logger.info('Tasks fetched successfully', {
      workspaceId,
      count: tasks?.length || 0,
      status,
    });

    return NextResponse.json({
      tasks: tasks || [],
      count: tasks?.length || 0,
      filters: { status, limit, sortBy, order },
    });
  } catch (error) {
    logger.error('Task list endpoint error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
