/**
 * Synthex Agency Metrics API
 * Phase B40: Agency Command Center
 *
 * GET  - Get client metrics
 * POST - Upsert client metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getClientMetrics,
  upsertClientMetrics,
  ClientMetricsInput,
} from '@/lib/synthex/agencyCommandService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientTenantId = searchParams.get('clientTenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const periodType = searchParams.get('periodType') || 'daily';

    if (!clientTenantId) {
      return NextResponse.json(
        { error: 'clientTenantId is required' },
        { status: 400 }
      );
    }

    const metrics = await getClientMetrics(
      clientTenantId,
      startDate || undefined,
      endDate || undefined,
      periodType as 'daily' | 'weekly' | 'monthly'
    );

    // Calculate summary statistics
    const summary = {
      totalEmailsSent: metrics.reduce((sum, m) => sum + (m.emails_sent || 0), 0),
      totalLeads: metrics.reduce((sum, m) => sum + (m.leads_generated || 0), 0),
      avgChurnRisk: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + (m.churn_risk || 0), 0) / metrics.length
        : 0,
      avgEngagement: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + (m.engagement_score || 50), 0) / metrics.length
        : 50,
      latestMRR: metrics[0]?.mrr || 0,
    };

    return NextResponse.json({
      metrics,
      summary,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Error in agency/metrics GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientTenantId, period, periodType, ...metricsData } = body;

    if (!clientTenantId || !period) {
      return NextResponse.json(
        { error: 'clientTenantId and period are required' },
        { status: 400 }
      );
    }

    const input: ClientMetricsInput = {
      period,
      period_type: periodType || 'daily',
      mrr: metricsData.mrr,
      arr: metricsData.arr,
      revenue_this_period: metricsData.revenue_this_period,
      active_users: metricsData.active_users,
      total_users: metricsData.total_users,
      api_calls: metricsData.api_calls,
      storage_used_mb: metricsData.storage_used_mb,
      emails_sent: metricsData.emails_sent,
      emails_opened: metricsData.emails_opened,
      emails_clicked: metricsData.emails_clicked,
      campaigns_running: metricsData.campaigns_running,
      campaigns_completed: metricsData.campaigns_completed,
      total_contacts: metricsData.total_contacts,
      new_contacts: metricsData.new_contacts,
      leads_generated: metricsData.leads_generated,
      churn_risk: metricsData.churn_risk,
      engagement_score: metricsData.engagement_score,
      nps_score: metricsData.nps_score,
    };

    const metric = await upsertClientMetrics(clientTenantId, input);

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error('Error in agency/metrics POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
