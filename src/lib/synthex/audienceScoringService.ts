/**
 * Synthex Audience Scoring Service
 *
 * Handles engagement scoring, event tracking, AI persona classification,
 * and smart tagging for audience contacts.
 *
 * Phase: B11 - Audience Scoring + Smart Tags + Behavioral Intelligence
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// =============================================================================
// Types
// =============================================================================

export interface AudienceEvent {
  type: 'impression' | 'open' | 'click' | 'conversion' | 'reply' | 'unsubscribe' | 'bounce';
  source?: 'email' | 'sms' | 'push' | 'web';
  data?: Record<string, unknown>;
}

export interface AudienceScore {
  id: string;
  contactId: string;
  tenantId: string;
  engagementScore: number;
  activityVector: Record<string, number>;
  lastEventAt: string | null;
  persona: string | null;
  personaConfidence: number | null;
  tags: string[];
  totalEvents: number;
  positiveSignals: number;
  negativeSignals: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaClassification {
  persona: string;
  confidence: number;
  tags: string[];
  reasoning: string;
}

// =============================================================================
// Event Weights
// =============================================================================

const EVENT_WEIGHTS: Record<string, number> = {
  impression: 1,
  open: 3,
  click: 5,
  conversion: 20,
  reply: 10,
  unsubscribe: -15,
  bounce: -20,
};

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Record a behavioral event for a contact and update their score
 */
export async function recordEvent(
  tenantId: string,
  contactId: string,
  event: AudienceEvent
): Promise<{ data: AudienceScore | null; error: Error | null }> {
  try {
    const weight = EVENT_WEIGHTS[event.type] || 0;
    const isPositive = weight > 0;
    const isNegative = weight < 0;

    // Log the raw event
    await supabaseAdmin.from('synthex_audience_events').insert({
      contact_id: contactId,
      tenant_id: tenantId,
      event_type: event.type,
      event_source: event.source || null,
      event_data: event.data || {},
      weight,
    });

    // Get existing score
    const { data: existing } = await supabaseAdmin
      .from('synthex_audience_scores')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    const activityVector = existing?.activity_vector || {};
    activityVector[event.type] = (activityVector[event.type] || 0) + 1;

    const payload = {
      engagement_score: (existing?.engagement_score || 0) + weight,
      activity_vector: activityVector,
      last_event_at: new Date().toISOString(),
      total_events: (existing?.total_events || 0) + 1,
      positive_signals: (existing?.positive_signals || 0) + (isPositive ? 1 : 0),
      negative_signals: (existing?.negative_signals || 0) + (isNegative ? 1 : 0),
    };

    let result;
    if (!existing) {
      // Create new score record
      result = await supabaseAdmin
        .from('synthex_audience_scores')
        .insert({
          tenant_id: tenantId,
          contact_id: contactId,
          ...payload,
        })
        .select()
        .single();
    } else {
      // Update existing
      result = await supabaseAdmin
        .from('synthex_audience_scores')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return { data: mapScoreFromDb(result.data), error: null };
  } catch (error) {
    console.error('[audienceScoringService] recordEvent error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Classify a contact's persona using AI
 */
export async function classifyPersona(
  contact: Record<string, unknown>
): Promise<{ data: PersonaClassification | null; error: Error | null }> {
  try {
    const client = getAnthropicClient();

    // Privacy-preserving: only send aggregate/anonymized data
    const sanitizedContact = {
      totalEvents: contact.totalEvents || 0,
      positiveSignals: contact.positiveSignals || 0,
      negativeSignals: contact.negativeSignals || 0,
      engagementScore: contact.engagementScore || 0,
      activityVector: contact.activityVector || {},
      tags: contact.tags || [],
      attributes: contact.attributes || {},
    };

    const prompt = `You are an audience intelligence AI. Classify this contact into a marketing persona based on their behavior.

Contact Data:
${JSON.stringify(sanitizedContact, null, 2)}

Return a JSON object with:
- persona: A short persona name (e.g., "Early Adopter", "Price Conscious", "Brand Loyalist", "Window Shopper", "Power User", "At-Risk", "New Prospect")
- confidence: A number between 0 and 1
- tags: An array of relevant behavioral tags (e.g., ["high-engagement", "mobile-first", "email-responsive"])
- reasoning: A brief explanation of why this persona fits

Return ONLY valid JSON, no markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsed = JSON.parse(content.text) as PersonaClassification;
    return { data: parsed, error: null };
  } catch (error) {
    console.error('[audienceScoringService] classifyPersona error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Update a contact's persona and tags
 */
export async function updatePersona(
  contactId: string,
  persona: string,
  personaConfidence: number,
  tags: string[]
): Promise<{ data: AudienceScore | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_audience_scores')
      .update({
        persona,
        persona_confidence: personaConfidence,
        tags,
      })
      .eq('contact_id', contactId)
      .select()
      .single();

    if (error) {
throw error;
}
    return { data: mapScoreFromDb(data), error: null };
  } catch (error) {
    console.error('[audienceScoringService] updatePersona error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * List all scores for a tenant
 */
export async function listScores(
  tenantId: string,
  options?: { limit?: number; offset?: number; minScore?: number }
): Promise<{ data: AudienceScore[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_audience_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('engagement_score', { ascending: false });

    if (options?.minScore !== undefined) {
      query = query.gte('engagement_score', options.minScore);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) {
throw error;
}

    return { data: (data || []).map(mapScoreFromDb), error: null };
  } catch (error) {
    console.error('[audienceScoringService] listScores error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Get score for a specific contact
 */
export async function getScore(
  contactId: string
): Promise<{ data: AudienceScore | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_audience_scores')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (error && error.code !== 'PGRST116') {
throw error;
}
    return { data: data ? mapScoreFromDb(data) : null, error: null };
  } catch (error) {
    console.error('[audienceScoringService] getScore error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Get recent events for a contact
 */
export async function getEvents(
  contactId: string,
  limit = 50
): Promise<{ data: unknown[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_audience_events')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
throw error;
}
    return { data, error: null };
  } catch (error) {
    console.error('[audienceScoringService] getEvents error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapScoreFromDb(row: Record<string, unknown>): AudienceScore {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    tenantId: row.tenant_id as string,
    engagementScore: row.engagement_score as number,
    activityVector: (row.activity_vector as Record<string, number>) || {},
    lastEventAt: row.last_event_at as string | null,
    persona: row.persona as string | null,
    personaConfidence: row.persona_confidence as number | null,
    tags: (row.tags as string[]) || [],
    totalEvents: row.total_events as number,
    positiveSignals: row.positive_signals as number,
    negativeSignals: row.negative_signals as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
