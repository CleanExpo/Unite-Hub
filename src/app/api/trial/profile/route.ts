/**
 * API Route: /api/trial/profile
 * GET: Return full trial profile including module access, usage counts, limits, and remaining capacity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { getTrialState, isTrialActive } from '@/lib/trial/trialExperienceEngine';

const logger = createApiLogger({ route: '/api/trial/profile' });

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
      .select('workspace_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.workspace_id !== workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get trial state
    const trialState = await getTrialState(workspaceId);
    const inTrial = await isTrialActive(workspaceId);

    logger.info('Trial profile retrieved', { workspaceId, inTrial });

    return NextResponse.json({
      success: true,
      isTrialActive: inTrial,
      trialState: trialState || {
        isTrialActive: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        trialExpiresAt: null,
        aiTokens: { used: 0, cap: 0, remaining: 0, percentUsed: 0, softCapExceeded: false },
        vifGenerations: { used: 0, cap: 0, remaining: 0, hardCapReached: false },
        blueprints: { created: 0, cap: 0, remaining: 0, hardCapReached: false },
        enabledModules: [],
        limitedModules: [],
        disabledModules: [],
      },
    });
  } catch (error) {
    logger.error('Failed to get trial profile', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
