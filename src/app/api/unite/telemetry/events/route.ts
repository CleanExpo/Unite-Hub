/**
 * Telemetry Events API
 * Phase: D74 - Unite Stability Telemetry Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  recordEventAsync,
  recordEventBatch,
  listEvents,
  getEventStats,
  type TelemetrySeverity,
} from '@/lib/unite/telemetryService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const action = request.nextUrl.searchParams.get('action') || 'list';

    // Get event statistics
    if (action === 'stats') {
      const filters = {
        tenant_id: tenantId,
        component: request.nextUrl.searchParams.get('component') || undefined,
        start_date: request.nextUrl.searchParams.get('start_date') || undefined,
        end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      };

      const stats = await getEventStats(filters);
      return NextResponse.json({ stats });
    }

    // List events
    const filters = {
      tenant_id: tenantId,
      component: request.nextUrl.searchParams.get('component') || undefined,
      severity: (request.nextUrl.searchParams.get('severity') as TelemetrySeverity) || undefined,
      start_date: request.nextUrl.searchParams.get('start_date') || undefined,
      end_date: request.nextUrl.searchParams.get('end_date') || undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const events = await listEvents(filters);
    return NextResponse.json({ events });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch telemetry events' },
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

    // Get tenant_id from user_organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userOrgs?.organization_id;

    const body = await request.json();
    const { action, component, severity, payload, events } = body;

    // Record single event
    if (action === 'record' || !action) {
      if (!component || !severity) {
        return NextResponse.json(
          { error: 'component and severity are required' },
          { status: 400 }
        );
      }

      const event = await recordEventAsync(component, severity, payload, tenantId);
      return NextResponse.json({ event }, { status: 201 });
    }

    // Record batch of events
    if (action === 'batch') {
      if (!events || !Array.isArray(events)) {
        return NextResponse.json({ error: 'events array is required' }, { status: 400 });
      }

      const eventsWithTenant = events.map((e) => ({
        ...e,
        tenant_id: tenantId,
      }));

      const count = await recordEventBatch(eventsWithTenant);
      return NextResponse.json({ recorded: count }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record telemetry event' },
      { status: 500 }
    );
  }
}
