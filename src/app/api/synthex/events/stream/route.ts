/**
 * GET /api/synthex/events/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time channel event streaming.
 *
 * Query params:
 * - tenantId: string (required)
 * - channels?: string (comma-separated channel filter)
 * - types?: string (comma-separated event type filter)
 *
 * Phase: B9 - Synthex Event Stream Engine
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Keep connections alive
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_STREAM_DURATION = 300000; // 5 minutes

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const channelsParam = searchParams.get('channels');
  const typesParam = searchParams.get('types');

  if (!tenantId) {
    return new Response(
      JSON.stringify({ error: 'Missing required param: tenantId' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate tenant access
  const { data: tenant } = await supabaseAdmin
    .from('synthex_tenants')
    .select('id, owner_user_id')
    .eq('id', tenantId)
    .single();

  if (!tenant || tenant.owner_user_id !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Not authorized' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse filters
  const channels = channelsParam ? channelsParam.split(',').map(c => c.trim()) : null;
  const types = typesParam ? typesParam.split(',').map(t => t.trim()) : null;

  // Create readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isActive = true;
      const startTime = Date.now();
      let lastEventId: string | null = null;

      // Send initial connection message
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ tenantId, timestamp: new Date().toISOString() })}\n\n`));

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
return;
}
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, HEARTBEAT_INTERVAL);

      // Poll for new events
      const pollEvents = async () => {
        if (!isActive) {
return;
}

        try {
          // Build query for new events
          let query = supabaseAdmin
            .from('synthex_channel_events')
            .select('id, tenant_id, channel, event_type, email, campaign_id, metadata, occurred_at, created_at')
            .eq('tenant_id', tenantId)
            .order('occurred_at', { ascending: false })
            .limit(20);

          // Apply filters
          if (channels && channels.length > 0) {
            query = query.in('channel', channels);
          }
          if (types && types.length > 0) {
            query = query.in('event_type', types);
          }

          // Only get events after last event
          if (lastEventId) {
            query = query.gt('id', lastEventId);
          }

          const { data: events, error } = await query;

          if (error) {
            console.error('[events/stream] Error fetching events:', error);
          } else if (events && events.length > 0) {
            // Send each event
            for (const event of events.reverse()) {
              if (!isActive) {
break;
}

              const eventData = {
                id: event.id,
                channel: event.channel,
                eventType: event.event_type,
                email: event.email,
                campaignId: event.campaign_id,
                metadata: event.metadata,
                occurredAt: event.occurred_at,
              };

              controller.enqueue(
                encoder.encode(`event: channel_event\ndata: ${JSON.stringify(eventData)}\nid: ${event.id}\n\n`)
              );

              lastEventId = event.id;
            }
          }
        } catch (err) {
          console.error('[events/stream] Poll error:', err);
        }

        // Check if we should continue
        if (isActive && Date.now() - startTime < MAX_STREAM_DURATION) {
          setTimeout(pollEvents, 2000); // Poll every 2 seconds
        } else {
          // Stream timeout - send close event
          controller.enqueue(encoder.encode(`event: timeout\ndata: ${JSON.stringify({ message: 'Stream timeout, please reconnect' })}\n\n`));
          cleanup();
        }
      };

      // Start polling
      setTimeout(pollEvents, 1000);

      // Cleanup function
      const cleanup = () => {
        isActive = false;
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        console.log('[events/stream] Client disconnected');
        cleanup();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
