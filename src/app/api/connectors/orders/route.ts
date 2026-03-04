/**
 * POST /api/connectors/orders
 *
 * Ingest order events from external systems (RestoreAssist, CCW, DR).
 * Auth: x-api-key header validated against connected_projects table.
 * Stores in project_events with event_type='order_event'.
 *
 * Related to: UNI-1401
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyConnectorRequest } from '@/lib/project-connect/verify-request';

export const dynamic = 'force-dynamic';

interface OrderLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderPayload {
  projectKey: string;
  order: {
    id: string;
    status: string;
    total: number;
    currency: string;
    customer: string;
    lineItems: OrderLineItem[];
    createdAt: string;
  };
}

export async function POST(req: NextRequest) {
  const auth = await verifyConnectorRequest(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body: OrderPayload = await req.json();

    if (!body.order?.id || !body.order?.status) {
      return NextResponse.json(
        { error: 'Missing required fields: order.id, order.status' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('project_events')
      .insert({
        project_id: auth.project.id,
        event_type: 'order_event',
        payload: {
          orderId: body.order.id,
          status: body.order.status,
          total: body.order.total,
          currency: body.order.currency ?? 'AUD',
          customer: body.order.customer,
          lineItems: body.order.lineItems ?? [],
          createdAt: body.order.createdAt ?? new Date().toISOString(),
          projectSlug: auth.project.slug,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[connectors/orders] Insert error:', error);
      return NextResponse.json({ error: 'Failed to store order' }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      orderId: body.order.id,
      eventId: data?.id,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
