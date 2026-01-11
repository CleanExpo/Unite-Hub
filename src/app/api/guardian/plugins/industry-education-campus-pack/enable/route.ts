/**
 * Guardian Plugin Marketplace API: Enable Education & Campus Operations Pack
 *
 * Endpoint: POST /api/guardian/plugins/industry-education-campus-pack/enable
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { pluginRegistry } from '@/lib/guardian/plugins/registry';
import { getSupabaseServer } from '@/lib/supabase';

const PLUGIN_KEY = 'industry_education_campus_pack';

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

  // Get workspace details
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('tier, enabled_features, governance_settings')
    .eq('id', workspaceId)
    .single();

  if (wsError || !workspace) {
    return errorResponse('Workspace not found', 404);
  }

  // Check tier constraint
  if (!plugin.requiredTiers?.includes(workspace.tier)) {
    return errorResponse(
      `Plugin requires ${plugin.requiredTiers?.join(' or ')} tier. Current: ${workspace.tier}`,
      403
    );
  }

  // Check feature constraints
  const enabledFeatures = workspace.enabled_features || [];
  const missingFeatures = plugin.requiredFeatures?.filter((f) => !enabledFeatures.includes(f)) || [];
  if (missingFeatures.length > 0) {
    return errorResponse(
      `Plugin requires features: ${missingFeatures.join(', ')}. Enable via admin panel.`,
      403
    );
  }

  // Enable plugin
  const { error: updateError } = await supabase
    .from('workspace_plugins')
    .upsert(
      {
        workspace_id: workspaceId,
        plugin_key: PLUGIN_KEY,
        enabled: true,
        enabled_at: new Date().toISOString()
      },
      { onConflict: 'workspace_id,plugin_key' }
    );

  if (updateError) {
    return errorResponse(`Failed to enable plugin: ${updateError.message}`, 500);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    workspace_id: workspaceId,
    action: 'plugin_enabled',
    details: { plugin_key: PLUGIN_KEY },
    created_at: new Date().toISOString()
  });

  return successResponse({
    message: `Plugin "${plugin.name}" enabled for workspace`,
    plugin_key: PLUGIN_KEY,
    enabled: true,
    enabled_at: new Date().toISOString()
  });
});
