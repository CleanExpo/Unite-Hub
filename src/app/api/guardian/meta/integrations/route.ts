import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';
import { getWebhookEventStats } from '@/lib/guardian/meta/metaWebhookDeliveryService';
import { GuardianMetaIntegrationScope } from '@/lib/guardian/meta/metaIntegrationService';

const ALLOWED_SCOPES = ['readiness', 'uplift', 'editions', 'executive_reports', 'adoption', 'lifecycle'];

/**
 * GET /api/guardian/meta/integrations
 *
 * List all meta integrations for the tenant with webhook delivery stats.
 * Returns:
 * {
 *   integrations: [
 *     {
 *       id, integration_key, label, is_enabled, scopes, last_synced_at,
 *       webhook_stats: { total_events, pending, delivered, failed, events_last_24h }
 *     }
 *   ]
 * }
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);
  const supabase = getSupabaseServer();

  const { data: integrations, error } = await supabase
    .from('guardian_meta_integrations')
    .select('*')
    .eq('tenant_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[integrations API] Failed to fetch integrations:', error);
    throw error;
  }

  // Fetch webhook stats for each integration
  const integrationsWithStats = await Promise.all(
    (integrations || []).map(async (integration: any) => {
      const stats = await getWebhookEventStats(workspaceId, integration.id);
      return {
        id: integration.id,
        integration_key: integration.integration_key,
        label: integration.label,
        description: integration.description,
        is_enabled: integration.is_enabled,
        scopes: integration.scopes,
        last_synced_at: integration.last_synced_at,
        webhook_stats: {
          total_events: stats.total_events,
          pending: stats.pending,
          delivered: stats.delivered,
          failed: stats.failed,
          events_last_24h: stats.events_last_24h,
        },
      };
    })
  );

  return successResponse({ integrations: integrationsWithStats });
});

/**
 * POST /api/guardian/meta/integrations
 *
 * Create a new meta integration for the tenant.
 * Body: {
 *   integration_key: string,
 *   label: string,
 *   description: string,
 *   is_enabled: boolean,
 *   config: { webhook_url?: string, headers?: {...}, ... },
 *   scopes: ['readiness', 'uplift', ...]
 * }
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { integration_key, label, description, is_enabled, config, scopes } = body;

  // Validate required fields
  if (!integration_key || !label || !config || !scopes) {
    throw new Error('integration_key, label, config, and scopes are required');
  }

  // Validate scopes
  if (!Array.isArray(scopes) || !scopes.every((s: string) => ALLOWED_SCOPES.includes(s))) {
    throw new Error(`Invalid scopes. Allowed: ${ALLOWED_SCOPES.join(', ')}`);
  }

  // Validate config
  if (typeof config !== 'object' || Object.keys(config).length === 0) {
    throw new Error('config must be a non-empty object');
  }

  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_meta_integrations')
    .insert({
      tenant_id: workspaceId,
      integration_key,
      label,
      description: description || '',
      is_enabled: is_enabled ?? false,
      config,
      scopes,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[integrations API] Failed to create integration:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error(`Integration with key '${integration_key}' already exists for this tenant`);
    }
    throw error;
  }

  return successResponse(data, 201);
});

/**
 * PATCH /api/guardian/meta/integrations
 *
 * Update one or more integrations.
 * Body: {
 *   updates: [
 *     { id, is_enabled?, config?, scopes?, ... }
 *   ]
 * }
 */
export const PATCH = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { updates } = body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('updates must be a non-empty array');
  }

  const supabase = getSupabaseServer();

  const results = await Promise.all(
    updates.map(async (update: any) => {
      const { id, ...fields } = update;

      // Validate scopes if provided
      if (fields.scopes && (!Array.isArray(fields.scopes) || !fields.scopes.every((s: string) => ALLOWED_SCOPES.includes(s)))) {
        throw new Error(`Invalid scopes in update. Allowed: ${ALLOWED_SCOPES.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('guardian_meta_integrations')
        .update({
          ...fields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', workspaceId)
        .select('*')
        .single();

      if (error) {
        console.error(`[integrations API] Failed to update integration ${id}:`, error);
        throw error;
      }

      return data;
    })
  );

  return successResponse({ updated: results });
});
