import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian Activity Feed API (G43)
 * GET /api/guardian/activity
 *
 * Returns unified feed of recent Guardian activity:
 * - Alert events (guardian_alert_events)
 * - Incidents (incidents table, filtered by tenant)
 * - Notifications (guardian_notifications)
 *
 * Access: All Guardian roles (viewer, analyst, admin)
 *
 * This endpoint powers both:
 * - /guardian/alerts/dashboard (static dashboard)
 * - /guardian/activity (live activity feed)
 */

const ALLOWED_ROLES = ['guardian_viewer', 'guardian_analyst', 'guardian_admin'];

export async function GET() {
  try {
    // Enforce Guardian role access
    const { role } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED_ROLES as unknown as string[]);

    const { tenantId } = await getGuardianTenantContext();
    const supabase = await createClient();

    // Fetch all activity streams in parallel
    const [alertsResult, incidentsResult, notificationsResult] = await Promise.all([
      // Recent alert events (50 most recent)
      supabase
        .from('guardian_alert_events')
        .select('id, rule_id, severity, source, message, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50),

      // Recent incidents (30 most recent)
      // Note: incidents table doesn't have tenant_id in all cases,
      // so we filter by title prefix as a heuristic for Guardian-created incidents
      supabase
        .from('incidents')
        .select('id, severity, status, title, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30),

      // Recent notifications (30 most recent)
      supabase
        .from('guardian_notifications')
        .select('id, type, severity, channel, status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    // Handle individual query errors gracefully
    const alerts = alertsResult.error
      ? (console.error('[Guardian G43] Failed to fetch alerts:', alertsResult.error), [])
      : alertsResult.data ?? [];

    const incidents = incidentsResult.error
      ? (console.error('[Guardian G43] Failed to fetch incidents:', incidentsResult.error), [])
      : incidentsResult.data ?? [];

    const notifications = notificationsResult.error
      ? (console.error(
          '[Guardian G43] Failed to fetch notifications:',
          notificationsResult.error
        ),
        [])
      : notificationsResult.data ?? [];

    console.log('[Guardian G43] Activity feed fetched:', {
      tenantId,
      alerts: alerts.length,
      incidents: incidents.length,
      notifications: notifications.length,
    });

    return NextResponse.json({
      alerts,
      incidents,
      notifications,
    });
  } catch (error: unknown) {
    const message = String(error);
    const code = message.includes('FORBIDDEN')
      ? 403
      : message.includes('UNAUTHENTICATED')
      ? 401
      : 500;

    console.error('[Guardian G43] Activity feed failed:', error);
    return NextResponse.json(
      { error: 'Guardian activity feed unavailable.', code },
      { status: code }
    );
  }
}
