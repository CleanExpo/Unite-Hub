import { NextRequest, NextResponse } from 'next/server';
import { ingestRealityEvent } from '@/lib/aido/database/reality-events';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const {
      clientId,
      eventType,
      sourceSystem,
      sourceId,
      timestamp,
      location,
      rawPayload
    } = body;

    if (!clientId || !eventType || !sourceSystem || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, eventType, sourceSystem, timestamp' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = [
      'gmb_interaction',
      'customer_call',
      'service_completion',
      'review_received',
      'quote_sent',
      'project_milestone',
      'customer_question',
      'appointment_booked'
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Ingest event (processing happens asynchronously)
    const event = await ingestRealityEvent({
      clientId,
      workspaceId,
      eventType,
      sourceSystem,
      sourceId,
      timestamp: new Date(timestamp),
      location,
      rawPayload
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        eventType: event.eventType,
        processingStatus: event.processingStatus
      },
      message: 'Event ingested successfully. Processing will complete within 1-2 minutes.'
    });

  } catch (error: any) {
    console.error('Ingest reality event error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
