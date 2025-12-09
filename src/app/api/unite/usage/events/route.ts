/**
 * Usage Events API
 * Phase: D64
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ingestUsageEvent, ingestBatch, getUsageEvents } from '@/lib/unite/usageTelemetryService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    const filters = {
      dimension_key: request.nextUrl.searchParams.get('dimension_key') || undefined,
      source: request.nextUrl.searchParams.get('source') || undefined,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const events = await getUsageEvents(tenantId, filters);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id;
    if (!tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

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
    const event = await ingestUsageEvent(tenantId, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
