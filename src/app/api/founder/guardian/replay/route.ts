import { NextResponse } from 'next/server';
import {
  listReplaySessions,
  getReplaySession,
  listReplayEvents,
  getReplayEventCount,
} from '@/lib/founder/guardian/replayEngineService';
import { getGuardianTenantContext } from '@/lib/founder/guardian/tenant';

/**
 * Guardian G27 + G30: Replay Engine API
 * GET /api/founder/guardian/replay?sessionId=<optional>
 * Returns replay sessions and events using centralized tenant context
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || undefined;

    const { tenantId } = await getGuardianTenantContext();

    const sessions = await listReplaySessions(tenantId);

    if (sessions.length === 0) {
      return NextResponse.json({
        sessions,
        events: [],
        activeSessionId: null,
        eventCount: 0,
      });
    }

    const effectiveSessionId = sessionId ?? sessions[0]?.id;

    if (!effectiveSessionId) {
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

    return NextResponse.json({
      sessions,
      events,
      activeSessionId: effectiveSessionId,
      activeSession: session,
      eventCount,
    });
  } catch (error: any) {
    console.error('Error fetching Guardian replay data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch replay data' },
      { status: 500 }
    );
  }
}
