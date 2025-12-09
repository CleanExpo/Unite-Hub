/**
 * GET /api/synthex/lead/routing/log
 *
 * List routing decision log entries.
 *
 * Query params:
 * - tenantId: string (required)
 * - status?: string (pending, accepted, rejected, modified)
 * - ownerId?: string
 * - from?: string (YYYY-MM-DD)
 * - to?: string (YYYY-MM-DD)
 * - limit?: number
 * - offset?: number
 *
 * Phase: B16 - Predictive Lead Routing Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { listRoutingLog } from '@/lib/synthex/leadRoutingService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
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

    const result = await listRoutingLog(tenantId, {
      status: status || undefined,
      ownerId: ownerId || undefined,
      from: from || undefined,
      to: to || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : undefined,
    });

    if (result.error) {
throw result.error;
}

    return NextResponse.json({
      status: 'ok',
      entries: result.data || [],
      count: result.data?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('[lead/routing/log GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
