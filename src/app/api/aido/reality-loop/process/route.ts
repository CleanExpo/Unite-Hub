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

    // Process events with lightweight AI classification
    const results = await Promise.all(
      eventsToProcess.map(async (event: any) => {
        try {
          // Classify event type and extract actionable signals
          const classification = classifyRealityEvent(event);
          await updateRealityEventStatus(
            event.id,
            workspaceId,
            'completed',
            `Classified as ${classification.type} (${classification.priority})`,
            { classification: classification.type, priority: classification.priority, signals: classification.signals }
          );
          return { id: event.id, status: 'success', classification };
        } catch (err) {
          return { id: event.id, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' };
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

  } catch (error) {
    console.error('Process reality events error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Lightweight Reality Event Classifier (no AI call required)
// ---------------------------------------------------------------------------

interface EventClassification {
  type: 'ranking_change' | 'competitor_move' | 'content_signal' | 'technical_alert' | 'unknown';
  priority: 'high' | 'medium' | 'low';
  signals: string[];
}

function classifyRealityEvent(event: Record<string, any>): EventClassification {
  const eventType = event.event_type || event.type || '';
  const data = event.data || event.payload || {};
  const signals: string[] = [];

  // Ranking changes
  if (eventType.includes('ranking') || eventType.includes('position') || eventType.includes('serp')) {
    const change = data.positionDelta ?? data.change ?? 0;
    signals.push(`Position change: ${change > 0 ? '+' : ''}${change}`);
    return {
      type: 'ranking_change',
      priority: Math.abs(change) >= 5 ? 'high' : Math.abs(change) >= 2 ? 'medium' : 'low',
      signals,
    };
  }

  // Competitor activity
  if (eventType.includes('competitor') || eventType.includes('rival')) {
    signals.push(`Competitor: ${data.competitorDomain || data.competitor || 'unknown'}`);
    return { type: 'competitor_move', priority: 'medium', signals };
  }

  // Content signals
  if (eventType.includes('content') || eventType.includes('publish') || eventType.includes('index')) {
    signals.push(`Content event: ${data.url || data.page || 'unknown'}`);
    return { type: 'content_signal', priority: 'low', signals };
  }

  // Technical alerts
  if (eventType.includes('error') || eventType.includes('alert') || eventType.includes('technical')) {
    signals.push(`Alert: ${data.message || data.description || eventType}`);
    return { type: 'technical_alert', priority: 'high', signals };
  }

  return { type: 'unknown', priority: 'low', signals: [`Unclassified: ${eventType}`] };
}
