/**
 * Trigger Scout Agent
 * POST /api/client/market-intelligence/scout
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { withErrorBoundary, successResponse, errorResponse } from '@/lib/api-helpers';
import { getScoutAgent } from '@/lib/agents/authority/scout-agent';

export const dynamic = 'force-dynamic';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const body = await req.json();
  const { clientId, workspaceId, pathway, targetState, targetService } = body;

  if (!clientId || !workspaceId || !pathway) {
    return errorResponse('clientId, workspaceId, and pathway required', 400);
  }

  if (!['geographic', 'content', 'hybrid'].includes(pathway)) {
    return errorResponse('pathway must be geographic, content, or hybrid', 400);
  }

  // Queue Scout task
  const scout = getScoutAgent();

  const task = {
    id: `scout-${Date.now()}`,
    task_type: 'scout_discovery',
    workspace_id: workspaceId,
    payload: {
      clientId,
      pathway,
      targetState,
      targetService,
      maxGaps: 20,
    },
    priority: 7,
    retry_count: 0,
    max_retries: 3,
  };

  try {
    // Execute Scout task (async)
    const result = await scout['processTask'](task); // Access protected method

    return successResponse({
      message: 'Scout analysis started',
      taskId: task.id,
      vacuumsFound: result.totalVacuumsFound,
      pathway: result.pathway,
      costUsd: result.costUsd,
    });
  } catch (error: any) {
    return errorResponse(`Scout task failed: ${error.message}`, 500);
  }
});
