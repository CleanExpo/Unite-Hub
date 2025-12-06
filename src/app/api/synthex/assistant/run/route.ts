/**
 * POST /api/synthex/assistant/run
 *
 * Run an AI chat completion and save the conversation.
 *
 * Request body:
 * {
 *   tenantId: string (required)
 *   brandId?: string
 *   prompt: string (required)
 *   conversationId?: string (for continuing conversations)
 * }
 *
 * Response:
 * {
 *   status: 'ok',
 *   message: AssistantMessage,
 *   conversationId: string
 * }
 *
 * Phase: B3 - Synthex Assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  saveMessage,
  getHistory,
  runChatCompletion,
} from '@/lib/synthex/assistantService';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, brandId, prompt, conversationId } = body;

    // Validate required fields
    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid tenantId' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    // Validate tenant exists and user has access
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id, business_name, business_type')
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

    // Generate or use existing conversation ID
    const activeConversationId = conversationId || uuidv4();

    // Get conversation history if continuing a conversation
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (conversationId) {
      const historyMessages = await getHistory({
        tenantId,
        userId: user.id,
        conversationId,
        limit: 20, // Limit context window
      });

      history = historyMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
    }

    // Add current prompt to history
    history.push({ role: 'user', content: prompt.trim() });

    // Save user message
    await saveMessage({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      role: 'user',
      content: prompt.trim(),
      conversationId: activeConversationId,
    });

    // Run AI completion
    const completion = await runChatCompletion({
      messages: history,
      tenantContext: {
        businessName: tenant.business_name || undefined,
        businessType: tenant.business_type || undefined,
      },
    });

    // Save assistant response
    const assistantMessage = await saveMessage({
      tenantId,
      brandId: brandId || null,
      userId: user.id,
      role: 'assistant',
      content: completion.content,
      conversationId: activeConversationId,
      tokensUsed: completion.tokensUsed,
      modelVersion: completion.modelVersion,
    });

    return NextResponse.json(
      {
        status: 'ok',
        message: assistantMessage,
        conversationId: activeConversationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[assistant/run] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
