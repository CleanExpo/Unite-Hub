import { NextRequest, NextResponse } from 'next/server';
import { getRealityEvents } from '@/lib/aido/database/reality-events';

export async function GET(req: NextRequest) {
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

    const clientId = req.nextUrl.searchParams.get('clientId');
    const eventType = req.nextUrl.searchParams.get('eventType');
    const status = req.nextUrl.searchParams.get('status');
    const limit = req.nextUrl.searchParams.get('limit');

    const allEvents = await getRealityEvents(workspaceId, {
      clientId: clientId || undefined,
      eventType: eventType || undefined,
      processingStatus: status || undefined
    });

    // Apply limit after fetching
    const events = limit ? allEvents.slice(0, parseInt(limit)) : allEvents.slice(0, 50);

    // Calculate statistics
    const stats = {
      total: events.length,
      byStatus: {
        pending: events.filter(e => e.processing_status === 'pending').length,
        processed: events.filter(e => e.processing_status === 'processed').length,
        contentCreated: events.filter(e => e.processing_status === 'content_created').length,
        failed: events.filter(e => e.processing_status === 'failed').length
      },
      byEventType: events.reduce((acc: any, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {}),
      contentOpportunities: events.filter(e =>
        (e.normalized_payload as any)?.content_opportunity?.score > 0.6
      ).length
    };

    return NextResponse.json({
      success: true,
      events,
      stats,
      count: events.length
    });

  } catch (error: any) {
    console.error('Get reality events error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
