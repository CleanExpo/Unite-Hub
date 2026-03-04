/**
 * POST /api/founder/analytics/conversions  — record a conversion event
 * GET  /api/founder/analytics/conversions?site=xxx&days=7 — summary
 *
 * Conversion events are stored in army_opportunities (type = 'conversion')
 * so they appear in the standard opportunity dashboard alongside agent signals.
 *
 * Supported eventTypes:
 *   stripe_checkout | form_submit | enrolment | signup | phone_click
 *
 * UNI-1457: Conversion tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConversionEventType =
  | 'stripe_checkout'
  | 'form_submit'
  | 'enrolment'
  | 'signup'
  | 'phone_click';

const VALID_EVENT_TYPES: ConversionEventType[] = [
  'stripe_checkout',
  'form_submit',
  'enrolment',
  'signup',
  'phone_click',
];

// Map event types to a human-readable priority for the opportunities table
const EVENT_PRIORITY: Record<ConversionEventType, string> = {
  stripe_checkout: 'urgent',
  enrolment:       'high',
  form_submit:     'high',
  signup:          'medium',
  phone_click:     'medium',
};

// ---------------------------------------------------------------------------
// POST — record a conversion event
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      site,
      eventType,
      value,
      metadata,
    }: {
      site?: string;
      eventType?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    } = body;

    if (!site) {
      return NextResponse.json({ error: 'site is required' }, { status: 400 });
    }

    if (!eventType || !VALID_EVENT_TYPES.includes(eventType as ConversionEventType)) {
      return NextResponse.json(
        {
          error: `eventType must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const typedEvent = eventType as ConversionEventType;

    const title = value
      ? `${typedEvent} — ${site} — $${value.toFixed(2)} AUD`
      : `${typedEvent} — ${site}`;

    const { data, error } = await supabaseAdmin
      .from('army_opportunities')
      .insert({
        workspace_id:      null, // site-level events are workspace-agnostic
        source_agent:      'conversion-tracker',
        type:              'conversion',
        title,
        description:       `Conversion event recorded for ${site}: ${typedEvent}`,
        priority:          EVENT_PRIORITY[typedEvent],
        status:            'new',
        revenue_potential: value ?? null,
        metadata: {
          site,
          eventType: typedEvent,
          value:     value ?? null,
          ...(metadata ?? {}),
        },
      })
      .select('id, title, priority, created_at')
      .single();

    if (error) {
      console.error('[analytics/conversions POST]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversion: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[analytics/conversions POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — conversion summary for a site
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get('site');
    const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 90);

    if (!site) {
      return NextResponse.json({ error: 'site query parameter is required' }, { status: 400 });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('army_opportunities')
      .select('id, title, priority, revenue_potential, metadata, created_at')
      .eq('type', 'conversion')
      .eq('source_agent', 'conversion-tracker')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[analytics/conversions GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by site in-process (metadata.site field)
    const siteEvents = (data ?? []).filter(
      (row) =>
        row.metadata &&
        typeof row.metadata === 'object' &&
        (row.metadata as Record<string, unknown>).site === site,
    );

    // Build summary
    const summary: Record<ConversionEventType, number> = {
      stripe_checkout: 0,
      form_submit:     0,
      enrolment:       0,
      signup:          0,
      phone_click:     0,
    };

    let totalRevenue = 0;

    for (const row of siteEvents) {
      const meta = row.metadata as Record<string, unknown>;
      const et = meta.eventType as ConversionEventType;
      if (et && summary[et] !== undefined) summary[et]++;
      if (typeof row.revenue_potential === 'number') totalRevenue += row.revenue_potential;
    }

    return NextResponse.json({
      site,
      days,
      totalEvents: siteEvents.length,
      totalRevenueAud: Math.round(totalRevenue * 100) / 100,
      breakdown: summary,
      events: siteEvents.slice(0, 50), // return most recent 50 for display
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[analytics/conversions GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
