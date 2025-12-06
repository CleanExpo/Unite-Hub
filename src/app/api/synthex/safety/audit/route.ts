/**
 * Synthex Safety Audit API
 *
 * GET: Retrieve audit logs for a tenant with filters
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/synthex/safetyService';

/**
 * GET /api/synthex/safety/audit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Build filters
    const filters: any = {};

    const serviceName = searchParams.get('service_name');
    if (serviceName) {
      filters.service_name = serviceName;
    }

    const flagged = searchParams.get('flagged');
    if (flagged !== null) {
      filters.flagged = flagged === 'true';
    }

    const startDate = searchParams.get('start_date');
    if (startDate) {
      filters.start_date = startDate;
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      filters.end_date = endDate;
    }

    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit);
    }

    const logs = await listAuditLogs(tenantId, filters);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[safety/audit] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
