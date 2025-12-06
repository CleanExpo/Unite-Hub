/**
 * POST /api/synthex/agent/suggest-metadata
 *
 * Get AI suggestions for content metadata (title, tags, category).
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   content: string (required)
 *   contentType: string
 * }
 *
 * Phase: B4 - Synthex Agent Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { suggestMetadata } from '@/lib/synthex/agentOrchestrator';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, content, contentType } = body;

    if (!tenantId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, content' },
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

    const result = await suggestMetadata({
      tenantId,
      content,
      contentType: contentType || 'general',
    });

    return NextResponse.json({ status: 'ok', ...result }, { status: 200 });
  } catch (error) {
    console.error('[agent/suggest-metadata] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
