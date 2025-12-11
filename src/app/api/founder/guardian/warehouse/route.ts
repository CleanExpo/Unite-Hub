import { NextResponse } from 'next/server';
import {
  listWarehouseEvents,
  listHourlyRollups,
  listDailyRollups,
  getWarehouseEventCount,
  getDistinctStreamKeys,
} from '@/lib/founder/guardian/telemetryWarehouseService';
import { getGuardianTenantContext } from '@/lib/founder/guardian/tenant';

/**
 * Guardian G26 + G30: Telemetry Warehouse API
 * GET /api/founder/guardian/warehouse?streamKey=<optional>
 * Returns warehouse events, hourly/daily rollups using centralized tenant context
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const streamKey = url.searchParams.get('streamKey') || undefined;

    const { tenantId } = await getGuardianTenantContext();

    const [events, hourly, daily, totalCount, streamKeys] = await Promise.all([
      listWarehouseEvents(tenantId, { streamKey, limit: 300 }),
      listHourlyRollups(tenantId, streamKey),
      listDailyRollups(tenantId, streamKey),
      getWarehouseEventCount(tenantId),
      getDistinctStreamKeys(tenantId),
    ]);

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
    console.error('Error fetching Guardian warehouse data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch warehouse data' },
      { status: 500 }
    );
  }
}
