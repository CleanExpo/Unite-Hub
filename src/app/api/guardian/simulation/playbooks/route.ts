/**
 * Guardian I04: Remediation Playbooks API
 * GET  /api/guardian/simulation/playbooks - List playbooks
 * POST /api/guardian/simulation/playbooks - Create playbook
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { validatePlaybookConfig } from '@/lib/guardian/simulation/remediationPlaybookTypes';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_remediation_playbooks')
    .select('id, name, description, category, is_active, created_at, updated_at')
    .eq('tenant_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) {
throw error;
}

  return successResponse({
    playbooks: data || [],
    count: data?.length || 0,
  });
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { name, description, category, config } = body;

  // Validate required fields
  if (!name || !config) {
    throw new Error('name and config required');
  }

  // Validate playbook config
  const validation = validatePlaybookConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid playbook config: ${validation.errors.join(', ')}`);
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_remediation_playbooks')
    .insert({
      tenant_id: workspaceId,
      name,
      description: description || '',
      category: category || 'custom',
      config,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
throw error;
}

  return successResponse(
    { playbook: data },
    { status: 201 }
  );
});
