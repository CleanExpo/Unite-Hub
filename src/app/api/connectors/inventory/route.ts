/**
 * POST /api/connectors/inventory
 *
 * Ingest inventory snapshots from external systems.
 * Auth: x-api-key header validated against connected_projects table.
 * Stores in project_events with event_type='inventory_update'.
 *
 * Related to: UNI-1401
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyConnectorRequest } from '@/lib/project-connect/verify-request';

export const dynamic = 'force-dynamic';

interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  location: string;
}

interface InventoryPayload {
  projectKey: string;
  items: InventoryItem[];
}

export async function POST(req: NextRequest) {
  const auth = await verifyConnectorRequest(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body: InventoryPayload = await req.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: items (non-empty array)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('project_events')
      .insert({
        project_id: auth.project.id,
        event_type: 'inventory_update',
        payload: {
          items: body.items,
          itemCount: body.items.length,
          snapshotAt: new Date().toISOString(),
          projectSlug: auth.project.slug,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[connectors/inventory] Insert error:', error);
      return NextResponse.json({ error: 'Failed to store inventory' }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      itemCount: body.items.length,
      eventId: data?.id,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
