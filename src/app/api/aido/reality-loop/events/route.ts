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

    const events = await getRealityEvents(
      workspaceId,
      clientId || undefined,
      eventType || undefined,
      status || undefined,
      limit ? parseInt(limit) : 50
    );

    // Calculate statistics
    const stats = {
      total: events.length,
      byStatus: {
        pending: events.filter(e => e.processingStatus === 'pending').length,
        processed: events.filter(e => e.processingStatus === 'processed').length,
        contentCreated: events.filter(e => e.processingStatus === 'content_created').length,
        failed: events.filter(e => e.processingStatus === 'failed').length
      },
      byEventType: events.reduce((acc: any, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      }, {}),
      contentOpportunities: events.filter(e =>
        e.normalizedPayload?.contentOpportunity?.score > 0.6
      ).length
    };

    return NextResponse.json({
      success: true,
      events,
      stats,
      count: events.length
    });

  } catch (error: unknown) {
    console.error('Get reality events error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
