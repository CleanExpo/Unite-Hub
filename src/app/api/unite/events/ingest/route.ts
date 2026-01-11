/**
 * Events Ingest API
 * Phase: D67
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ingestEvent, ingestBatch, getEvents } from '@/lib/unite/observabilityService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const filters = {
      event_type_key: request.nextUrl.searchParams.get('event_type_key') || undefined,
      severity: request.nextUrl.searchParams.get('severity') || undefined,
      source: request.nextUrl.searchParams.get('source') || undefined,
      correlation_id: request.nextUrl.searchParams.get('correlation_id') || undefined,
      start_time: request.nextUrl.searchParams.get('start_time') || undefined,
      end_time: request.nextUrl.searchParams.get('end_time') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const events = await getEvents(tenantId, filters);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // Batch ingest
    if (action === 'batch') {
      const { events } = body;
      if (!events || !Array.isArray(events)) {
        return NextResponse.json({ error: 'events array required' }, { status: 400 });
      }
      const count = await ingestBatch(tenantId, events);
      return NextResponse.json({ count }, { status: 201 });
    }

    // Single event ingest
    const event = await ingestEvent(tenantId, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
