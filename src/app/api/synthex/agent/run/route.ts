/**
 * POST /api/synthex/agent/run
 *
 * Run the Synthex autonomous agent with context awareness.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   task: string (required) - The task or question for the agent
 *   brandId?: string
 *   conversationId?: string
 *   autonomousMode?: boolean - If true, agent can suggest actions
 * }
 *
 * Response:
 * {
 *   status: 'ok',
 *   response: string,
 *   tokensUsed: number,
 *   conversationId: string,
 *   actions?: AgentAction[]
 * }
 *
 * Phase: B4 - Synthex Agent Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { runAgent } from '@/lib/synthex/agentOrchestrator';

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, task, conversationId, autonomousMode } = body;

    // Validate required fields
    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid tenantId' },
        { status: 400 }
      );
    }

    if (!task || typeof task !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid task' },
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

    // Run the agent
    const result = await runAgent({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      task,
      conversationId: conversationId || null,
      autonomousMode: autonomousMode === true,
    });

    return NextResponse.json(
      {
        status: 'ok',
        response: result.response,
        tokensUsed: result.tokensUsed,
        conversationId: result.conversationId,
        actions: result.actions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[agent/run] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
