import { NextRequest, NextResponse } from 'next/server';
import {
  listWarehouseEvents,
  listHourlyRollups,
  listDailyRollups,
  getWarehouseEventCount,
  getDistinctStreamKeys,
} from '@/lib/founder/guardian/telemetryWarehouseService';

/**
 * Guardian G26: Telemetry Warehouse API
 * GET /api/founder/guardian/warehouse?tenantId=<UUID>&streamKey=<optional>
 * Returns warehouse events, hourly rollups, daily rollups, and summary metrics
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId query parameter is required' },
        { status: 400 }
      );
    }

    const streamKey = req.nextUrl.searchParams.get('streamKey') || undefined;

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
