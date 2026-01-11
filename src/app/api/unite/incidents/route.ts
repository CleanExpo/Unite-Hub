/**
 * Incidents API
 * Phase: D59
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createIncident, listIncidents, resolveIncident } from '@/lib/unite/incidentService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase.from('user_organizations').select('org_id').eq('user_id', user.id).limit(1).single();
    const tenantId = orgData?.org_id || null;

    const status = request.nextUrl.searchParams.get('status') || undefined;
    const severity = request.nextUrl.searchParams.get('severity') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const incidents = await listIncidents(tenantId, { status, severity, limit });
    return NextResponse.json({ incidents });
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
    const tenantId = orgData?.org_id || null;

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    if (action === 'resolve') {
      const incident = await resolveIncident(body.incident_id, user.id);
      return NextResponse.json({ incident });
    }

    const incident = await createIncident(tenantId, body);
    return NextResponse.json({ incident }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
