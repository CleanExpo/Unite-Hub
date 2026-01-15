/**
 * APM Monitoring API Route
 *
 * Endpoints:
 * - GET /api/monitoring/apm - Get APM statistics
 * - GET /api/monitoring/apm/health - Health check
 * - POST /api/monitoring/apm/flush - Flush pending data
 */

import { NextRequest, NextResponse } from 'next/server';
import { apm } from '@/lib/monitoring/apm';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/monitoring/apm
 * Returns APM statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Optional: Check if user is admin (comment out for open access during development)
    // const supabase = await createClient();
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      // Health check
      const health = await apm.healthCheck();
      return NextResponse.json(health);
    } else {
      // Default: return stats
      const stats = apm.getStats();
      return NextResponse.json({
        success: true,
        stats,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('APM API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch APM data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/apm
 * Flush pending APM data
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Check if user is admin
    // const supabase = await createClient();
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    await apm.flush();

    return NextResponse.json({
      success: true,
      message: 'APM data flushed successfully',
    });
  } catch (error) {
    console.error('APM flush error:', error);
    return NextResponse.json(
      {
        error: 'Failed to flush APM data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
