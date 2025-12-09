/**
 * API Route: POST /api/founder/ops/queue/pause
 * Pauses the execution queue for a specific date
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/ops/queue/pause' });

export async function POST(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body for reason
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || null;

    // Pause queue using helper function
    const { data: result, error } = await supabase.rpc('pause_founder_ops_queue', {
      p_workspace_id: workspaceId,
      p_date: date,
      p_user_id: user.id,
      p_reason: reason,
    });

    if (error) {
throw error;
}

    logger.info('Queue paused', { workspaceId, date, userId: user.id });

    return NextResponse.json({ success: true, paused: true });
  } catch (error) {
    logger.error('Failed to pause queue', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
