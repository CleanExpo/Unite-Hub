/**
 * API Routes: Agent Rule Violations
 * Query and analyze rule violations
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getRulesEngine } from '@/lib/agents/rules/rulesEngine';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/agents/violations
 * List recent rule violations
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
return rateLimitResult;
}

  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const agentName = req.nextUrl.searchParams.get('agentName');
  const severity = req.nextUrl.searchParams.get('severity');
  const hoursAgo = parseInt(req.nextUrl.searchParams.get('hoursAgo') || '24');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');

  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('agent_rule_violations')
    .select(`
      *,
      rule:agent_business_rules(rule_name, rule_type, config)
    `)
    .eq('workspace_id', workspaceId)
    .gte('violated_at', since)
    .order('violated_at', { ascending: false })
    .limit(limit);

  if (agentName) {
    query = query.eq('agent_name', agentName);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  // Also get stats if requested
  const includeStats = req.nextUrl.searchParams.get('includeStats') === 'true';
  let stats = null;

  if (includeStats && agentName) {
    const engine = getRulesEngine();
    stats = await engine.getViolationStats(agentName, workspaceId, hoursAgo);
  }

  return successResponse({
    violations: data,
    stats: includeStats ? stats : undefined,
    meta: {
      hours_ago: hoursAgo,
      count: data?.length || 0
    }
  });
});
