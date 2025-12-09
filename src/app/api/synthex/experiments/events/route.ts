/**
 * Synthex Experiment Events API
 * Phase B41: Experimentation & A/B Testing Engine
 *
 * POST - Record batch experiment events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordEvent, EventInput } from '@/lib/synthex/experimentService';

interface BatchEventRequest {
  events: EventInput[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BatchEventRequest = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'events array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each event
    for (const event of events) {
      if (!event.experiment_id || !event.variant_id || !event.event_type) {
        return NextResponse.json(
          { error: 'Each event must have experiment_id, variant_id, and event_type' },
          { status: 400 }
        );
      }
    }

    // Record events in parallel (fire-and-forget style but we wait for completion)
    const results = await Promise.allSettled(
      events.map((event) => recordEvent(event))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      recorded: successful,
      failed,
      total: events.length,
    });
  } catch (error) {
    console.error('Error in experiments events POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
