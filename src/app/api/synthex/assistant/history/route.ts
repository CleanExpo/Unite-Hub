/**
 * GET /api/synthex/assistant/history
 *
 * Get chat history for a tenant/user.
 *
 * Query parameters:
 * - tenantId: string (required)
 * - conversationId?: string (to get specific conversation)
 * - limit?: number (default 50)
 *
 * Response:
 * {
 *   status: 'ok',
 *   messages: AssistantMessage[],
 *   conversations?: Array<{ conversation_id, last_message, created_at }>
 * }
 *
 * Phase: B3 - Synthex Assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getHistory, getRecentConversations } from '@/lib/synthex/assistantService';

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
    const conversationId = searchParams.get('conversationId');
    const limitParam = searchParams.get('limit');

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

    // Ensure user owns this tenant
    if (tenant.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to access this tenant' },
        { status: 403 }
      );
    }

    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50;

    // Get messages
    const messages = await getHistory({
      tenantId,
      userId: user.id,
      conversationId: conversationId || undefined,
      limit,
    });

    // If no specific conversation, also get recent conversations list
    let conversations = undefined;
    if (!conversationId) {
      conversations = await getRecentConversations(tenantId, user.id, 10);
    }

    return NextResponse.json(
      {
        status: 'ok',
        messages,
        conversations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[assistant/history] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
