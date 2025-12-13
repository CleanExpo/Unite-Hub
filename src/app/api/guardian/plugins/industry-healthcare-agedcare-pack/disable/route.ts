/**
 * Guardian Plugin Marketplace API: Disable Industry Healthcare & Aged Care Pack
 *
 * Endpoint: POST /api/guardian/plugins/industry-healthcare-agedcare-pack/disable
 *
 * Disables the Healthcare & Aged Care Oversight plugin for a workspace.
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { pluginRegistry } from '@/lib/guardian/plugins/registry';
import { getSupabaseServer } from '@/lib/supabase';

const PLUGIN_KEY = 'industry_healthcare_agedcare_pack';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
throw new Error('workspaceId required');
}

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  // Get plugin manifest
  const plugin = pluginRegistry.getPlugin(PLUGIN_KEY);
  if (!plugin) {
    return errorResponse('Plugin not found', 404);
  }

  // Disable plugin for workspace
  const { error: updateError } = await supabase
    .from('workspace_plugins')
    .update({
      enabled: false,
      disabled_at: new Date().toISOString()
    })
    .eq('workspace_id', workspaceId)
    .eq('plugin_key', PLUGIN_KEY);

  if (updateError) {
    return errorResponse(`Failed to disable plugin: ${updateError.message}`, 500);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    workspace_id: workspaceId,
    action: `plugin_disabled`,
    details: { plugin_key: PLUGIN_KEY },
    created_at: new Date().toISOString()
  });

  return successResponse({
    message: `Plugin "${plugin.name}" disabled for workspace`,
    plugin_key: PLUGIN_KEY,
    enabled: false,
    disabled_at: new Date().toISOString()
  });
});
