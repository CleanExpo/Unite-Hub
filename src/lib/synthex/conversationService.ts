/**
 * Synthex Conversation Intelligence Service
 *
 * Handles conversation tracking, message management,
 * and AI-powered conversation analysis.
 *
 * Phase: B17 - Conversation Intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// =============================================================================
// Types
// =============================================================================

export type Channel = 'email' | 'sms' | 'call' | 'chat' | 'other';
export type Direction = 'inbound' | 'outbound';
export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type MessageRole = 'contact' | 'agent' | 'system' | 'bot';

export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string | null;
  channel: Channel;
  direction: Direction;
  subjectOrTitle: string | null;
  externalId: string | null;
  primaryOwner: string | null;
  assignedTo: string | null;
  status: ConversationStatus;
  priority: string;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  outcome: string | null;
  tags: string[];
  labels: string[];
  messageCount: number;
  unreadCount: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  tenantId: string;
  conversationId: string;
  sender: string;
  senderName: string | null;
  role: MessageRole;
  channel: Channel;
  direction: Direction;
  subject: string | null;
  body: string;
  bodyHtml: string | null;
  attachments: Array<{ name: string; type: string; url: string; size: number }>;
  isRead: boolean;
  isStarred: boolean;
  occurredAt: string;
  createdAt: string;
}

export interface ConversationInsight {
  id: string;
  tenantId: string;
  conversationId: string;
  summary: string | null;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  topics: string[];
  keywords: string[];
  entities: Record<string, unknown>;
  actionItems: Array<{
    description: string;
    assignee?: string;
    dueDate?: string;
    priority?: string;
  }>;
  nextSteps: string[];
  riskFlags: Array<{ type: string; description: string; severity: string }>;
  churnRisk: number | null;
  urgencyScore: number | null;
  primaryIntent: string | null;
  confidenceScore: number | null;
  modelVersion: string;
  analyzedAt: string;
}

export interface ConversationWithDetail {
  conversation: Conversation;
  messages: ConversationMessage[];
  latestInsight: ConversationInsight | null;
}

export interface ConversationEventPayload {
  channel: Channel;
  direction?: Direction;
  subjectOrTitle?: string;
  externalId?: string;
  contactId?: string;
  sender: string;
  senderName?: string;
  body: string;
  bodyHtml?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationFilters {
  channel?: Channel;
  status?: ConversationStatus;
  sentiment?: Sentiment;
  owner?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// =============================================================================
// Ingest Conversation Event
// =============================================================================

export async function ingestConversationEvent(
  tenantId: string,
  payload: ConversationEventPayload
): Promise<ServiceResult<{ conversation: Conversation; message: ConversationMessage }>> {
  try {
    let conversationId: string;

    // Check if conversation exists by externalId
    if (payload.externalId) {
      const { data: existing } = await supabaseAdmin
        .from('synthex_conversations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('external_id', payload.externalId)
        .single();

      if (existing) {
        conversationId = existing.id;
      } else {
        // Create new conversation
        const convResult = await createConversation(tenantId, {
          channel: payload.channel,
          direction: payload.direction || 'inbound',
          subjectOrTitle: payload.subjectOrTitle,
          externalId: payload.externalId,
          contactId: payload.contactId,
        });
        if (convResult.error) {
throw convResult.error;
}
        conversationId = convResult.data!.id;
      }
    } else {
      // Create new conversation without external ID
      const convResult = await createConversation(tenantId, {
        channel: payload.channel,
        direction: payload.direction || 'inbound',
        subjectOrTitle: payload.subjectOrTitle,
        contactId: payload.contactId,
      });
      if (convResult.error) {
throw convResult.error;
}
      conversationId = convResult.data!.id;
    }

    // Add message
    const messagePayload = {
      tenant_id: tenantId,
      conversation_id: conversationId,
      sender: payload.sender,
      sender_name: payload.senderName || null,
      role: 'contact',
      channel: payload.channel,
      direction: payload.direction || 'inbound',
      subject: payload.subjectOrTitle || null,
      body: payload.body,
      body_html: payload.bodyHtml || null,
      metadata: payload.metadata || {},
      occurred_at: payload.occurredAt || new Date().toISOString(),
    };

    const { data: message, error: msgError } = await supabaseAdmin
      .from('synthex_conversation_messages')
      .insert(messagePayload)
      .select()
      .single();

    if (msgError) {
throw msgError;
}

    // Get updated conversation
    const { data: conversation } = await supabaseAdmin
      .from('synthex_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    return {
      data: {
        conversation: mapConversationFromDb(conversation),
        message: mapMessageFromDb(message),
      },
      error: null,
    };
  } catch (error) {
    console.error('[conversationService.ingestConversationEvent] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Create Conversation
// =============================================================================

async function createConversation(
  tenantId: string,
  params: {
    channel: Channel;
    direction?: Direction;
    subjectOrTitle?: string;
    externalId?: string;
    contactId?: string;
  }
): Promise<ServiceResult<Conversation>> {
  try {
    const payload = {
      tenant_id: tenantId,
      channel: params.channel,
      direction: params.direction || 'inbound',
      subject_or_title: params.subjectOrTitle || null,
      external_id: params.externalId || null,
      contact_id: params.contactId || null,
      status: 'open',
      priority: 'normal',
    };

    const { data, error } = await supabaseAdmin
      .from('synthex_conversations')
      .insert(payload)
      .select()
      .single();

    if (error) {
throw error;
}

    return { data: mapConversationFromDb(data), error: null };
  } catch (error) {
    console.error('[conversationService.createConversation] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Get Conversations
// =============================================================================

export async function getConversations(
  tenantId: string,
  filters?: ConversationFilters
): Promise<ServiceResult<Conversation[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.sentiment) {
      query = query.eq('sentiment', filters.sentiment);
    }
    if (filters?.owner) {
      query = query.eq('primary_owner', filters.owner);
    }
    if (filters?.from) {
      query = query.gte('created_at', filters.from);
    }
    if (filters?.to) {
      query = query.lte('created_at', filters.to + 'T23:59:59Z');
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    const conversations = (data || []).map(mapConversationFromDb);
    return { data: conversations, error: null };
  } catch (error) {
    console.error('[conversationService.getConversations] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Get Conversation Detail
// =============================================================================

export async function getConversationDetail(
  tenantId: string,
  conversationId: string
): Promise<ServiceResult<ConversationWithDetail>> {
  try {
    // Get conversation
    const { data: convData, error: convError } = await supabaseAdmin
      .from('synthex_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (convError) {
throw convError;
}
    if (!convData) {
throw new Error('Conversation not found');
}

    // Get messages
    const { data: msgData, error: msgError } = await supabaseAdmin
      .from('synthex_conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('occurred_at', { ascending: true });

    if (msgError) {
throw msgError;
}

    // Get latest insight
    const { data: insightData } = await supabaseAdmin
      .from('synthex_conversation_insights')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      data: {
        conversation: mapConversationFromDb(convData),
        messages: (msgData || []).map(mapMessageFromDb),
        latestInsight: insightData ? mapInsightFromDb(insightData) : null,
      },
      error: null,
    };
  } catch (error) {
    console.error('[conversationService.getConversationDetail] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Analyze Conversation with AI
// =============================================================================

export async function analyzeConversationWithAI(
  tenantId: string,
  conversationId: string
): Promise<ServiceResult<ConversationInsight>> {
  try {
    // Get conversation and messages
    const detailResult = await getConversationDetail(tenantId, conversationId);
    if (detailResult.error) {
throw detailResult.error;
}

    const { conversation, messages } = detailResult.data!;

    if (messages.length === 0) {
      throw new Error('No messages to analyze');
    }

    // Build transcript
    const transcript = messages
      .map((m) => {
        const role = m.role === 'contact' ? 'Customer' : 'Agent';
        const time = new Date(m.occurredAt).toLocaleString();
        return `[${time}] ${role} (${m.sender}):\n${m.body}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Analyze this ${conversation.channel} conversation and provide structured insights.

Conversation Subject: ${conversation.subjectOrTitle || 'N/A'}
Channel: ${conversation.channel}
Messages: ${messages.length}

Transcript:
${transcript}

Provide analysis in JSON format:
{
  "summary": "2-3 sentence summary of the conversation",
  "sentiment": "positive|negative|neutral|mixed",
  "sentiment_score": -1.0 to 1.0,
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2"],
  "action_items": [
    { "description": "action to take", "priority": "high|medium|low" }
  ],
  "next_steps": ["step1", "step2"],
  "risk_flags": [
    { "type": "churn|escalation|compliance", "description": "...", "severity": "high|medium|low" }
  ],
  "churn_risk": 0.0 to 1.0,
  "urgency_score": 0 to 100,
  "primary_intent": "inquiry|complaint|purchase|support|feedback|other",
  "confidence": 0.0 to 1.0
}`;

    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse AI response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI analysis');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Save insight
    const insightPayload = {
      tenant_id: tenantId,
      conversation_id: conversationId,
      summary: parsed.summary,
      sentiment: parsed.sentiment,
      sentiment_score: parsed.sentiment_score,
      topics: parsed.topics || [],
      keywords: parsed.keywords || [],
      action_items: parsed.action_items || [],
      next_steps: parsed.next_steps || [],
      risk_flags: parsed.risk_flags || [],
      churn_risk: parsed.churn_risk,
      urgency_score: parsed.urgency_score,
      primary_intent: parsed.primary_intent,
      confidence_score: parsed.confidence,
      model_version: 'claude-sonnet-4.5',
      analysis_type: 'full',
    };

    const { data: insight, error: insightError } = await supabaseAdmin
      .from('synthex_conversation_insights')
      .insert(insightPayload)
      .select()
      .single();

    if (insightError) {
throw insightError;
}

    // Update conversation with sentiment
    await supabaseAdmin
      .from('synthex_conversations')
      .update({
        sentiment: parsed.sentiment,
        sentiment_score: parsed.sentiment_score,
      })
      .eq('id', conversationId);

    return { data: mapInsightFromDb(insight), error: null };
  } catch (error) {
    console.error('[conversationService.analyzeConversationWithAI] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Helpers
// =============================================================================

function mapConversationFromDb(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    contactId: row.contact_id as string | null,
    channel: row.channel as Channel,
    direction: row.direction as Direction,
    subjectOrTitle: row.subject_or_title as string | null,
    externalId: row.external_id as string | null,
    primaryOwner: row.primary_owner as string | null,
    assignedTo: row.assigned_to as string | null,
    status: row.status as ConversationStatus,
    priority: row.priority as string,
    sentiment: row.sentiment as Sentiment | null,
    sentimentScore: row.sentiment_score as number | null,
    outcome: row.outcome as string | null,
    tags: (row.tags as string[]) || [],
    labels: (row.labels as string[]) || [],
    messageCount: row.message_count as number,
    unreadCount: row.unread_count as number,
    firstMessageAt: row.first_message_at as string | null,
    lastMessageAt: row.last_message_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMessageFromDb(row: Record<string, unknown>): ConversationMessage {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    conversationId: row.conversation_id as string,
    sender: row.sender as string,
    senderName: row.sender_name as string | null,
    role: row.role as MessageRole,
    channel: row.channel as Channel,
    direction: row.direction as Direction,
    subject: row.subject as string | null,
    body: row.body as string,
    bodyHtml: row.body_html as string | null,
    attachments: (row.attachments as ConversationMessage['attachments']) || [],
    isRead: row.is_read as boolean,
    isStarred: row.is_starred as boolean,
    occurredAt: row.occurred_at as string,
    createdAt: row.created_at as string,
  };
}

function mapInsightFromDb(row: Record<string, unknown>): ConversationInsight {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    conversationId: row.conversation_id as string,
    summary: row.summary as string | null,
    sentiment: row.sentiment as Sentiment | null,
    sentimentScore: row.sentiment_score as number | null,
    topics: (row.topics as string[]) || [],
    keywords: (row.keywords as string[]) || [],
    entities: (row.entities as Record<string, unknown>) || {},
    actionItems: (row.action_items as ConversationInsight['actionItems']) || [],
    nextSteps: (row.next_steps as string[]) || [],
    riskFlags: (row.risk_flags as ConversationInsight['riskFlags']) || [],
    churnRisk: row.churn_risk as number | null,
    urgencyScore: row.urgency_score as number | null,
    primaryIntent: row.primary_intent as string | null,
    confidenceScore: row.confidence_score as number | null,
    modelVersion: row.model_version as string,
    analyzedAt: row.analyzed_at as string,
  };
}
