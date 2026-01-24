/**
 * Synthex Lead Engine Service
 *
 * Handles lead scoring, churn prediction, LTV estimation,
 * and customer journey mapping using AI.
 *
 * Phase: B12 - Lead Scoring + Churn AI + LTV + Journey Mapping
 *
 * @deprecated MIGRATING TO STANDALONE SYNTHEX
 * This service is being extracted to: github.com/CleanExpo/Synthex
 * New location: lib/services/leads/leadEngineService.ts
 *
 * DO NOT add new features here. All new development should happen in Synthex repo.
 * This file will be removed once Unite-Hub fully delegates to Synthex via webhooks.
 *
 * Migration date: 2026-01-24
 * Target removal: After Synthex V1 launch
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// =============================================================================
// Types
// =============================================================================

export interface LeadModel {
  id: string;
  contactId: string;
  tenantId: string;
  leadScore: number;
  leadGrade: string | null;
  churnRisk: number;
  churnFactors: string[];
  ltvEstimate: number;
  ltvConfidence: number | null;
  journey: JourneyMap | null;
  currentStage: string | null;
  stageEnteredAt: string | null;
  modelVersion: string;
  lastComputedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyMap {
  stages: JourneyStage[];
  bottlenecks: string[];
  recommendations: string[];
}

export interface JourneyStage {
  name: string;
  enteredAt?: string;
  exitedAt?: string;
  duration?: number;
  events?: string[];
}

export interface ChurnPrediction {
  churn_risk: number;
  factors: string[];
}

export interface LTVPrediction {
  ltv: number;
  confidence: number;
}

export interface AudienceEvent {
  type: string;
  timestamp?: string;
  source?: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Event Weights for Lead Scoring
// =============================================================================

const LEAD_SCORE_WEIGHTS: Record<string, number> = {
  impression: 1,
  open: 3,
  click: 5,
  conversion: 25,
  reply: 15,
  form_submit: 20,
  download: 10,
  page_view: 2,
  unsubscribe: -20,
  bounce: -25,
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
// Lead Scoring
// =============================================================================

/**
 * Calculate lead score from activity vector and engagement score
 */
export function calculateLeadScore(
  activityVector: Record<string, number>,
  engagementScore: number
): number {
  let score = engagementScore;

  for (const [eventType, count] of Object.entries(activityVector)) {
    const weight = LEAD_SCORE_WEIGHTS[eventType] || 0;
    score += count * weight;
  }

  return Math.max(0, score); // Never negative
}

/**
 * Get lead grade based on score
 */
export function getLeadGrade(score: number): string {
  if (score >= 100) {
return 'A';
}
  if (score >= 75) {
return 'B';
}
  if (score >= 50) {
return 'C';
}
  if (score >= 25) {
return 'D';
}
  return 'F';
}

// =============================================================================
// Churn Prediction
// =============================================================================

/**
 * Predict churn probability using AI
 */
export async function predictChurn(
  contact: Record<string, unknown>
): Promise<{ data: ChurnPrediction | null; error: Error | null }> {
  try {
    const client = getAnthropicClient();

    // Privacy-preserving: only send aggregate/behavioral data
    const sanitizedContact = {
      engagementScore: contact.engagementScore || 0,
      lastActiveAt: contact.lastActiveAt || null,
      totalEvents: contact.totalEvents || 0,
      positiveSignals: contact.positiveSignals || 0,
      negativeSignals: contact.negativeSignals || 0,
      daysSinceLastActivity: contact.daysSinceLastActivity || null,
      activityTrend: contact.activityTrend || 'stable',
    };

    const prompt = `You are a churn prediction AI. Analyze this contact's behavioral data and predict their churn probability.

Contact Data:
${JSON.stringify(sanitizedContact, null, 2)}

Return a JSON object with:
- churn_risk: A number between 0 and 1 (1 = definitely churning)
- factors: An array of factors contributing to churn risk (e.g., ["declining_engagement", "no_recent_activity"])

Return ONLY valid JSON, no markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsed = JSON.parse(content.text) as ChurnPrediction;
    return { data: parsed, error: null };
  } catch (error) {
    console.error('[leadEngineService] predictChurn error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// =============================================================================
// LTV Prediction
// =============================================================================

/**
 * Predict lifetime value using AI
 */
export async function predictLTV(
  contact: Record<string, unknown>
): Promise<{ data: LTVPrediction | null; error: Error | null }> {
  try {
    const client = getAnthropicClient();

    // Privacy-preserving: only send aggregate/behavioral data
    const sanitizedContact = {
      engagementScore: contact.engagementScore || 0,
      leadScore: contact.leadScore || 0,
      conversions: contact.conversions || 0,
      totalEvents: contact.totalEvents || 0,
      persona: contact.persona || null,
      tenure: contact.tenure || null, // Days since first contact
      averageOrderValue: contact.averageOrderValue || null,
    };

    const prompt = `You are a customer LTV prediction AI. Estimate the lifetime value of this contact in AUD.

Contact Data:
${JSON.stringify(sanitizedContact, null, 2)}

Consider:
- High engagement typically correlates with higher LTV
- Conversions are strong indicators of purchase intent
- Persona type affects spending patterns

Return a JSON object with:
- ltv: Estimated lifetime value in AUD (number)
- confidence: Confidence in the estimate (0-1)

Return ONLY valid JSON, no markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsed = JSON.parse(content.text) as LTVPrediction;
    return { data: parsed, error: null };
  } catch (error) {
    console.error('[leadEngineService] predictLTV error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// =============================================================================
// Journey Mapping
// =============================================================================

/**
 * Generate customer journey map from events
 */
export async function generateJourneyMap(
  events: AudienceEvent[]
): Promise<{ data: JourneyMap | null; error: Error | null }> {
  try {
    const client = getAnthropicClient();

    // Summarize events for privacy
    const eventSummary = events.map((e) => ({
      type: e.type,
      source: e.source || 'unknown',
      timestamp: e.timestamp || null,
    }));

    const prompt = `You are a customer journey mapping AI. Analyze these events and build a customer journey map.

Events (chronological):
${JSON.stringify(eventSummary, null, 2)}

Journey stages to consider:
- awareness: First impressions, initial contact
- consideration: Exploring, comparing options
- decision: Ready to purchase/convert
- retention: Post-purchase engagement
- advocacy: Referring others, leaving reviews

Return a JSON object with:
- stages: Array of { name: string, events: string[] } showing which events belong to which stage
- bottlenecks: Array of identified friction points or drop-off risks
- recommendations: Array of actionable recommendations to improve the journey

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

    const parsed = JSON.parse(content.text) as JourneyMap;
    return { data: parsed, error: null };
  } catch (error) {
    console.error('[leadEngineService] generateJourneyMap error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// =============================================================================
// Database Operations
// =============================================================================

/**
 * Upsert lead model for a contact
 */
export async function upsertLeadModel(
  tenantId: string,
  contactId: string,
  payload: Partial<{
    lead_score: number;
    lead_grade: string;
    churn_risk: number;
    churn_factors: string[];
    ltv_estimate: number;
    ltv_confidence: number;
    journey: JourneyMap;
    current_stage: string;
  }>
): Promise<{ data: LeadModel | null; error: Error | null }> {
  try {
    const { data: existing } = await supabaseAdmin
      .from('synthex_lead_models')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    const fullPayload = {
      ...payload,
      last_computed_at: new Date().toISOString(),
    };

    let result;
    if (!existing) {
      result = await supabaseAdmin
        .from('synthex_lead_models')
        .insert({
          tenant_id: tenantId,
          contact_id: contactId,
          ...fullPayload,
        })
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('synthex_lead_models')
        .update(fullPayload)
        .eq('contact_id', contactId)
        .select()
        .single();
    }

    if (result.error) {
throw result.error;
}
    return { data: mapLeadModelFromDb(result.data), error: null };
  } catch (error) {
    console.error('[leadEngineService] upsertLeadModel error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * List lead models for a tenant
 */
export async function listLeadModels(
  tenantId: string,
  options?: { limit?: number; offset?: number; minScore?: number }
): Promise<{ data: LeadModel[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_lead_models')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('lead_score', { ascending: false });

    if (options?.minScore !== undefined) {
      query = query.gte('lead_score', options.minScore);
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

    return { data: (data || []).map(mapLeadModelFromDb), error: null };
  } catch (error) {
    console.error('[leadEngineService] listLeadModels error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Get lead model for a specific contact
 */
export async function getLeadModel(
  contactId: string
): Promise<{ data: LeadModel | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_lead_models')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (error && error.code !== 'PGRST116') {
throw error;
}
    return { data: data ? mapLeadModelFromDb(data) : null, error: null };
  } catch (error) {
    console.error('[leadEngineService] getLeadModel error:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapLeadModelFromDb(row: Record<string, unknown>): LeadModel {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    tenantId: row.tenant_id as string,
    leadScore: row.lead_score as number,
    leadGrade: row.lead_grade as string | null,
    churnRisk: row.churn_risk as number,
    churnFactors: (row.churn_factors as string[]) || [],
    ltvEstimate: row.ltv_estimate as number,
    ltvConfidence: row.ltv_confidence as number | null,
    journey: row.journey as JourneyMap | null,
    currentStage: row.current_stage as string | null,
    stageEnteredAt: row.stage_entered_at as string | null,
    modelVersion: row.model_version as string,
    lastComputedAt: row.last_computed_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
