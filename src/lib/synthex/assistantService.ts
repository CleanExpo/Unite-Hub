/**
 * Assistant Service Layer
 *
 * Encapsulates all database operations for synthex_assistant_messages table.
 * Used by API routes for AI chat functionality.
 *
 * Phase: B3 - Synthex Assistant
 */

import { createClient } from '@/lib/supabase/server';
import {
  getAnthropicClient,
  recordAnthropicSuccess,
  recordAnthropicFailure,
} from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';

// ============================================================================
// Types
// ============================================================================

export interface AssistantMessage {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversation_id: string | null;
  parent_message_id: string | null;
  tokens_used: number | null;
  model_version: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface SaveMessageParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversationId?: string | null;
  parentMessageId?: string | null;
  tokensUsed?: number | null;
  modelVersion?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface GetHistoryParams {
  tenantId: string;
  userId: string;
  conversationId?: string | null;
  limit?: number;
}

export interface ChatCompletionParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt?: string;
  tenantContext?: {
    businessName?: string;
    businessType?: string;
    brandVoice?: string;
  };
}

export interface ChatCompletionResult {
  content: string;
  tokensUsed: number;
  modelVersion: string;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Save a message to the database
 */
export async function saveMessage(params: SaveMessageParams): Promise<AssistantMessage> {
  const supabase = await createClient();

  const insertData = {
    tenant_id: params.tenantId,
    brand_id: params.brandId || null,
    user_id: params.userId,
    role: params.role,
    content: params.content,
    conversation_id: params.conversationId || null,
    parent_message_id: params.parentMessageId || null,
    tokens_used: params.tokensUsed || null,
    model_version: params.modelVersion || null,
    meta: params.meta ? JSON.stringify(params.meta) : null,
  };

  const { data, error } = await supabase
    .from('synthex_assistant_messages')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[assistantService] Failed to save message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return {
    ...data,
    meta: data.meta ? (typeof data.meta === 'string' ? JSON.parse(data.meta) : data.meta) : null,
  } as AssistantMessage;
}

/**
 * Get conversation history for a user
 */
export async function getHistory(params: GetHistoryParams): Promise<AssistantMessage[]> {
  const { tenantId, userId, conversationId, limit = 50 } = params;

  const supabase = await createClient();

  let query = supabase
    .from('synthex_assistant_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (conversationId) {
    query = query.eq('conversation_id', conversationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[assistantService] Failed to get history:', error);
    throw new Error(`Failed to get history: ${error.message}`);
  }

  return (data || []).map((row) => ({
    ...row,
    meta: row.meta ? (typeof row.meta === 'string' ? JSON.parse(row.meta) : row.meta) : null,
  })) as AssistantMessage[];
}

/**
 * Run AI chat completion using Claude
 */
export async function runChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
  const { messages, systemPrompt, tenantContext } = params;

  // Build system prompt with tenant context
  let fullSystemPrompt = systemPrompt || `You are a helpful AI marketing assistant for Synthex clients.
You help with:
- Content creation (emails, blog posts, social media)
- SEO strategy and optimization
- Marketing campaign planning
- Analytics insights and recommendations

Be concise, actionable, and tailor your responses to small business marketing needs.`;

  if (tenantContext) {
    if (tenantContext.businessName) {
      fullSystemPrompt += `\n\nBusiness context:`;
      fullSystemPrompt += `\n- Business name: ${tenantContext.businessName}`;
    }
    if (tenantContext.businessType) {
      fullSystemPrompt += `\n- Business type: ${tenantContext.businessType}`;
    }
    if (tenantContext.brandVoice) {
      fullSystemPrompt += `\n- Brand voice: ${tenantContext.brandVoice}`;
    }
  }

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 2048,
      system: fullSystemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    recordAnthropicSuccess();

    // Extract text response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    return {
      content: textContent.text,
      tokensUsed,
      modelVersion: ANTHROPIC_MODELS.SONNET_4_5,
    };
  } catch (error) {
    recordAnthropicFailure(error);
    console.error('[assistantService] Chat completion error:', error);
    throw new Error('AI service unavailable');
  }
}

/**
 * Delete all messages for a conversation
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<number> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from('synthex_assistant_messages')
    .delete({ count: 'exact' })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('[assistantService] Failed to delete conversation:', error);
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get recent conversations for a user (grouped by conversation_id)
 */
export async function getRecentConversations(
  tenantId: string,
  userId: string,
  limit: number = 10
): Promise<Array<{ conversation_id: string; last_message: string; created_at: string }>> {
  const supabase = await createClient();

  // Get distinct conversation IDs with their last message
  const { data, error } = await supabase
    .from('synthex_assistant_messages')
    .select('conversation_id, content, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .not('conversation_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit * 2); // Get more to filter duplicates

  if (error) {
    console.error('[assistantService] Failed to get recent conversations:', error);
    throw new Error(`Failed to get recent conversations: ${error.message}`);
  }

  // Deduplicate by conversation_id, keeping the most recent
  const seen = new Set<string>();
  const conversations: Array<{ conversation_id: string; last_message: string; created_at: string }> = [];

  for (const row of data || []) {
    if (row.conversation_id && !seen.has(row.conversation_id)) {
      seen.add(row.conversation_id);
      conversations.push({
        conversation_id: row.conversation_id,
        last_message: row.content.substring(0, 100),
        created_at: row.created_at,
      });
      if (conversations.length >= limit) {
break;
}
    }
  }

  return conversations;
}
