/**
 * GET /api/synthex/revenue/events
 * POST /api/synthex/revenue/events
 *
 * List and record revenue events.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - from?: string (YYYY-MM-DD)
 * - to?: string (YYYY-MM-DD)
 * - contactId?: string
 * - journeyId?: string
 * - channel?: string
 * - stage?: string
 * - limit?: number
 * - offset?: number
 *
 * POST Body:
 * {
 *   tenantId: string (required)
 *   amount: number (required)
 *   channel: string (required)
 *   contactId?: string
 *   campaignId?: string
 *   journeyId?: string
 *   stage?: string
 *   touchpointType?: string
 *   currency?: string
 *   eventType?: string
 *   orderId?: string
 *   productSku?: string
 *   productName?: string
 *   quantity?: number
 *   metadata?: object
 *   occurredAt?: string
 * }
 *
 * Phase: B15 - Revenue Attribution by Journey Stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listRevenueEvents,
  recordRevenueEvent,
  Channel,
  JourneyStage,
} from '@/lib/synthex/revenueService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const contactId = searchParams.get('contactId');
    const journeyId = searchParams.get('journeyId');
    const channel = searchParams.get('channel');
    const stage = searchParams.get('stage');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

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

    const result = await listRevenueEvents(tenantId, {
      from: from || undefined,
      to: to || undefined,
      contactId: contactId || undefined,
      journeyId: journeyId || undefined,
      channel: channel as Channel | undefined,
      stage: stage as JourneyStage | undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (result.error) throw result.error;

    return NextResponse.json({
      status: 'ok',
      events: result.data || [],
      count: result.data?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('[revenue/events GET] Error:', error);
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
    const {
      tenantId,
      amount,
      channel,
      contactId,
      campaignId,
      journeyId,
      stage,
      touchpointType,
      currency,
      eventType,
      orderId,
      productSku,
      productName,
      quantity,
      metadata,
      occurredAt,
    } = body;

    if (!tenantId || amount === undefined || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, amount, channel' },
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

    // If contactId provided, validate it exists
    if (contactId) {
      const { data: contact } = await supabaseAdmin
        .from('synthex_audience_contacts')
        .select('id')
        .eq('id', contactId)
        .eq('tenant_id', tenantId)
        .single();

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact not found or does not belong to tenant' },
          { status: 404 }
        );
      }
    }

    // If journeyId provided, validate it exists
    if (journeyId) {
      const { data: journey } = await supabaseAdmin
        .from('synthex_journeys')
        .select('id')
        .eq('id', journeyId)
        .eq('tenant_id', tenantId)
        .single();

      if (!journey) {
        return NextResponse.json(
          { error: 'Journey not found or does not belong to tenant' },
          { status: 404 }
        );
      }
    }

    // Record the revenue event
    const result = await recordRevenueEvent({
      tenantId,
      amount,
      channel,
      contactId,
      campaignId,
      journeyId,
      stage,
      touchpointType,
      currency,
      eventType,
      orderId,
      productSku,
      productName,
      quantity,
      metadata,
      occurredAt,
    });

    if (result.error) throw result.error;

    return NextResponse.json({
      status: 'ok',
      event: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('[revenue/events POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
