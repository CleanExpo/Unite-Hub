/**
 * POST /api/synthex/delivery/run
 *
 * Process due scheduled deliveries.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   limit?: number (max schedules to process, default 50)
 *   dryRun?: boolean (simulate without sending)
 * }
 *
 * Response:
 * {
 *   status: 'ok' | 'error'
 *   processed: number
 *   successful: number
 *   failed: number
 *   errors?: string[]
 * }
 *
 * Phase: B6 - Synthex Outbound Delivery Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  processDueSchedules,
  getDeliveryStatsSummary,
  retryFailedDeliveries,
} from '@/lib/synthex/deliveryEngine';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, limit, dryRun, action } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
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

    // Handle different actions
    if (action === 'retry') {
      // Retry failed deliveries
      const result = await retryFailedDeliveries(tenantId, { limit: limit || 100 });
      return NextResponse.json({
        status: 'ok',
        action: 'retry',
        retried: result.retried,
        errors: result.errors.length > 0 ? result.errors : undefined,
      }, { status: 200 });
    }

    if (action === 'stats') {
      // Get delivery statistics
      const result = await getDeliveryStatsSummary(tenantId, { days: body.days || 30 });
      if (result.error) {
        throw result.error;
      }
      return NextResponse.json({
        status: 'ok',
        action: 'stats',
        stats: result.data,
      }, { status: 200 });
    }

    // Default: Process due schedules
    const result = await processDueSchedules({
      limit: limit || 50,
      dryRun: dryRun || false,
      onProgress: (processed, total) => {
        console.log(`[Delivery] Processing ${processed}/${total}`);
      },
    });

    return NextResponse.json({
      status: 'ok',
      action: 'process',
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined,
    }, { status: 200 });
  } catch (error) {
    console.error('[delivery/run POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const days = parseInt(searchParams.get('days') || '30');
    const campaignId = searchParams.get('campaignId');

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

    // Get delivery stats summary
    const result = await getDeliveryStatsSummary(tenantId, {
      days,
      campaignId: campaignId || undefined,
    });

    if (result.error) {
      throw result.error;
    }

    // Get recent delivery logs
    const { data: recentLogs } = await supabaseAdmin
      .from('synthex_delivery_log')
      .select('id, channel, recipient, status, attempted_at, delivered_at, error_message')
      .eq('tenant_id', tenantId)
      .order('attempted_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      status: 'ok',
      stats: result.data,
      recentDeliveries: recentLogs || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[delivery/run GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
