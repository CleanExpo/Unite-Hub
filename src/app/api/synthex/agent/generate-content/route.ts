/**
 * POST /api/synthex/agent/generate-content
 *
 * Generate AI content with the agent.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   contentType: 'email' | 'blog' | 'social' | 'ad_copy'
 *   topic: string (required)
 *   brandId?: string
 *   additionalContext?: string
 * }
 *
 * Phase: B4 - Synthex Agent Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateContent } from '@/lib/synthex/agentOrchestrator';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, contentType, topic, additionalContext } = body;

    if (!tenantId || !contentType || !topic) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, contentType, topic' },
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

    const result = await generateContent({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      contentType,
      topic,
      additionalContext,
    });

    return NextResponse.json({ status: 'ok', ...result }, { status: 200 });
  } catch (error) {
    console.error('[agent/generate-content] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
