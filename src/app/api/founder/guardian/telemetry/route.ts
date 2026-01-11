import { NextResponse } from 'next/server';
import {
  listTelemetryStreams,
  listTelemetryEvents,
} from '@/lib/founder/guardian/telemetryStreamsService';
import { getGuardianTenantContext } from '@/lib/founder/guardian/tenant';

/**
 * Guardian G25 + G30: Telemetry Streams API
 * GET /api/founder/guardian/telemetry?streamId=<optional>
 * Returns telemetry streams and events using centralized tenant context
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const streamId = url.searchParams.get('streamId') || undefined;

    const { tenantId } = await getGuardianTenantContext();

    const [streams, events] = await Promise.all([
      listTelemetryStreams(tenantId),
      listTelemetryEvents(tenantId, { streamId, limit: 200 }),
    ]);

    return NextResponse.json({
      streams,
      events,
      summary: {
        total_streams: streams.length,
        total_events: events.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching Guardian telemetry data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch telemetry data' },
      { status: 500 }
    );
  }
}
