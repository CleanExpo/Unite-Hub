/**
 * GET /api/synthex/analytics/channels
 * POST /api/synthex/analytics/channels
 *
 * Get channel events or record new channel events.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - channel?: string (optional filter)
 * - eventType?: string (optional filter)
 * - days?: number (default 30)
 *
 * POST body:
 * {
 *   tenantId: string (required)
 *   events: Array<{
 *     channel: string
 *     eventType: string
 *     count?: number
 *     metadata?: object
 *   }>
 * }
 *
 * Phase: B8 - Synthex Real-Time Channel Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getChannelEvents,
  recordChannelEvents,
  ChannelType,
  ChannelEventType,
} from '@/lib/synthex/channelAnalyticsService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const channel = searchParams.get('channel') as ChannelType | null;
    const eventType = searchParams.get('eventType') as ChannelEventType | null;
    const days = parseInt(searchParams.get('days') || '30');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required param: tenantId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get channel events
    const result = await getChannelEvents(tenantId, {
      channel: channel || undefined,
      eventType: eventType || undefined,
      days,
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      events: result.data || [],
      count: result.data?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('[analytics/channels GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, events } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid field: events (must be non-empty array)' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Transform and record events
    const channelEvents = events.map((e: {
      channel: ChannelType;
      eventType: ChannelEventType;
      campaignId?: string;
      count?: number;
      metadata?: Record<string, unknown>;
    }) => ({
      tenantId,
      brandId: brandId || undefined,
      campaignId: e.campaignId,
      channel: e.channel,
      eventType: e.eventType,
      count: e.count || 1,
      metadata: e.metadata,
    }));

    const result = await recordChannelEvents(channelEvents);

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      recorded: result.data?.count || 0,
    }, { status: 201 });
  } catch (error) {
    console.error('[analytics/channels POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
