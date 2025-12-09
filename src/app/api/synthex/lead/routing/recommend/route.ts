/**
 * POST /api/synthex/lead/routing/recommend
 *
 * Get AI-powered routing recommendation for a lead.
 *
 * Body:
 * {
 *   tenantId: string (required)
 *   leadId: string (required)
 * }
 *
 * Phase: B16 - Predictive Lead Routing Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  getRoutableLeads,
  getRoutingRecommendation,
} from '@/lib/synthex/leadRoutingService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, leadId } = body;

    if (!tenantId || !leadId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, leadId' },
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

    // Get the lead
    const leadsResult = await getRoutableLeads(tenantId, { limit: 1000 });
    if (leadsResult.error) {
throw leadsResult.error;
}

    const lead = leadsResult.data?.find((l) => l.id === leadId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found or does not belong to tenant' },
        { status: 404 }
      );
    }

    // Get routing recommendation
    const result = await getRoutingRecommendation(tenantId, lead);

    if (result.error) {
      // Check if it's an API key issue
      if (result.error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured. Please contact support.' },
          { status: 500 }
        );
      }
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      lead: {
        id: lead.id,
        email: lead.email,
        name: lead.name,
        company: lead.company,
        leadScore: lead.leadScore,
        currentOwner: lead.currentOwner,
      },
      recommendation: result.data,
    }, { status: 200 });
  } catch (error) {
    console.error('[lead/routing/recommend POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
