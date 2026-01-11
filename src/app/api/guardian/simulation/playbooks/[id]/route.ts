/**
 * Guardian I04: Remediation Playbook Detail API
 * GET    /api/guardian/simulation/playbooks/[id] - Get playbook
 * PATCH  /api/guardian/simulation/playbooks/[id] - Update playbook
 * DELETE /api/guardian/simulation/playbooks/[id] - Delete playbook
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { validatePlaybookConfig } from '@/lib/guardian/simulation/remediationPlaybookTypes';

export const GET = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_remediation_playbooks')
    .select('*')
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .single();

  if (error) {
throw error;
}
  if (!data) {
throw new Error('Playbook not found');
}

  return successResponse({ playbook: data });
});

export const PATCH = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const body = await req.json();
  const { name, description, category, config, is_active } = body;

  // Validate config if provided
  if (config) {
    const validation = validatePlaybookConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid playbook config: ${validation.errors.join(', ')}`);
    }
  }

  const supabase = getSupabaseServer();

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
updateData.name = name;
}
  if (description !== undefined) {
updateData.description = description;
}
  if (category !== undefined) {
updateData.category = category;
}
  if (config !== undefined) {
updateData.config = config;
}
  if (is_active !== undefined) {
updateData.is_active = is_active;
}

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('guardian_remediation_playbooks')
    .update(updateData)
    .eq('tenant_id', workspaceId)
    .eq('id', id)
    .select()
    .single();

  if (error) {
throw error;
}
  if (!data) {
throw new Error('Playbook not found');
}

  return successResponse({ playbook: data });
});

export const DELETE = withErrorBoundary(async (req: NextRequest, context) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id } = await context.params;
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_remediation_playbooks')
    .delete()
    .eq('tenant_id', workspaceId)
    .eq('id', id);

  if (error) {
throw error;
}

  return successResponse({ success: true });
});
