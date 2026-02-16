/**
 * Execute API Route
 * Phase 87: Execute posts and manage executions
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  executePost,
  listExecutions,
  getExecutionById,
  getExecutionStats,
  retryExecution,
} from '@/lib/postingExecution';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const executionId = req.nextUrl.searchParams.get('id');
    const type = req.nextUrl.searchParams.get('type');
    const clientId = req.nextUrl.searchParams.get('clientId');
    const channel = req.nextUrl.searchParams.get('channel');
    const status = req.nextUrl.searchParams.get('status');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7');

    // Get single execution
    if (executionId) {
      const execution = await getExecutionById(executionId);
      if (!execution) {
        return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
      }
      return NextResponse.json({ data: execution });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Get stats
    if (type === 'stats') {
      const stats = await getExecutionStats(workspaceId, days);
      return NextResponse.json({ data: stats });
    }

    // List executions
    const executions = await listExecutions(workspaceId, {
      clientId: clientId || undefined,
      channel: channel as any || undefined,
      status: status as any || undefined,
      limit,
    });

    return NextResponse.json({ data: executions });
  } catch (error: unknown) {
    console.error('Execute GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | undefined;
    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();
    const { action, preflightId, payload, force, forceReason, executionId } = body;

    // Retry action
    if (action === 'retry') {
      if (!executionId) {
        return NextResponse.json({ error: 'executionId required for retry' }, { status: 400 });
      }
      const result = await retryExecution(executionId);
      return NextResponse.json({ data: result });
    }

    // Execute action
    if (!preflightId || !payload) {
      return NextResponse.json(
        { error: 'preflightId and payload required' },
        { status: 400 }
      );
    }

    const result = await executePost({
      preflightId,
      payload,
      force,
      forcedBy: force ? userId : undefined,
      forceReason,
    });

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    console.error('Execute POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
