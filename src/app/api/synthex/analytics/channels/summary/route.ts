/**
 * GET /api/synthex/analytics/channels/summary
 *
 * Get channel analytics summary with daily breakdown and totals.
 *
 * Query params:
 * - tenantId: string (required)
 * - days?: number (default 30)
 * - format?: 'raw' | 'chart' (default 'chart')
 *
 * Response:
 * {
 *   status: 'ok'
 *   dailySummary: DailySummary[]
 *   channelTotals: ChannelTotals[]
 *   lineChartData?: Array  // when format=chart
 *   barChartData?: Array   // when format=chart
 * }
 *
 * Phase: B8 - Synthex Real-Time Channel Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRealTimeOverview } from '@/lib/synthex/channelAnalyticsService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const days = parseInt(searchParams.get('days') || '30');
    const format = searchParams.get('format') || 'chart';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get real-time overview
    const result = await getRealTimeOverview(tenantId, { days });

    if (result.error) {
      throw result.error;
    }

    const data = result.data;
    if (!data) {
      return NextResponse.json({
        status: 'ok',
        dailySummary: [],
        channelTotals: [],
        lineChartData: [],
        barChartData: [],
      }, { status: 200 });
    }

    // Return based on format
    if (format === 'raw') {
      return NextResponse.json({
        status: 'ok',
        dailySummary: data.dailySummary,
        channelTotals: data.channelTotals,
      }, { status: 200 });
    }

    // Default: chart format
    return NextResponse.json({
      status: 'ok',
      dailySummary: data.dailySummary,
      channelTotals: data.channelTotals,
      lineChartData: data.lineChartData,
      barChartData: data.barChartData,
    }, { status: 200 });
  } catch (error) {
    console.error('[analytics/channels/summary GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
