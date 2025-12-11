import { NextResponse } from 'next/server';
import {
  listWarehouseEvents,
  listHourlyRollups,
  listDailyRollups,
  getWarehouseEventCount,
  getDistinctStreamKeys,
} from '@/lib/guardian/telemetryWarehouseService';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { logGuardianAccess, extractSourceIp, extractUserAgent } from '@/lib/guardian/audit';

/**
 * Guardian G26 + G30 + G31 + G32 + G33: Telemetry Warehouse API
 * Read-only access with role-based permissions and audit logging
 *
 * Allowed roles: guardian_analyst, guardian_admin
 *
 * GET /api/guardian/warehouse?streamKey=<optional>
 * Returns warehouse events, hourly/daily rollups for authenticated founder
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const streamKey = url.searchParams.get('streamKey') || undefined;
  const endpoint = '/api/guardian/warehouse';
  const method = 'GET';

  try {
    // G32: Check access level (analyst or admin only)
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ['guardian_analyst', 'guardian_admin']);

    const { tenantId } = await getGuardianTenantContext();

    const [events, hourly, daily, totalCount, streamKeys] = await Promise.all([
      listWarehouseEvents(tenantId, { streamKey, limit: 300 }),
      listHourlyRollups(tenantId, streamKey),
      listDailyRollups(tenantId, streamKey),
      getWarehouseEventCount(tenantId),
      getDistinctStreamKeys(tenantId),
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
      meta: { streamKey: streamKey ?? null },
    });

    return NextResponse.json({
      events,
      hourly,
      daily,
      summary: {
        total_warehouse_events: totalCount,
        distinct_stream_keys: streamKeys.length,
        stream_keys: streamKeys,
      },
    });
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
        meta: { error: message, streamKey: streamKey ?? null },
      });
    } catch (_) {
      // Ignore audit failures in error path
    }

    console.error('Guardian Warehouse access denied:', error);
    return NextResponse.json({ error: 'Guardian warehouse access denied.' }, { status: code });
  }
}
