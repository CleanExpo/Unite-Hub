/**
 * Scheduler API Route
 * Phase 87: Process scheduled posts through preflight and execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  processDueSchedules,
  getSchedulerStatus,
  getUpcomingSchedules,
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
    const type = req.nextUrl.searchParams.get('type');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Get status
    if (type === 'status') {
      const status = await getSchedulerStatus(workspaceId);
      return NextResponse.json({ data: status });
    }

    // Get upcoming
    if (type === 'upcoming') {
      const upcoming = await getUpcomingSchedules(workspaceId, limit);
      return NextResponse.json({ data: upcoming });
    }

    // Default: return both
    const [status, upcoming] = await Promise.all([
      getSchedulerStatus(workspaceId),
      getUpcomingSchedules(workspaceId, limit),
    ]);

    return NextResponse.json({
      data: {
        status,
        upcoming,
      },
    });
  } catch (error: unknown) {
    console.error('Scheduler GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { action, workspaceId } = body;

    if (action === 'process') {
      // Process due schedules
      const results = await processDueSchedules(workspaceId);

      const summary = {
        processed: results.length,
        passed: results.filter(r => r.preflightPassed).length,
        executed: results.filter(r => r.executed).length,
        failed: results.filter(r => r.error).length,
        results,
      };

      return NextResponse.json({ data: summary });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "process"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Scheduler POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
