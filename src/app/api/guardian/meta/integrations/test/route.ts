import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';

/**
 * POST /api/guardian/meta/integrations/test
 *
 * Create a synthetic test webhook event for all active integrations or a specific one.
 * This allows admins to verify webhook delivery is working without waiting for real Z-series events.
 *
 * Query params:
 *   - workspaceId: (required)
 *   - integrationId: (optional) if specified, only test this integration
 *
 * Response: { test_events_created: number, integrations: [{ id, integration_key, status }] }
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) throw new Error('workspaceId required');

  await validateUserAndWorkspace(req, workspaceId);

  const integrationId = req.nextUrl.searchParams.get('integrationId');

  const supabase = getSupabaseServer();

  // Fetch integrations
  let query = supabase
    .from('guardian_meta_integrations')
    .select('id, integration_key')
    .eq('tenant_id', workspaceId)
    .eq('is_enabled', true);

  if (integrationId) {
    query = query.eq('id', integrationId);
  }

  const { data: integrations, error: fetchError } = await query;

  if (fetchError) {
    console.error('[integrations/test API] Failed to fetch integrations:', fetchError);
    throw fetchError;
  }

  if (!integrations || integrations.length === 0) {
    return successResponse({
      test_events_created: 0,
      integrations: [],
      message: 'No enabled integrations found to test',
    });
  }

  // Create synthetic test payloads for each integration
  const testPayload = {
    event_type: 'test',
    scope: 'general',
    timestamp: new Date().toISOString(),
    message: 'Guardian meta webhook test event - verify delivery to ensure integration is configured correctly',
    test_metadata: {
      created_by: 'admin_webhook_test',
      test_at: new Date().toISOString(),
    },
  };

  const testEvents = integrations.map((integration: any) => ({
    tenant_id: workspaceId,
    integration_id: integration.id,
    event_type: 'test',
    payload: testPayload,
    status: 'pending',
    attempt_count: 0,
  }));

  // Insert test events
  const { data: insertedEvents, error: insertError } = await supabase
    .from('guardian_meta_webhook_events')
    .insert(testEvents)
    .select('id, integration_id');

  if (insertError) {
    console.error('[integrations/test API] Failed to insert test events:', insertError);
    throw insertError;
  }

  const integrationResults = integrations.map((integration: any) => ({
    id: integration.id,
    integration_key: integration.integration_key,
    status: 'test_event_queued',
  }));

  return successResponse({
    test_events_created: insertedEvents?.length || 0,
    integrations: integrationResults,
    message: `${insertedEvents?.length || 0} test event(s) queued for delivery. Check webhook logs in 30-60 seconds.`,
  });
});
