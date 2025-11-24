/**
 * Orchestration Scheduler API
 * Phase 84: Manual trigger for orchestration passes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  runDailyOrchestrationPass,
  runWeeklyCampaignPlanning,
  getRecentActions,
  getActionStats,
} from '@/lib/orchestration';

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
    const type = searchParams.get('type'); // 'actions', 'stats'
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'actions': {
        const actions = await getRecentActions(workspaceId, limit);
        return NextResponse.json({ data: actions });
      }

      case 'stats': {
        const days = parseInt(searchParams.get('days') || '7');
        const stats = await getActionStats(workspaceId, days);
        return NextResponse.json({ data: stats });
      }

      default:
        // Return both
        const [actions, stats] = await Promise.all([
          getRecentActions(workspaceId, 20),
          getActionStats(workspaceId, 7),
        ]);
        return NextResponse.json({ data: { actions, stats } });
    }
  } catch (error) {
    console.error('Get scheduler data error:', error);
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

    switch (action) {
      case 'run_daily': {
        const result = await runDailyOrchestrationPass(workspace_id);
        return NextResponse.json({ data: result });
      }

      case 'run_weekly': {
        const result = await runWeeklyCampaignPlanning(workspace_id);
        return NextResponse.json({ data: result });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Use run_daily or run_weekly' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Scheduler run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
