/**
 * Synthex Safety Incidents API
 *
 * GET: Retrieve safety incidents for a tenant with filters
 * PATCH: Resolve a safety incident
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { listIncidents, resolveIncident } from '@/lib/synthex/safetyService';

/**
 * GET /api/synthex/safety/incidents
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

    const resolved = searchParams.get('resolved');
    if (resolved !== null) {
      filters.resolved = resolved === 'true';
    }

    const severity = searchParams.get('severity');
    if (severity) {
      filters.severity = severity as any;
    }

    const type = searchParams.get('type');
    if (type) {
      filters.type = type as any;
    }

    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit);
    }

    const incidents = await listIncidents(tenantId, filters);

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('[safety/incidents] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/synthex/safety/incidents
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, incidentId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!incidentId) {
      return NextResponse.json({ error: 'incidentId is required' }, { status: 400 });
    }

    const incident = await resolveIncident(incidentId, tenantId);

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('[safety/incidents] PATCH error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
