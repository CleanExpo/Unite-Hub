/**
 * POST /api/executions/start
 * Phase 4: Task 2 - Start Strategy Execution
 *
 * Initializes and starts autonomous execution of a strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import StrategyExecutionEngine from '@/lib/strategy/execution-engine';

export async function POST(req: NextRequest) {
  try {
    // Get authorization
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
    const { strategyId, workspaceId } = await req.json();

    if (!strategyId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: strategyId, workspaceId' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const supabase = await getSupabaseServer();
    const { data: org, error: orgError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', workspaceId)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Initialize execution engine
    const engine = new StrategyExecutionEngine({
      strategyId,
      workspaceId,
      userId,
      autoRetry: true,
      maxRetries: 3,
    });

    // Initialize execution
    const executionContext = await engine.initializeExecution();

    // Start execution asynchronously
    engine.startExecution().catch((error) => {
      console.error(`Execution failed for ${executionContext.executionId}:`, error);
    });

    return NextResponse.json({
      success: true,
      executionId: executionContext.executionId,
      message: 'Strategy execution started',
      execution: {
        id: executionContext.executionId,
        status: executionContext.status,
        strategyId: executionContext.strategyId,
        startedAt: executionContext.startedAt,
        totalTasks: executionContext.totalTasks,
      },
    });
  } catch (error) {
    console.error('Execution start failed:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
