/**
 * Synthex Compliance Requests API
 * Phase B43: Governance, Audit Logging & Export
 *
 * GET - List compliance requests
 * POST - Create new compliance request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listComplianceRequests,
  createComplianceRequest,
  ComplianceRecord,
} from '@/lib/synthex/auditService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') as ComplianceRecord['status'] | undefined;
    const request_type = searchParams.get('request_type') as ComplianceRecord['request_type'] | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const requests = await listComplianceRequests(tenantId, {
      status,
      request_type,
      limit,
    });

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error in compliance GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, request_type, requester_email, requester_contact_id, request_data, deadline_days } = body;

    if (!tenantId || !request_type || !requester_email) {
      return NextResponse.json(
        { error: 'tenantId, request_type, and requester_email are required' },
        { status: 400 }
      );
    }

    const validTypes = [
      'access_request',
      'deletion_request',
      'portability_request',
      'consent_update',
      'opt_out',
      'rectification',
    ];

    if (!validTypes.includes(request_type)) {
      return NextResponse.json(
        { error: `request_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const complianceRequest = await createComplianceRequest(tenantId, {
      request_type,
      requester_email,
      requester_contact_id,
      request_data,
      deadline_days,
    });

    return NextResponse.json({ request: complianceRequest }, { status: 201 });
  } catch (error) {
    console.error('Error in compliance POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
