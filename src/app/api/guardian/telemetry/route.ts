import { NextResponse } from 'next/server';
import { listTelemetryStreams, listTelemetryEvents } from '@/lib/guardian/telemetryStreamsService';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { logGuardianAccess, extractSourceIp, extractUserAgent } from '@/lib/guardian/audit';

/**
 * Guardian G25 + G30 + G31 + G32 + G33: Telemetry Streams API
 * Read-only access with role-based permissions and audit logging
 *
 * Allowed roles: guardian_viewer, guardian_analyst, guardian_admin
 *
 * GET /api/guardian/telemetry?streamId=<optional>
 * Returns telemetry streams and events for authenticated founder
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const streamId = url.searchParams.get('streamId') || undefined;
  const endpoint = '/api/guardian/telemetry';
  const method = 'GET';

  try {
    // G32: Check access level
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ['guardian_viewer', 'guardian_analyst', 'guardian_admin']);

    const { tenantId } = await getGuardianTenantContext();

    const [streams, events] = await Promise.all([
      listTelemetryStreams(tenantId),
      listTelemetryEvents(tenantId, { streamId, limit: 200 }),
    ]);

    // G33: Best-effort audit logging (success)
    await logGuardianAccess({
      tenantId,
      userId,
      role,
      endpoint,
      method,
      statusCode: 200,
      success: true,
      sourceIp: extractSourceIp(req),
      userAgent: extractUserAgent(req),
      meta: { streamId: streamId ?? null },
    });

    return NextResponse.json({ streams, events });
  } catch (error: any) {
    const message = String(error);
    const code = message.includes('UNAUTHENTICATED')
      ? 401
      : message.includes('FORBIDDEN')
      ? 403
      : 500;

    // G33: Best-effort audit logging (failure)
    try {
      const { tenantId } = await getGuardianTenantContext().catch(() => ({
        tenantId: 'UNKNOWN_TENANT',
      }));
      const { role, userId } = await getGuardianAccessContext().catch(() => ({
        role: 'guardian_viewer' as const,
        userId: 'UNKNOWN_USER',
      }));

      await logGuardianAccess({
        tenantId,
        userId,
        role,
        endpoint,
        method,
        statusCode: code,
        success: false,
        sourceIp: extractSourceIp(req),
        userAgent: extractUserAgent(req),
        meta: { error: message, streamId: streamId ?? null },
      });
    } catch (_) {
      // Ignore audit failures in error path
    }

    console.error('Guardian Telemetry access denied:', error);
    return NextResponse.json({ error: 'Guardian telemetry access denied.' }, { status: code });
  }
}
