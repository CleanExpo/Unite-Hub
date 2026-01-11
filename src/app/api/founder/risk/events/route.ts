/**
 * Risk Events API
 *
 * Phase: D56 - Risk, Compliance & Guardrail Center
 *
 * Routes:
 * - GET /api/founder/risk/events - List risk events
 * - POST /api/founder/risk/events - Create risk event
 *
 * Query Params:
 * - action=get&id=<event-id> - Get specific event
 * - action=resolve&id=<event-id> - Resolve event
 * - action=summary - Get risk summary
 * - severity=<severity> - Filter by severity
 * - category=<category> - Filter by category
 * - resolved=<bool> - Filter by resolution status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createRiskEvent,
  getRiskEvent,
  listRiskEvents,
  resolveRiskEvent,
  getRiskSummary,
  CreateRiskEventInput,
  RiskSeverity,
  RiskCategory,
} from '@/lib/unite/riskCenterService';

// =============================================================================
// GET - List events, get event, get summary
// =============================================================================

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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific event
    if (action === 'get' && id) {
      const event = await getRiskEvent(tenantId, id);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    // Get summary
    if (action === 'summary') {
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant required for summary' }, { status: 403 });
      }
      const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);
      const summary = await getRiskSummary(tenantId, days);
      return NextResponse.json({ summary });
    }

    // List events
    const severity = request.nextUrl.searchParams.get('severity') as RiskSeverity | null;
    const category = request.nextUrl.searchParams.get('category') as RiskCategory | null;
    const resolved = request.nextUrl.searchParams.get('resolved');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const events = await listRiskEvents(tenantId, {
      severity: severity || undefined,
      category: category || undefined,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit,
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error('GET /api/founder/risk/events error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create or resolve event
// =============================================================================

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

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // Resolve event
    if (action === 'resolve') {
      const eventId = request.nextUrl.searchParams.get('id') || body.event_id;
      if (!eventId) {
        return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
      }

      const event = await resolveRiskEvent(tenantId, eventId, user.id);
      return NextResponse.json({ event });
    }

    // Create event
    const input: CreateRiskEventInput = {
      source: body.source,
      category: body.category,
      severity: body.severity,
      code: body.code,
      message: body.message,
      context: body.context,
    };

    if (!input.source || !input.category || !input.severity) {
      return NextResponse.json(
        { error: 'source, category, and severity are required' },
        { status: 400 }
      );
    }

    const event = await createRiskEvent(tenantId, input);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/founder/risk/events error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage events' },
      { status: 500 }
    );
  }
}
