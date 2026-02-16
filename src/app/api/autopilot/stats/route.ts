/**
 * Autopilot Stats API
 * Phase 89: Get autopilot statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getAutopilotStats } from '@/lib/autopilot';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const stats = await getAutopilotStats(workspaceId, days);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
