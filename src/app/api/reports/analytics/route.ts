/**
 * Usage Analytics API
 * GET - Heatmaps, trends, forecasts, anomalies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { usageAnalyticsService } from '@/lib/services/financial/UsageAnalyticsService';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has access to org
    const supabase = await getSupabaseServer();
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get('type') || 'heatmap';
    const workspaceId = req.nextUrl.searchParams.get('workspaceId') || undefined;
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const category = req.nextUrl.searchParams.get('category') || 'emails';
    const periods = parseInt(req.nextUrl.searchParams.get('periods') || '12');
    const periodType = (req.nextUrl.searchParams.get('periodType') || 'monthly') as 'daily' | 'weekly' | 'monthly';

    let result: any;

    switch (type) {
      case 'heatmap':
        result = await usageAnalyticsService.generateHeatmap(orgId, workspaceId, days);
        break;

      case 'clusters':
        result = await usageAnalyticsService.clusterByConsumption(orgId, days);
        break;

      case 'trends':
        result = await usageAnalyticsService.analyzeTrends(orgId, periodType, periods);
        break;

      case 'forecast':
        result = await usageAnalyticsService.forecastUsage(orgId, category, periods);
        break;

      case 'anomalies':
        const threshold = parseFloat(req.nextUrl.searchParams.get('threshold') || '2.0');
        result = await usageAnalyticsService.detectAnomalies(orgId, threshold);
        break;

      case 'compare':
        const p1Start = req.nextUrl.searchParams.get('period1Start');
        const p1End = req.nextUrl.searchParams.get('period1End');
        const p2Start = req.nextUrl.searchParams.get('period2Start');
        const p2End = req.nextUrl.searchParams.get('period2End');

        if (!p1Start || !p1End || !p2Start || !p2End) {
          return NextResponse.json(
            { error: 'Period dates are required for comparison' },
            { status: 400 }
          );
        }

        result = await usageAnalyticsService.compareperiods(
          orgId,
          new Date(p1Start),
          new Date(p1End),
          new Date(p2Start),
          new Date(p2End)
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
