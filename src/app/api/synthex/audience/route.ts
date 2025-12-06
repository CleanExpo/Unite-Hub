/**
 * GET /api/synthex/audience
 * POST /api/synthex/audience
 *
 * Manage audiences for a tenant.
 *
 * GET: List audiences
 * Query params:
 * - tenantId: string (required)
 * - brandId?: string (optional)
 *
 * POST: Create audience
 * {
 *   tenantId: string (required)
 *   name: string (required)
 *   description?: string
 *   audienceType?: 'static' | 'dynamic' | 'smart'
 *   brandId?: string
 * }
 *
 * Phase: B10 - Synthex Audience Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createAudience, listAudiences } from '@/lib/synthex/audienceService';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const brandId = searchParams.get('brandId');

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

    const result = await listAudiences(tenantId, { brandId: brandId || undefined });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      audiences: result.data || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[audience GET] Error:', error);
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
    const { tenantId, name, description, audienceType, brandId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
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

    const result = await createAudience(tenantId, {
      name,
      description,
      audienceType,
      brandId,
    });

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      audience: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('[audience POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
