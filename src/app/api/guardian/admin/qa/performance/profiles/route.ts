/**
 * GET /api/guardian/admin/qa/performance/profiles — List performance profiles
 * POST /api/guardian/admin/qa/performance/profiles — Create performance profile
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace, successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorBoundary(async (req: NextRequest, _context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const isActive = req.nextUrl.searchParams.get('isActive');
  const profileType = req.nextUrl.searchParams.get('profileType');
  const targetEntityType = req.nextUrl.searchParams.get('targetEntityType');

  await validateUserAndWorkspace(req, workspaceId);

  try {
    const supabase = getSupabaseServer();

    let query = supabase
      .from('guardian_performance_profiles')
      .select('*')
      .eq('tenant_id', workspaceId)
      .order('created_at', { ascending: false });

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    } else if (isActive === 'false') {
      query = query.eq('is_active', false);
    }

    if (profileType) {
      query = query.eq('profile_type', profileType);
    }

    if (targetEntityType) {
      query = query.eq('target_entity_type', targetEntityType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load profiles: ${error.message}`);
    }

    return successResponse({ profiles: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load profiles';
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

  const { name, description, profileType, targetEntityType, loadConfig, sloConfig, aiBudget } = body;

  if (!name || !profileType || !targetEntityType || !loadConfig || !sloConfig) {
    return errorResponse('name, profileType, targetEntityType, loadConfig, sloConfig required', 400);
  }

  if (!loadConfig.durationSeconds) {
    return errorResponse('loadConfig.durationSeconds required', 400);
  }

  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('guardian_performance_profiles')
      .insert({
        tenant_id: workspaceId,
        name,
        description,
        profile_type: profileType,
        target_entity_type: targetEntityType,
        target_entity_id: body.targetEntityId,
        load_config: loadConfig,
        slo_config: sloConfig,
        ai_budget: aiBudget || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return successResponse({ profile: data }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create profile';
    return errorResponse(message, 500);
  }
});
