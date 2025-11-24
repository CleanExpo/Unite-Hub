/**
 * Orchestration Schedules API
 * Phase 84: List and manage orchestration schedules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getOrchestrationOverview,
  getChannelSummaries,
  approveSchedule,
  cancelSchedule,
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
    const type = searchParams.get('type'); // 'overview', 'channels', 'list'
    const clientId = searchParams.get('clientId');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    switch (type) {
      case 'overview': {
        const overview = await getOrchestrationOverview(workspaceId);
        return NextResponse.json({ data: overview });
      }

      case 'channels': {
        const summaries = await getChannelSummaries(workspaceId);
        return NextResponse.json({ data: summaries });
      }

      default: {
        // List schedules
        let query = supabase
          .from('campaign_orchestration_schedules')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('scheduled_for', { ascending: true })
          .limit(limit);

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        if (channel) {
          query = query.eq('channel', channel);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return NextResponse.json({ data: data || [] });
      }
    }
  } catch (error) {
    console.error('Get schedules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
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
    const { schedule_id, action, reason } = body;

    if (!schedule_id || !action) {
      return NextResponse.json(
        { error: 'schedule_id and action are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'approve':
        await approveSchedule(schedule_id, userId);
        break;
      case 'cancel':
        await cancelSchedule(schedule_id, reason || 'Cancelled by user');
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
