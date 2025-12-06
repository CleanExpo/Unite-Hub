/**
 * GET /api/synthex/segments
 *
 * List segments for a tenant.
 *
 * Query params:
 * - tenantId: string (required)
 * - audienceId?: string (optional)
 *
 * Phase: B10 - Synthex Audience Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { listSegments } from '@/lib/synthex/audienceService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const audienceId = searchParams.get('audienceId');

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

    const result = await listSegments(tenantId, {
      audienceId: audienceId || undefined,
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      segments: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[segments GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
