/**
 * GET/POST /api/synthex/schedule
 *
 * Manage campaign schedules.
 *
 * GET Query params:
 * - tenantId: string (required)
 * - campaignId?: string (filter by campaign)
 * - status?: 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled'
 * - upcoming?: boolean (only future schedules)
 * - limit?: number
 *
 * POST body:
 * {
 *   campaignId: string (required)
 *   tenantId: string (required)
 *   brandId?: string
 *   steps: Array<{
 *     stepIndex: number
 *     sendAt: string (ISO date)
 *     recipientCount?: number
 *   }>
 *   timezone?: string (default 'UTC')
 * }
 *
 * Phase: B5 - Synthex Campaign Scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  createSchedule,
  listSchedules,
  getSchedulesByCampaign,
} from '@/lib/synthex/scheduleService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = searchParams.get('limit');

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

    let result;

    if (campaignId) {
      // Get schedules for specific campaign
      result = await getSchedulesByCampaign(campaignId);
    } else {
      // List all schedules for tenant
      result = await listSchedules(tenantId, user.id, {
        status: status || undefined,
        upcoming,
        limit: limit ? parseInt(limit) : 50,
      });
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      schedules: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[schedule GET] Error:', error);
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
    const { campaignId, tenantId, brandId, steps, timezone } = body;

    if (!campaignId || !tenantId || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, tenantId, steps' },
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

    // Validate campaign belongs to tenant
    const { data: campaign } = await supabaseAdmin
      .from('synthex_campaigns')
      .select('id, tenant_id')
      .eq('id', campaignId)
      .single();

    if (!campaign || campaign.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Validate steps
    const validatedSteps = steps.map((step, index) => {
      if (!step.sendAt) {
        throw new Error(`Step ${index} is missing sendAt`);
      }

      const sendAtDate = new Date(step.sendAt);
      if (isNaN(sendAtDate.getTime())) {
        throw new Error(`Step ${index} has invalid sendAt date`);
      }

      return {
        stepIndex: step.stepIndex ?? index,
        sendAt: sendAtDate,
        recipientCount: step.recipientCount || 0,
      };
    });

    const result = await createSchedule({
      campaignId,
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      steps: validatedSteps,
      timezone: timezone || 'UTC',
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      schedules: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('[schedule POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
