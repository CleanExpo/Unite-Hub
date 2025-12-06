/**
 * GET /api/synthex/lead
 *
 * List lead models for a tenant.
 *
 * Query params:
 * - tenantId: string (required)
 * - contactId?: string (optional - for single model)
 * - limit?: number
 * - offset?: number
 * - minScore?: number
 *
 * Phase: B12 - Lead Scoring + Churn AI + LTV + Journey Mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { listLeadModels, getLeadModel } from '@/lib/synthex/leadEngineService';

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

    // Get single contact model or list all
    if (contactId) {
      const result = await getLeadModel(contactId);
      if (result.error) throw result.error;
      return NextResponse.json({ status: 'ok', leadModel: result.data }, { status: 200 });
    }

    const result = await listLeadModels(tenantId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      minScore: minScore ? parseInt(minScore) : undefined,
    });

    if (result.error) throw result.error;

    return NextResponse.json({
      status: 'ok',
      leadModels: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[lead GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
