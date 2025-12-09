/**
 * GET /api/synthex/audience/score
 * POST /api/synthex/audience/score
 *
 * Manage engagement scores for audience contacts.
 *
 * GET: List scores for tenant
 * Query params:
 * - tenantId: string (required)
 * - limit?: number
 * - offset?: number
 * - minScore?: number
 *
 * POST: Record an event and update score
 * {
 *   tenantId: string (required)
 *   contactId: string (required)
 *   event: { type: string, source?: string, data?: object }
 * }
 *
 * Phase: B11 - Synthex Audience Scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recordEvent, listScores, getScore } from '@/lib/synthex/audienceScoringService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const contactId = searchParams.get('contactId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const minScore = searchParams.get('minScore');

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

    // Get single contact score or list all
    if (contactId) {
      const result = await getScore(contactId);
      if (result.error) {
throw result.error;
}
      return NextResponse.json({ status: 'ok', score: result.data }, { status: 200 });
    }

    const result = await listScores(tenantId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      minScore: minScore ? parseInt(minScore) : undefined,
    });

    if (result.error) {
throw result.error;
}

    return NextResponse.json({
      status: 'ok',
      scores: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[audience/score GET] Error:', error);
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
    const { tenantId, contactId, event } = body;

    if (!tenantId || !contactId || !event) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, contactId, event' },
        { status: 400 }
      );
    }

    if (!event.type) {
      return NextResponse.json(
        { error: 'Missing required field: event.type' },
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

    // Validate contact exists and belongs to tenant
    const { data: contact } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select('id, tenant_id')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contact.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Contact does not belong to tenant' }, { status: 403 });
    }

    const result = await recordEvent(tenantId, contactId, event);

    if (result.error) {
throw result.error;
}

    return NextResponse.json({
      status: 'ok',
      score: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('[audience/score POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
