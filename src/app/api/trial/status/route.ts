/**
 * API Route: /api/trial/status
 * GET: Fast lookup endpoint for trial state to avoid overfetching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { isTrialActive, getRemainingCapacity } from '@/lib/trial/trialExperienceEngine';

const logger = createApiLogger({ route: '/api/trial/status' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this workspace
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get trial status (lightweight)
    const inTrial = await isTrialActive(workspaceId);
    const capacity = await getRemainingCapacity(workspaceId);

    logger.debug('Trial status checked', { workspaceId, inTrial });

    return NextResponse.json({
      success: true,
      isTrialActive: inTrial,
      capacity: capacity || {
        aiTokensRemaining: 0,
        vifGenerationsRemaining: 0,
        blueprintsRemaining: 0,
        capacityPercent: 0,
      },
    });
  } catch (error) {
    logger.error('Failed to get trial status', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
