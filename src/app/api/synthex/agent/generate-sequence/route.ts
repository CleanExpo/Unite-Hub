/**
 * POST /api/synthex/agent/generate-sequence
 *
 * Generate a campaign sequence using AI.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   campaignType: 'drip' | 'email' | 'newsletter'
 *   goal: string (required)
 *   brandId?: string
 *   emailCount?: number (default 5)
 * }
 *
 * Phase: B4 - Synthex Agent Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateCampaignSequence } from '@/lib/synthex/agentOrchestrator';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, campaignType, goal, emailCount } = body;

    if (!tenantId || !campaignType || !goal) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, campaignType, goal' },
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

    const result = await generateCampaignSequence({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      campaignType,
      goal,
      emailCount: emailCount || 5,
    });

    return NextResponse.json({ status: 'ok', ...result }, { status: 200 });
  } catch (error) {
    console.error('[agent/generate-sequence] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
