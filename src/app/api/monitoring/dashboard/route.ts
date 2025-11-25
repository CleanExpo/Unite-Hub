/**
 * Monitoring Dashboard API
 * GET /api/monitoring/dashboard
 *
 * Returns comprehensive monitoring data for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getErrorStats,
  checkSystemHealth,
  getRecentErrors,
  getSlowRequests,
} from '@/lib/monitoring/autonomous-monitor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Run all checks in parallel
    const [errorStats, systemHealth, recentErrors, slowRequests] = await Promise.all([
      getErrorStats(24), // Last 24 hours
      checkSystemHealth(),
      getRecentErrors(20),
      getSlowRequests(1, 20), // Last 1 hour
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        errorStats,
        systemHealth,
        recentErrors,
        slowRequests,
      },
    });
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
