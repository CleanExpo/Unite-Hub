/**
 * API Route: POST /api/founder/ops/queue/resume
 * Resumes the execution queue for a specific date
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/founder/ops/queue/resume' });

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

    // Resume queue using helper function
    const { data: result, error } = await supabase.rpc('resume_founder_ops_queue', {
      p_workspace_id: workspaceId,
      p_date: date,
    });

    if (error) {
throw error;
}

    logger.info('Queue resumed', { workspaceId, date, userId: user.id });

    return NextResponse.json({ success: true, resumed: true });
  } catch (error) {
    logger.error('Failed to resume queue', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
