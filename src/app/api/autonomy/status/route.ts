/**
 * GET /api/autonomy/status
 * Retrieve status of a global autonomy run
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { globalAutonomyEngine } from '@/lib/autonomy';
import { apiRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await apiRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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

    const runId = req.nextUrl.searchParams.get('runId');
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!runId || !workspaceId) {
      return NextResponse.json(
        { error: 'runId and workspaceId are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify workspace access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { data: orgAccess } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .single();

    if (!orgAccess || orgAccess.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get run status
    const autonomyRun = await globalAutonomyEngine.getRunDetails(runId);

    // Filter events to last 50 for performance
    const recentEvents = autonomyRun.events.slice(-50);

    return NextResponse.json(
      {
        success: true,
        runId: autonomyRun.runId,
        objective: autonomyRun.objective,
        status: autonomyRun.status,
        autonomyScore: autonomyRun.autonomyScore,
        riskScore: autonomyRun.riskScore,
        uncertaintyScore: autonomyRun.uncertaintyScore,
        readinessScore: autonomyRun.readinessScore,
        consistencyScore: autonomyRun.consistencyScore,
        confidenceScore: autonomyRun.confidenceScore,
        activeAgents: autonomyRun.activeAgents,
        totalSteps: autonomyRun.totalSteps,
        completedSteps: autonomyRun.completedSteps,
        failedSteps: autonomyRun.failedSteps,
        events: recentEvents,
        eventCount: autonomyRun.events.length,
        startedAt: autonomyRun.startedAt,
        completedAt: autonomyRun.completedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting autonomy status:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to get autonomy status', details: message },
      { status: 500 }
    );
  }
}
