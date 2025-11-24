/**
 * Client Agent Scheduler API
 * Phase 83: Scheduled evaluation and overview endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  runScheduledEvaluation,
  getAgentOverview,
  getActionSummary,
  getOverdueActions,
  getRecentSessions,
} from '@/lib/clientAgent';

export async function GET(req: NextRequest) {
  try {
    // Auth check
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

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type'); // 'overview', 'summary', 'overdue', 'sessions'

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'overview': {
        const overview = await getAgentOverview(workspaceId);
        return NextResponse.json({ data: overview });
      }

      case 'summary': {
        const days = parseInt(searchParams.get('days') || '7');
        const summary = await getActionSummary(workspaceId, days);
        return NextResponse.json({ data: summary });
      }

      case 'overdue': {
        const hours = parseInt(searchParams.get('hours') || '24');
        const overdue = await getOverdueActions(workspaceId, hours);
        return NextResponse.json({ data: overdue });
      }

      case 'sessions': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const sessions = await getRecentSessions(workspaceId, limit);
        return NextResponse.json({ data: sessions });
      }

      default:
        // Return overview by default
        const overview = await getAgentOverview(workspaceId);
        return NextResponse.json({ data: overview });
    }
  } catch (error) {
    console.error('Scheduler GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
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
    const { workspace_id, action } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (action === 'run_evaluation') {
      const result = await runScheduledEvaluation(workspace_id);
      return NextResponse.json({ data: result });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Scheduler POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
