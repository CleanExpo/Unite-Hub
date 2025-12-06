/**
 * /api/synthex/campaigns
 *
 * GET: List campaigns for a tenant with filters and pagination.
 * POST: Create new campaign.
 *
 * Phase: B3 - Synthex Campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  listCampaigns,
  createCampaign,
  getCampaignStats,
  type CampaignType,
  type CampaignStatus,
} from '@/lib/synthex/campaignService';

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const brandId = searchParams.get('brandId');
    const type = searchParams.get('type') as CampaignType | null;
    const status = searchParams.get('status') as CampaignStatus | null;
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Validate required fields
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

    const result = await listCampaigns({
      tenantId,
      brandId: brandId || undefined,
      type: type || undefined,
      status: status || undefined,
      limit,
      offset,
    });

    const response: Record<string, unknown> = {
      status: 'ok',
      campaigns: result.campaigns,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: result.hasMore,
      },
    };

    if (includeStats) {
      response.stats = await getCampaignStats(tenantId, brandId || undefined);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[campaigns] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tenantId,
      brandId,
      name,
      description,
      type,
      steps,
      scheduledAt,
      targetAudience,
      settings,
      meta,
    } = body;

    // Validate required fields
    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid tenantId' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid name' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    const campaign = await createCampaign({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      name,
      description: description || null,
      type: type || 'email',
      steps: steps || [],
      scheduledAt: scheduledAt || null,
      targetAudience: targetAudience || null,
      settings: settings || null,
      meta: meta || null,
    });

    return NextResponse.json(
      {
        status: 'ok',
        campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[campaigns] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
