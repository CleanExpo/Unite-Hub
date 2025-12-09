/**
 * POST /api/synthex/lead/routing/apply
 *
 * Apply a routing decision to assign a lead to an owner.
 *
 * Body:
 * {
 *   tenantId: string (required)
 *   leadId: string (required)
 *   recommendedOwner: string (required)
 *   priorityScore?: number
 *   recommendedChannel?: string
 *   confidence?: number
 *   reason?: string
 *   factors?: string[]
 * }
 *
 * Phase: B16 - Predictive Lead Routing Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { applyRoutingDecision } from '@/lib/synthex/leadRoutingService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tenantId,
      leadId,
      recommendedOwner,
      priorityScore = 50,
      recommendedChannel = 'email',
      confidence = 1.0,
      reason = 'Manual assignment',
      factors = ['manual_decision'],
    } = body;

    if (!tenantId || !leadId || !recommendedOwner) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, leadId, recommendedOwner' },
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

    // Validate lead exists
    const { data: lead } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select('id')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single();

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found or does not belong to tenant' },
        { status: 404 }
      );
    }

    // Apply the routing decision
    const result = await applyRoutingDecision(
      tenantId,
      leadId,
      {
        leadId,
        recommendedOwner,
        priorityScore,
        recommendedChannel,
        confidence,
        reason,
        factors,
      },
      user.id
    );

    if (result.error) {
throw result.error;
}

    return NextResponse.json({
      status: 'ok',
      logEntry: result.data,
    }, { status: 200 });
  } catch (error) {
    console.error('[lead/routing/apply POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
