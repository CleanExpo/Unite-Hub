/**
 * POST /api/connectors/compliance
 *
 * Ingest compliance events (ATO submissions, BAS lodgements, STP).
 * Auth: x-api-key header validated against connected_projects table.
 * Stores in project_events with event_type='compliance_event'.
 *
 * Related to: UNI-1402
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyConnectorRequest } from '@/lib/project-connect/verify-request';

export const dynamic = 'force-dynamic';

interface ComplianceEvent {
  type: 'bas' | 'stp' | 'ato_submission';
  period: string;
  status: string;
  amount?: number;
  reference?: string;
}

interface CompliancePayload {
  projectKey: string;
  event: ComplianceEvent;
}

export async function POST(req: NextRequest) {
  const auth = await verifyConnectorRequest(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body: CompliancePayload = await req.json();

    if (!body.event?.type || !body.event?.period || !body.event?.status) {
      return NextResponse.json(
        { error: 'Missing required fields: event.type, event.period, event.status' },
        { status: 400 }
      );
    }

    const validTypes = ['bas', 'stp', 'ato_submission'];
    if (!validTypes.includes(body.event.type)) {
      return NextResponse.json(
        { error: `Invalid event.type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('project_events')
      .insert({
        project_id: auth.project.id,
        event_type: 'compliance_event',
        payload: {
          complianceType: body.event.type,
          period: body.event.period,
          status: body.event.status,
          amount: body.event.amount ?? null,
          reference: body.event.reference ?? null,
          submittedAt: new Date().toISOString(),
          projectSlug: auth.project.slug,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[connectors/compliance] Insert error:', error);
      return NextResponse.json({ error: 'Failed to store compliance event' }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      eventId: data?.id,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
