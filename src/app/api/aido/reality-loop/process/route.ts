import { NextRequest, NextResponse } from 'next/server';
import { getRealityEvents, updateRealityEventStatus } from '@/lib/aido/database/reality-events';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';

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

    // AI rate limiting
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'ai');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const { eventId, clientId } = body;

    let eventsToProcess = [];

    if (eventId) {
      // Process single event
      const event = await getRealityEvents(workspaceId, clientId, undefined, 'pending', 1);
      const targetEvent = event.find((e: any) => e.id === eventId);
      if (targetEvent) {
        eventsToProcess = [targetEvent];
      }
    } else if (clientId) {
      // Process all pending events for client
      eventsToProcess = await getRealityEvents(clientId, workspaceId);
    } else {
      return NextResponse.json(
        { error: 'Must provide either eventId or clientId' },
        { status: 400 }
      );
    }

    if (eventsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending events to process'
      });
    }

    // Process events (this would call reality-event-processor.ts AI service)
    // For now, just mark as processed
    // TODO: Implement actual AI processing when reality-event-processor.ts is ready

    const results = await Promise.all(
      eventsToProcess.map(async (event: any) => {
        try {
          await updateRealityEventStatus(event.id, workspaceId, 'processed');
          return { id: event.id, status: 'success' };
        } catch (err: any) {
          return { id: event.id, status: 'failed', error: err.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      processed: successful,
      failed,
      results,
      message: `Processed ${successful} events successfully${failed > 0 ? `, ${failed} failed` : ''}`
    });

  } catch (error: any) {
    console.error('Process reality events error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
