/**
 * Synthex Billing Usage API
 * Phase B33: Billing, Plans, and Usage Metering Engine
 *
 * GET  - Get usage summary and warnings for tenant
 * POST - Record usage (internal/webhook use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUsageSummary,
  classifyUsageAgainstLimits,
  recordUsage,
  incrementUsage,
  getMetricLabel,
} from '@/lib/synthex/billingPlanService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const includeWarnings = searchParams.get('warnings') !== 'false';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Get usage summary
    const summary = await getUsageSummary(tenantId);

    // Add friendly labels
    const summaryWithLabels = summary.map((item) => ({
      ...item,
      label: getMetricLabel(item.metric),
    }));

    // Get warnings if requested
    let warnings = null;
    if (includeWarnings) {
      warnings = await classifyUsageAgainstLimits(tenantId);
    }

    return NextResponse.json({
      usage: summaryWithLabels,
      warnings,
      period: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in billing/usage GET:', error);
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
    const { tenant_id, metric, quantity, action = 'set' } = body;

    if (!tenant_id || !metric) {
      return NextResponse.json(
        { error: 'tenant_id and metric are required' },
        { status: 400 }
      );
    }

    const validMetrics = [
      'ai_tokens',
      'emails_sent',
      'contacts',
      'campaigns',
      'events',
      'api_calls',
      'team_members',
    ];

    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }

    let result;
    if (action === 'increment') {
      result = await incrementUsage(tenant_id, metric, quantity || 1);
    } else {
      if (quantity === undefined) {
        return NextResponse.json(
          { error: 'quantity is required for set action' },
          { status: 400 }
        );
      }
      result = await recordUsage(tenant_id, metric, quantity);
    }

    return NextResponse.json({
      usage: result,
      message: `Usage ${action === 'increment' ? 'incremented' : 'recorded'} successfully`,
    });
  } catch (error) {
    console.error('Error in billing/usage POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
