/**
 * GET /api/guardian/admin/qa/performance/runs — List performance runs
 * POST /api/guardian/admin/qa/performance/runs — Start new performance run
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';
import { runPerformanceProfile } from '@/lib/guardian/qa/performanceRunner';

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const profileId = req.nextUrl.searchParams.get('profileId');
  const status = req.nextUrl.searchParams.get('status');
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10));

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const supabase = getSupabaseServer();

    let query = supabase
      .from('guardian_performance_runs')
      .select('*')
      .eq('tenant_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load runs: ${error.message}`);
    }

    return successResponse({ runs: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load runs';
    return errorResponse(message, 500);
  }
});

export const POST = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON in request body', 400);
  }

  const { profileId } = body;

  if (!profileId) {
    return errorResponse('profileId required', 400);
  }

  try {
    const supabase = getSupabaseServer();

    // Load profile
    const { data: profile, error: profileError } = await supabase
      .from('guardian_performance_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('tenant_id', workspaceId)
      .single();

    if (profileError || !profile) {
      return errorResponse('Profile not found', 404);
    }

    // Run performance test (fire-and-forget, non-blocking)
    // In production, this would be queued to a background job system
    const runPromise = runPerformanceProfile({
      tenantId: workspaceId,
      profile: {
        id: profile.id,
        name: profile.name,
        profileType: profile.profile_type,
        targetEntityType: profile.target_entity_type,
        targetEntityId: profile.target_entity_id,
        loadConfig: profile.load_config,
        sloConfig: profile.slo_config,
        aiBudget: profile.ai_budget,
      },
      actorId: body.actorId,
      now: new Date(),
    }).catch((err) => {
      console.error('Performance run failed:', err);
    });

    // Start background execution
    if (typeof runPromise === 'object' && runPromise !== null && 'catch' in runPromise) {
      // Non-blocking: don't await
      void runPromise;
    }

    return successResponse({ message: 'Performance run started', profileId }, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start run';
    return errorResponse(message, 500);
  }
});
