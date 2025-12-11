import { NextResponse } from 'next/server';
import {
  listReplaySessions,
  getReplaySession,
  listReplayEvents,
  getReplayEventCount,
} from '@/lib/guardian/replayEngineService';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { logGuardianAccess, extractSourceIp, extractUserAgent } from '@/lib/guardian/audit';

/**
 * Guardian G27 + G30 + G31 + G32 + G33: Replay Engine API
 * Read-only access with role-based permissions and audit logging
 *
 * Allowed roles: guardian_analyst, guardian_admin
 *
 * GET /api/guardian/replay?sessionId=<optional>
 * Returns replay sessions and events for authenticated founder
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId') || undefined;
  const endpoint = '/api/guardian/replay';
  const method = 'GET';

  try {
    // G32: Check access level (analyst or admin only)
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ['guardian_analyst', 'guardian_admin']);

    const { tenantId } = await getGuardianTenantContext();

    const sessions = await listReplaySessions(tenantId);

    if (!sessionId && sessions.length === 0) {
      // G33: Best-effort audit logging (success - empty state)
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
        meta: { sessionId: null, note: 'no_sessions' },
      });

      return NextResponse.json({
        sessions,
        events: [],
        activeSessionId: null,
        eventCount: 0,
      });
    }

    const effectiveSessionId = sessionId ?? sessions[0]?.id;

    if (!effectiveSessionId) {
      // G33: Best-effort audit logging (success - empty state)
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
        meta: { sessionId: sessionId ?? null, note: 'no_effective_session' },
      });

      return NextResponse.json({
        sessions,
        events: [],
        activeSessionId: null,
        eventCount: 0,
      });
    }

    const [session, events, eventCount] = await Promise.all([
      getReplaySession(tenantId, effectiveSessionId),
      listReplayEvents(tenantId, effectiveSessionId, 400),
      getReplayEventCount(tenantId, effectiveSessionId),
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
      meta: {
        sessionId: effectiveSessionId,
        requestedSessionId: sessionId ?? null,
        eventCount,
      },
    });

    return NextResponse.json({
      sessions,
      events,
      activeSessionId: effectiveSessionId,
      activeSession: session,
      eventCount,
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
        meta: { error: message, sessionId: sessionId ?? null },
      });
    } catch (_) {
      // Ignore audit failures in error path
    }

    console.error('Guardian Replay access denied:', error);
    return NextResponse.json({ error: 'Guardian replay access denied.' }, { status: code });
  }
}
