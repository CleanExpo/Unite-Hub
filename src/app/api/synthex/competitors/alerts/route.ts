/**
 * Synthex Competitor Alerts API
 * Phase B30: Competitive Intelligence Alerts
 *
 * GET  - List alerts for tenant
 * POST - Generate alerts for competitor
 * PATCH - Update alert status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAlerts,
  generateAlerts,
  updateAlertStatus,
} from '@/lib/synthex/competitorIntelligenceService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const alerts = await getAlerts(tenantId, {
      status: status || undefined,
      limit,
    });

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error('Error in competitors/alerts GET:', error);
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
    const { tenant_id, competitor_id } = body;

    if (!tenant_id || !competitor_id) {
      return NextResponse.json(
        { error: 'tenant_id and competitor_id are required' },
        { status: 400 }
      );
    }

    const alerts = await generateAlerts(tenant_id, competitor_id);

    return NextResponse.json({ alerts, count: alerts.length }, { status: 201 });
  } catch (error) {
    console.error('Error in competitors/alerts POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenant_id, alert_id, status } = body;

    if (!tenant_id || !alert_id || !status) {
      return NextResponse.json(
        { error: 'tenant_id, alert_id, and status are required' },
        { status: 400 }
      );
    }

    if (!['acknowledged', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: acknowledged, resolved, dismissed' },
        { status: 400 }
      );
    }

    await updateAlertStatus(tenant_id, alert_id, status, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in competitors/alerts PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
