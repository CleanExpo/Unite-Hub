/**
 * GET /api/synthex/journeys
 * POST /api/synthex/journeys
 *
 * List and create customer journeys.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - cohortId?: string
 * - stage?: string
 * - activeOnly?: boolean
 * - limit?: number
 * - offset?: number
 *
 * POST Body:
 * {
 *   tenantId: string (required)
 *   contactId: string (required)
 *   cohortId?: string
 *   initialStage?: string
 * }
 *
 * Phase: B14 - Cohort-Based Journey Analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listJourneys,
  createJourney,
  generateAnalytics,
  JourneyStage,
} from '@/lib/synthex/journeyService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const cohortId = searchParams.get('cohortId');
    const stage = searchParams.get('stage');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

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

    const result = await listJourneys(tenantId, {
      cohortId: cohortId || undefined,
      stage: stage as JourneyStage || undefined,
      activeOnly,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (result.error) throw result.error;

    const response: {
      status: string;
      journeys: typeof result.data;
      analytics?: Awaited<ReturnType<typeof generateAnalytics>>['data'];
    } = {
      status: 'ok',
      journeys: result.data || [],
    };

    // Optionally include analytics
    if (includeAnalytics) {
      const analyticsResult = await generateAnalytics(tenantId, cohortId || undefined);
      response.analytics = analyticsResult.data;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[journeys GET] Error:', error);
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
    const { tenantId, contactId, cohortId, initialStage } = body;

    if (!tenantId || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, contactId' },
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

    // Validate contact exists
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

    // Create journey
    const result = await createJourney(tenantId, contactId, {
      cohortId,
      initialStage: initialStage as JourneyStage,
    });

    if (result.error) throw result.error;

    return NextResponse.json({
      status: 'ok',
      journey: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('[journeys POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
