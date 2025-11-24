/**
 * Client Agent Actions API
 * Phase 83: List and manage agent actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getPendingActions,
  getClientActionHistory,
  updateActionStatus,
  executeAction,
  recordExecution,
  getSession,
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
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status'); // 'pending', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    let actions;

    if (clientId) {
      // Get actions for specific client
      actions = await getClientActionHistory(clientId, workspaceId, limit);
    } else if (status === 'pending') {
      // Get pending actions
      actions = await getPendingActions(workspaceId, limit);
    } else {
      // Get all recent actions
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase
        .from('client_agent_actions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      actions = data || [];
    }

    return NextResponse.json({ data: actions });
  } catch (error) {
    console.error('Get actions error:', error);
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
    const { action_id, approval_status, rejection_reason } = body;

    if (!action_id || !approval_status) {
      return NextResponse.json(
        { error: 'action_id and approval_status are required' },
        { status: 400 }
      );
    }

    // Get the action
    const supabase = await getSupabaseServer();
    const { data: action, error: fetchError } = await supabase
      .from('client_agent_actions')
      .select('*')
      .eq('id', action_id)
      .single();

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Update status
    await updateActionStatus(action_id, approval_status, userId, rejection_reason);

    // Execute if approved
    if (approval_status === 'approved_executed') {
      const result = await executeAction(action);
      await recordExecution(action_id, result);

      return NextResponse.json({
        success: true,
        execution_result: result,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
