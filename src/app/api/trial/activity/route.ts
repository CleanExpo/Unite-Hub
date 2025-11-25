/**
 * API Route: /api/trial/activity
 * GET: Returns full trial audit history and summary for founders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ route: '/api/trial/activity' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
    const activityType = req.nextUrl.searchParams.get('activityType');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify founder role for this workspace
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.workspace_id !== workspaceId || profile.role !== 'founder') {
      return NextResponse.json({ error: 'Forbidden - Founder role required' }, { status: 403 });
    }

    // Get activity history
    const { data: activityHistory, error: activityError } = await supabase.rpc(
      'get_trial_activity',
      {
        p_workspace_id: workspaceId,
        p_limit: Math.min(limit, 1000), // Cap at 1000
        p_activity_type: activityType,
      }
    );

    if (activityError) {
      logger.error('Failed to retrieve activity', { error: activityError, workspaceId });
      return NextResponse.json({ error: 'Failed to retrieve activity' }, { status: 500 });
    }

    // Get activity summary
    const { data: activitySummary, error: summaryError } = await supabase.rpc(
      'get_trial_activity_summary',
      {
        p_workspace_id: workspaceId,
        p_since: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // Last 14 days
      }
    );

    if (summaryError) {
      logger.error('Failed to retrieve summary', { error: summaryError, workspaceId });
      return NextResponse.json({ error: 'Failed to retrieve summary' }, { status: 500 });
    }

    // Get limit hits
    const { data: limitHits, error: limitsError } = await supabase.rpc('get_trial_limit_hits', {
      p_workspace_id: workspaceId,
      p_limit: 50,
    });

    if (limitsError) {
      logger.error('Failed to retrieve limit hits', { error: limitsError, workspaceId });
      return NextResponse.json({ error: 'Failed to retrieve limit hits' }, { status: 500 });
    }

    // Get upgrade prompt history
    const { data: upgradeHistory, error: upgradeError } = await supabase.rpc(
      'get_trial_upgrade_prompt_history',
      {
        p_workspace_id: workspaceId,
      }
    );

    if (upgradeError) {
      logger.error('Failed to retrieve upgrade history', { error: upgradeError, workspaceId });
      return NextResponse.json({ error: 'Failed to retrieve upgrade history' }, { status: 500 });
    }

    logger.info('Trial activity retrieved', { workspaceId, activityCount: activityHistory?.length || 0 });

    return NextResponse.json({
      success: true,
      activity: activityHistory || [],
      summary: activitySummary || [],
      limitHits: limitHits || [],
      upgradePrompts: upgradeHistory || [],
      metadata: {
        totalActivities: activityHistory?.length || 0,
        activityTypes: activitySummary?.map((s: any) => s.activity_type) || [],
        limitHitsCount: limitHits?.length || 0,
        upgradePromptsCount: upgradeHistory?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Failed to get trial activity', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
