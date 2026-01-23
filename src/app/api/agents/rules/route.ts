/**
 * API Routes: Agent Business Rules Management
 * CRUD operations for workspace-scoped agent rules
 *
 * Part of Project Vend Phase 2
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { apiRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/agents/rules
 * List all rules for a workspace, optionally filtered by agent
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

  let query = supabase
    .from('agent_business_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('priority', { ascending: true });

  if (agentName) {
    query = query.eq('agent_name', agentName);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse(data);
});

/**
 * POST /api/agents/rules
 * Create a new business rule
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  const user = await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const body = await req.json();
  const {
    agent_name,
    rule_name,
    rule_type,
    config,
    enabled = true,
    priority = 100,
    enforcement_level = 'block',
    escalate_on_violation = false,
    description
  } = body;

  // Validation
  if (!agent_name || !rule_name || !rule_type || !config) {
    return errorResponse('Missing required fields: agent_name, rule_name, rule_type, config', 400);
  }

  if (!['constraint', 'validation', 'escalation', 'cost_limit'].includes(rule_type)) {
    return errorResponse('Invalid rule_type. Must be: constraint, validation, escalation, cost_limit', 400);
  }

  if (!['block', 'warn', 'log'].includes(enforcement_level)) {
    return errorResponse('Invalid enforcement_level. Must be: block, warn, log', 400);
  }

  const { data, error } = await supabase
    .from('agent_business_rules')
    .insert({
      workspace_id: workspaceId,
      agent_name,
      rule_name,
      rule_type,
      config,
      enabled,
      priority,
      enforcement_level,
      escalate_on_violation,
      description,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse('Rule with this name already exists for this agent', 409);
    }
    return errorResponse(error.message, 500);
  }

  return successResponse(data, 201);
});

/**
 * PUT /api/agents/rules/[ruleId]
 * Update an existing rule
 */
export const PUT = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const ruleId = req.nextUrl.searchParams.get('ruleId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!ruleId) {
    return errorResponse('ruleId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const body = await req.json();
  const {
    config,
    enabled,
    priority,
    enforcement_level,
    escalate_on_violation,
    description
  } = body;

  const updateData: Record<string, any> = {};
  if (config !== undefined) {
updateData.config = config;
}
  if (enabled !== undefined) {
updateData.enabled = enabled;
}
  if (priority !== undefined) {
updateData.priority = priority;
}
  if (enforcement_level !== undefined) {
updateData.enforcement_level = enforcement_level;
}
  if (escalate_on_violation !== undefined) {
updateData.escalate_on_violation = escalate_on_violation;
}
  if (description !== undefined) {
updateData.description = description;
}

  const { data, error } = await supabase
    .from('agent_business_rules')
    .update(updateData)
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  if (!data) {
    return errorResponse('Rule not found', 404);
  }

  return successResponse(data);
});

/**
 * DELETE /api/agents/rules/[ruleId]
 * Delete a rule
 */
export const DELETE = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const ruleId = req.nextUrl.searchParams.get('ruleId');

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!ruleId) {
    return errorResponse('ruleId required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('agent_business_rules')
    .delete()
    .eq('id', ruleId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ deleted: true });
});
