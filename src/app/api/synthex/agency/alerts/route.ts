/**
 * Synthex Agency Alerts API
 * Phase B40: Agency Command Center
 *
 * GET  - List agency alerts
 * POST - Create a new alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAgencyAlerts,
  createAlert,
  CreateAlertInput,
} from '@/lib/synthex/agencyCommandService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyTenantId = searchParams.get('agencyTenantId');
    const clientTenantId = searchParams.get('clientTenantId');
    const unresolvedOnly = searchParams.get('unresolvedOnly') === 'true';
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!agencyTenantId) {
      return NextResponse.json(
        { error: 'agencyTenantId is required' },
        { status: 400 }
      );
    }

    const alerts = await getAgencyAlerts(agencyTenantId, {
      clientTenantId: clientTenantId || undefined,
      unresolvedOnly,
      severity: severity as 'low' | 'medium' | 'high' | 'critical' | undefined,
      limit,
    });

    return NextResponse.json({
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error in agency/alerts GET:', error);
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
    const { agencyTenantId, ...alertInput } = body;

    if (!agencyTenantId || !alertInput.alert_type || !alertInput.title || !alertInput.message) {
      return NextResponse.json(
        { error: 'agencyTenantId, alert_type, title, and message are required' },
        { status: 400 }
      );
    }

    const input: CreateAlertInput = {
      client_tenant_id: alertInput.client_tenant_id,
      alert_type: alertInput.alert_type,
      severity: alertInput.severity || 'medium',
      title: alertInput.title,
      message: alertInput.message,
      data: alertInput.data,
    };

    const alert = await createAlert(agencyTenantId, input);

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error in agency/alerts POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
