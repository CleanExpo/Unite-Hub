/**
 * Synthex Contact Intent & Sentiment Service
 *
 * Phase D23: Contact Intent + Sentiment AI Engine
 *
 * AI-powered analysis of contact communications to extract
 * intent signals and sentiment for personalized engagement.
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// =====================================================
// Lazy Anthropic Client with Circuit Breaker
// =====================================================
let anthropicClient: Anthropic | null = null;
let clientInitTime = 0;
const CLIENT_TTL_MS = 60000;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient && Date.now() - clientInitTime < CLIENT_TTL_MS) {
    return anthropicClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
return null;
}
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  clientInitTime = Date.now();
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export type IntentCategory =
  | "transactional"
  | "informational"
  | "navigational"
  | "support"
  | "feedback"
  | "engagement"
  | "other";

export type IntentStrength = "weak" | "moderate" | "strong" | "very_strong";

export type Sentiment = "very_negative" | "negative" | "neutral" | "positive" | "very_positive";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type IntentSource =
  | "email"
  | "chat"
  | "call_transcript"
  | "form_submission"
  | "social_media"
  | "support_ticket"
  | "meeting_notes"
  | "other";

export type SignalType =
  | "buying_signal"
  | "churn_risk"
  | "upsell_opportunity"
  | "support_escalation"
  | "engagement_drop"
  | "advocacy_potential"
  | "referral_intent"
  | "expansion_interest"
  | "renewal_concern";

export interface SentimentAspect {
  aspect: string;
  sentiment: Sentiment;
  score: number;
}

export interface Entity {
  type: string;
  value: string;
  context?: string;
}

export interface SuggestedAction {
  action: string;
  priority: "low" | "medium" | "high";
  reason: string;
}

export interface ContactIntent {
  id: string;
  tenant_id: string;
  contact_id: string;
  lead_id?: string;
  customer_id?: string;
  intent: string;
  intent_category: IntentCategory;
  sub_intent?: string;
  intent_strength: IntentStrength;
  sentiment?: Sentiment;
  sentiment_score?: number;
  sentiment_aspects: SentimentAspect[];
  confidence: number;
  ai_model?: string;
  analysis_version: number;
  source: IntentSource;
  source_id?: string;
  source_channel?: string;
  raw_text?: string;
  processed_text?: string;
  key_phrases: string[];
  entities: Entity[];
  conversation_id?: string;
  interaction_sequence: number;
  previous_intent_id?: string;
  urgency_level: UrgencyLevel;
  requires_response: boolean;
  response_deadline?: string;
  suggested_actions: SuggestedAction[];
  action_taken?: string;
  action_taken_at?: string;
  action_taken_by?: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  meta: Record<string, unknown>;
  tags: string[];
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface IntentPattern {
  id: string;
  tenant_id: string;
  pattern_name: string;
  description?: string;
  intent: string;
  intent_category: IntentCategory;
  keywords: string[];
  phrases: string[];
  regex_patterns: string[];
  semantic_embeddings?: unknown;
  keyword_weight: number;
  phrase_weight: number;
  semantic_weight: number;
  match_count: number;
  accuracy_score?: number;
  last_matched_at?: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface SentimentHistory {
  id: string;
  tenant_id: string;
  contact_id: string;
  period_start: string;
  period_end: string;
  period_type: "day" | "week" | "month" | "quarter";
  avg_sentiment_score?: number;
  min_sentiment_score?: number;
  max_sentiment_score?: number;
  sentiment_variance?: number;
  very_negative_count: number;
  negative_count: number;
  neutral_count: number;
  positive_count: number;
  very_positive_count: number;
  total_interactions: number;
  sentiment_trend?: "improving" | "stable" | "declining";
  trend_strength?: number;
  top_intents: Array<{ intent: string; count: number; avg_sentiment: number }>;
  calculated_at: string;
  created_at: string;
}

export interface IntentSignal {
  id: string;
  tenant_id: string;
  contact_id: string;
  signal_type: SignalType;
  signal_strength: number;
  signal_source: string;
  contributing_intents: string[];
  evidence: Array<{ type: string; description: string; weight: number }>;
  score_impact?: number;
  confidence: number;
  is_active: boolean;
  expires_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  detected_at: string;
  created_at: string;
}

export interface IntentResponse {
  id: string;
  tenant_id: string;
  intent: string;
  intent_category?: IntentCategory;
  sentiment_range_min?: number;
  sentiment_range_max?: number;
  urgency_levels: UrgencyLevel[];
  response_name: string;
  response_type: "email_template" | "chat_script" | "task_creation" | "notification" | "workflow_trigger" | "escalation";
  response_content: Record<string, unknown>;
  personalization_tokens: string[];
  auto_trigger: boolean;
  approval_required: boolean;
  delay_minutes: number;
  use_count: number;
  success_rate?: number;
  avg_response_time_minutes?: number;
  is_active: boolean;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Input Types
// =====================================================

export interface AnalyzeIntentInput {
  contact_id: string;
  lead_id?: string;
  customer_id?: string;
  text: string;
  source: IntentSource;
  source_id?: string;
  source_channel?: string;
  conversation_id?: string;
  interaction_sequence?: number;
  previous_intent_id?: string;
  meta?: Record<string, unknown>;
  tags?: string[];
}

export interface CreatePatternInput {
  pattern_name: string;
  description?: string;
  intent: string;
  intent_category: IntentCategory;
  keywords?: string[];
  phrases?: string[];
  regex_patterns?: string[];
  keyword_weight?: number;
  phrase_weight?: number;
  semantic_weight?: number;
}

export interface CreateResponseInput {
  intent: string;
  intent_category?: IntentCategory;
  sentiment_range_min?: number;
  sentiment_range_max?: number;
  urgency_levels?: UrgencyLevel[];
  response_name: string;
  response_type: IntentResponse["response_type"];
  response_content: Record<string, unknown>;
  personalization_tokens?: string[];
  auto_trigger?: boolean;
  approval_required?: boolean;
  delay_minutes?: number;
  priority_order?: number;
}

// =====================================================
// Filter Types
// =====================================================

export interface IntentFilters {
  contact_id?: string;
  intent?: string;
  intent_category?: IntentCategory;
  sentiment?: Sentiment;
  source?: IntentSource;
  urgency_level?: UrgencyLevel;
  is_resolved?: boolean;
  requires_response?: boolean;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface SignalFilters {
  contact_id?: string;
  signal_type?: SignalType;
  is_active?: boolean;
  min_strength?: number;
  limit?: number;
  offset?: number;
}

// =====================================================
// Result Types
// =====================================================

export interface IntentAnalysisResult {
  intent: ContactIntent;
  signals: IntentSignal[];
  suggested_responses: IntentResponse[];
}

export interface ContactSentimentSummary {
  total_intents: number;
  avg_sentiment: number;
  dominant_sentiment: Sentiment;
  top_intent: string;
  recent_trend: "improving" | "stable" | "declining";
}

export interface IntentStats {
  total_intents: number;
  unresolved_intents: number;
  avg_sentiment_score: number;
  intent_distribution: Record<string, number>;
  sentiment_distribution: Record<Sentiment, number>;
  active_signals: number;
  patterns_count: number;
  responses_count: number;
}

// =====================================================
// Intent Analysis
// =====================================================

export async function analyzeIntent(
  tenantId: string,
  input: AnalyzeIntentInput
): Promise<IntentAnalysisResult> {
  const supabase = await createClient();

  // Get AI analysis
  const analysis = await performAIAnalysis(input.text);

  // Match against patterns
  const patternMatch = await matchPatterns(tenantId, input.text, analysis.intent);

  // Create intent record
  const { data: intent, error } = await supabase
    .from("synthex_library_contact_intents")
    .insert({
      tenant_id: tenantId,
      contact_id: input.contact_id,
      lead_id: input.lead_id,
      customer_id: input.customer_id,
      intent: analysis.intent,
      intent_category: analysis.intent_category,
      sub_intent: analysis.sub_intent,
      intent_strength: analysis.intent_strength,
      sentiment: analysis.sentiment,
      sentiment_score: analysis.sentiment_score,
      sentiment_aspects: analysis.sentiment_aspects,
      confidence: patternMatch ? Math.max(analysis.confidence, patternMatch.confidence) : analysis.confidence,
      ai_model: "claude-sonnet-4-5-20250514",
      source: input.source,
      source_id: input.source_id,
      source_channel: input.source_channel,
      raw_text: input.text,
      processed_text: analysis.processed_text,
      key_phrases: analysis.key_phrases,
      entities: analysis.entities,
      conversation_id: input.conversation_id,
      interaction_sequence: input.interaction_sequence || 1,
      previous_intent_id: input.previous_intent_id,
      urgency_level: analysis.urgency_level,
      requires_response: analysis.requires_response,
      response_deadline: analysis.response_deadline,
      suggested_actions: analysis.suggested_actions,
      meta: input.meta || {},
      tags: input.tags || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create intent: ${error.message}`);
}

  // Generate signals based on intent
  const signals = await generateSignals(tenantId, intent);

  // Get suggested responses
  const suggested_responses = await getSuggestedResponses(tenantId, intent);

  return { intent, signals, suggested_responses };
}

async function performAIAnalysis(text: string): Promise<{
  intent: string;
  intent_category: IntentCategory;
  sub_intent?: string;
  intent_strength: IntentStrength;
  sentiment: Sentiment;
  sentiment_score: number;
  sentiment_aspects: SentimentAspect[];
  confidence: number;
  processed_text: string;
  key_phrases: string[];
  entities: Entity[];
  urgency_level: UrgencyLevel;
  requires_response: boolean;
  response_deadline?: string;
  suggested_actions: SuggestedAction[];
}> {
  const client = getAnthropicClient();

  if (!client) {
    // Fallback to rule-based analysis
    return performRuleBasedAnalysis(text);
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze the following customer communication and extract intent, sentiment, and key information. Return a JSON object with these fields:

{
  "intent": "primary intent (e.g., purchase, support, inquiry, complaint, cancellation, feedback)",
  "intent_category": "one of: transactional, informational, navigational, support, feedback, engagement, other",
  "sub_intent": "optional more specific intent",
  "intent_strength": "one of: weak, moderate, strong, very_strong",
  "sentiment": "one of: very_negative, negative, neutral, positive, very_positive",
  "sentiment_score": "number from -1.0 to 1.0",
  "sentiment_aspects": [{"aspect": "string", "sentiment": "string", "score": number}],
  "confidence": "number from 0.0 to 1.0",
  "key_phrases": ["important phrases"],
  "entities": [{"type": "product/person/company/date/etc", "value": "extracted value", "context": "optional context"}],
  "urgency_level": "one of: low, medium, high, critical",
  "requires_response": true/false,
  "suggested_actions": [{"action": "what to do", "priority": "low/medium/high", "reason": "why"}]
}

Customer message:
${text}

Return ONLY the JSON object, no other text.`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return performRuleBasedAnalysis(text);
    }

    try {
      const result = JSON.parse(textContent.text);
      return {
        ...result,
        processed_text: text.trim().toLowerCase(),
      };
    } catch {
      return performRuleBasedAnalysis(text);
    }
  } catch (error) {
    console.error("AI analysis failed:", error);
    return performRuleBasedAnalysis(text);
  }
}

function performRuleBasedAnalysis(text: string): {
  intent: string;
  intent_category: IntentCategory;
  sub_intent?: string;
  intent_strength: IntentStrength;
  sentiment: Sentiment;
  sentiment_score: number;
  sentiment_aspects: SentimentAspect[];
  confidence: number;
  processed_text: string;
  key_phrases: string[];
  entities: Entity[];
  urgency_level: UrgencyLevel;
  requires_response: boolean;
  response_deadline?: string;
  suggested_actions: SuggestedAction[];
} {
  const lowerText = text.toLowerCase();

  // Simple keyword-based intent detection
  let intent = "general";
  let intent_category: IntentCategory = "other";

  if (/buy|purchase|order|price|cost|quote/.test(lowerText)) {
    intent = "purchase";
    intent_category = "transactional";
  } else if (/help|support|issue|problem|error|broken/.test(lowerText)) {
    intent = "support";
    intent_category = "support";
  } else if (/cancel|unsubscribe|stop|refund/.test(lowerText)) {
    intent = "cancellation";
    intent_category = "transactional";
  } else if (/how|what|when|where|why|explain/.test(lowerText)) {
    intent = "inquiry";
    intent_category = "informational";
  } else if (/disappointed|frustrated|unhappy|terrible|worst/.test(lowerText)) {
    intent = "complaint";
    intent_category = "feedback";
  }

  // Simple sentiment detection
  let sentiment: Sentiment = "neutral";
  let sentiment_score = 0;

  const positiveWords = /great|excellent|amazing|love|thank|appreciate|happy|satisfied/i;
  const negativeWords = /terrible|awful|hate|disappointed|frustrated|angry|worst|horrible/i;

  const positiveMatch = lowerText.match(positiveWords);
  const negativeMatch = lowerText.match(negativeWords);

  if (positiveMatch && !negativeMatch) {
    sentiment = "positive";
    sentiment_score = 0.6;
  } else if (negativeMatch && !positiveMatch) {
    sentiment = "negative";
    sentiment_score = -0.6;
  } else if (positiveMatch && negativeMatch) {
    sentiment = "neutral";
    sentiment_score = 0;
  }

  // Extract key phrases (simple approach)
  const words = text.split(/\s+/).filter((w) => w.length > 4);
  const key_phrases = words.slice(0, 5);

  return {
    intent,
    intent_category,
    intent_strength: "moderate",
    sentiment,
    sentiment_score,
    sentiment_aspects: [],
    confidence: 0.5,
    processed_text: text.trim().toLowerCase(),
    key_phrases,
    entities: [],
    urgency_level: intent_category === "support" ? "medium" : "low",
    requires_response: ["support", "complaint", "cancellation"].includes(intent),
    suggested_actions: [],
  };
}

async function matchPatterns(
  tenantId: string,
  text: string,
  detectedIntent: string
): Promise<{ confidence: number; patternId: string } | null> {
  const supabase = await createClient();

  const { data: patterns } = await supabase
    .from("synthex_library_intent_patterns")
    .select("*")
    .eq("is_active", true)
    .or(`tenant_id.eq.${tenantId},is_system.eq.true`);

  if (!patterns || patterns.length === 0) {
return null;
}

  const lowerText = text.toLowerCase();
  let bestMatch: { confidence: number; patternId: string } | null = null;

  for (const pattern of patterns) {
    let score = 0;

    // Check keywords
    const keywordMatches = pattern.keywords.filter((k: string) =>
      lowerText.includes(k.toLowerCase())
    ).length;
    score += (keywordMatches / Math.max(pattern.keywords.length, 1)) * pattern.keyword_weight;

    // Check phrases
    const phraseMatches = pattern.phrases.filter((p: string) =>
      lowerText.includes(p.toLowerCase())
    ).length;
    score += (phraseMatches / Math.max(pattern.phrases.length, 1)) * pattern.phrase_weight;

    if (score > 0 && (!bestMatch || score > bestMatch.confidence)) {
      bestMatch = { confidence: Math.min(score, 1), patternId: pattern.id };

      // Update pattern match count
      await supabase
        .from("synthex_library_intent_patterns")
        .update({
          match_count: pattern.match_count + 1,
          last_matched_at: new Date().toISOString(),
        })
        .eq("id", pattern.id);
    }
  }

  return bestMatch;
}

async function generateSignals(
  tenantId: string,
  intent: ContactIntent
): Promise<IntentSignal[]> {
  const supabase = await createClient();
  const signals: IntentSignal[] = [];

  // Define signal generation rules
  const signalRules: Array<{
    condition: boolean;
    type: SignalType;
    strength: number;
    evidence: string;
  }> = [
    {
      condition: intent.intent === "purchase" && intent.intent_strength === "strong",
      type: "buying_signal",
      strength: 0.8,
      evidence: "Strong purchase intent detected",
    },
    {
      condition: intent.intent === "cancellation",
      type: "churn_risk",
      strength: 0.9,
      evidence: "Cancellation intent expressed",
    },
    {
      condition: intent.sentiment === "very_negative" || (intent.sentiment_score ?? 0) < -0.5,
      type: "support_escalation",
      strength: 0.7,
      evidence: "Highly negative sentiment detected",
    },
    {
      condition: intent.intent === "complaint" && intent.urgency_level === "high",
      type: "support_escalation",
      strength: 0.85,
      evidence: "Urgent complaint requiring attention",
    },
    {
      condition: intent.sentiment === "very_positive" && (intent.sentiment_score ?? 0) > 0.7,
      type: "advocacy_potential",
      strength: 0.75,
      evidence: "Very positive sentiment indicates potential advocate",
    },
  ];

  for (const rule of signalRules) {
    if (rule.condition) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Signals expire in 7 days

      const { data: signal, error } = await supabase
        .from("synthex_library_intent_signals")
        .insert({
          tenant_id: tenantId,
          contact_id: intent.contact_id,
          signal_type: rule.type,
          signal_strength: rule.strength,
          signal_source: "intent_analysis",
          contributing_intents: [intent.id],
          evidence: [{ type: "intent", description: rule.evidence, weight: 1.0 }],
          confidence: intent.confidence,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (!error && signal) {
        signals.push(signal);
      }
    }
  }

  return signals;
}

async function getSuggestedResponses(
  tenantId: string,
  intent: ContactIntent
): Promise<IntentResponse[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_intent_responses")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("intent", intent.intent)
    .eq("is_active", true)
    .order("priority_order", { ascending: true });

  if (intent.intent_category) {
    query = query.or(`intent_category.is.null,intent_category.eq.${intent.intent_category}`);
  }

  const { data, error } = await query.limit(5);
  if (error) {
return [];
}

  return data || [];
}

// =====================================================
// Intent CRUD
// =====================================================

export async function listIntents(
  tenantId: string,
  filters?: IntentFilters
): Promise<ContactIntent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_contact_intents")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("analyzed_at", { ascending: false });

  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.intent) {
    query = query.eq("intent", filters.intent);
  }
  if (filters?.intent_category) {
    query = query.eq("intent_category", filters.intent_category);
  }
  if (filters?.sentiment) {
    query = query.eq("sentiment", filters.sentiment);
  }
  if (filters?.source) {
    query = query.eq("source", filters.source);
  }
  if (filters?.urgency_level) {
    query = query.eq("urgency_level", filters.urgency_level);
  }
  if (filters?.is_resolved !== undefined) {
    query = query.eq("is_resolved", filters.is_resolved);
  }
  if (filters?.requires_response !== undefined) {
    query = query.eq("requires_response", filters.requires_response);
  }
  if (filters?.from_date) {
    query = query.gte("analyzed_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("analyzed_at", filters.to_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list intents: ${error.message}`);
}
  return data || [];
}

export async function getIntent(
  tenantId: string,
  intentId: string
): Promise<ContactIntent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_contact_intents")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", intentId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get intent: ${error.message}`);
  }
  return data;
}

export async function resolveIntent(
  intentId: string,
  resolution_notes?: string,
  action_taken?: string,
  action_taken_by?: string
): Promise<ContactIntent> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_contact_intents")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolution_notes,
      action_taken,
      action_taken_at: action_taken ? new Date().toISOString() : null,
      action_taken_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to resolve intent: ${error.message}`);
}
  return data;
}

// =====================================================
// Signals
// =====================================================

export async function listSignals(
  tenantId: string,
  filters?: SignalFilters
): Promise<IntentSignal[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_intent_signals")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("detected_at", { ascending: false });

  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.signal_type) {
    query = query.eq("signal_type", filters.signal_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.min_strength) {
    query = query.gte("signal_strength", filters.min_strength);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list signals: ${error.message}`);
}
  return data || [];
}

export async function acknowledgeSignal(
  signalId: string,
  userId: string
): Promise<IntentSignal> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_intent_signals")
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq("id", signalId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to acknowledge signal: ${error.message}`);
}
  return data;
}

export async function dismissSignal(signalId: string): Promise<IntentSignal> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_intent_signals")
    .update({
      is_active: false,
    })
    .eq("id", signalId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to dismiss signal: ${error.message}`);
}
  return data;
}

// =====================================================
// Patterns
// =====================================================

export async function listPatterns(
  tenantId: string,
  includeSystem: boolean = true
): Promise<IntentPattern[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_intent_patterns")
    .select("*")
    .order("intent", { ascending: true });

  if (includeSystem) {
    query = query.or(`tenant_id.eq.${tenantId},is_system.eq.true`);
  } else {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list patterns: ${error.message}`);
}
  return data || [];
}

export async function createPattern(
  tenantId: string,
  input: CreatePatternInput
): Promise<IntentPattern> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_intent_patterns")
    .insert({
      tenant_id: tenantId,
      pattern_name: input.pattern_name,
      description: input.description,
      intent: input.intent,
      intent_category: input.intent_category,
      keywords: input.keywords || [],
      phrases: input.phrases || [],
      regex_patterns: input.regex_patterns || [],
      keyword_weight: input.keyword_weight || 0.3,
      phrase_weight: input.phrase_weight || 0.4,
      semantic_weight: input.semantic_weight || 0.3,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create pattern: ${error.message}`);
}
  return data;
}

// =====================================================
// Responses
// =====================================================

export async function listResponses(
  tenantId: string,
  intent?: string
): Promise<IntentResponse[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_intent_responses")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority_order", { ascending: true });

  if (intent) {
    query = query.eq("intent", intent);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list responses: ${error.message}`);
}
  return data || [];
}

export async function createResponse(
  tenantId: string,
  input: CreateResponseInput
): Promise<IntentResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_intent_responses")
    .insert({
      tenant_id: tenantId,
      intent: input.intent,
      intent_category: input.intent_category,
      sentiment_range_min: input.sentiment_range_min,
      sentiment_range_max: input.sentiment_range_max,
      urgency_levels: input.urgency_levels || [],
      response_name: input.response_name,
      response_type: input.response_type,
      response_content: input.response_content,
      personalization_tokens: input.personalization_tokens || [],
      auto_trigger: input.auto_trigger ?? false,
      approval_required: input.approval_required ?? true,
      delay_minutes: input.delay_minutes || 0,
      priority_order: input.priority_order || 100,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create response: ${error.message}`);
}
  return data;
}

// =====================================================
// Sentiment History
// =====================================================

export async function getContactSentimentHistory(
  tenantId: string,
  contactId: string,
  periodType?: "day" | "week" | "month" | "quarter"
): Promise<SentimentHistory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_sentiment_history")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contactId)
    .order("period_start", { ascending: false });

  if (periodType) {
    query = query.eq("period_type", periodType);
  }

  const { data, error } = await query.limit(12);
  if (error) {
throw new Error(`Failed to get sentiment history: ${error.message}`);
}
  return data || [];
}

export async function getContactSentimentSummary(
  tenantId: string,
  contactId: string
): Promise<ContactSentimentSummary | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_contact_sentiment_summary", {
    p_tenant_id: tenantId,
    p_contact_id: contactId,
  });

  if (error) {
    console.error("Failed to get sentiment summary:", error);
    return null;
  }

  return data?.[0] || null;
}

// =====================================================
// Statistics
// =====================================================

export async function getIntentStats(tenantId: string): Promise<IntentStats> {
  const supabase = await createClient();

  // Get intent counts
  const { data: intents } = await supabase
    .from("synthex_library_contact_intents")
    .select("intent, sentiment, sentiment_score, is_resolved")
    .eq("tenant_id", tenantId);

  // Get active signals count
  const { count: activeSignals } = await supabase
    .from("synthex_library_intent_signals")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // Get patterns count
  const { count: patternsCount } = await supabase
    .from("synthex_library_intent_patterns")
    .select("*", { count: "exact", head: true })
    .or(`tenant_id.eq.${tenantId},is_system.eq.true`)
    .eq("is_active", true);

  // Get responses count
  const { count: responsesCount } = await supabase
    .from("synthex_library_intent_responses")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const intentDist: Record<string, number> = {};
  const sentimentDist: Record<Sentiment, number> = {
    very_negative: 0,
    negative: 0,
    neutral: 0,
    positive: 0,
    very_positive: 0,
  };
  let totalSentiment = 0;
  let sentimentCount = 0;
  let unresolvedCount = 0;

  for (const intent of intents || []) {
    intentDist[intent.intent] = (intentDist[intent.intent] || 0) + 1;

    if (intent.sentiment) {
      sentimentDist[intent.sentiment as Sentiment]++;
    }

    if (intent.sentiment_score !== null) {
      totalSentiment += intent.sentiment_score;
      sentimentCount++;
    }

    if (!intent.is_resolved) {
      unresolvedCount++;
    }
  }

  return {
    total_intents: intents?.length || 0,
    unresolved_intents: unresolvedCount,
    avg_sentiment_score: sentimentCount > 0 ? totalSentiment / sentimentCount : 0,
    intent_distribution: intentDist,
    sentiment_distribution: sentimentDist,
    active_signals: activeSignals || 0,
    patterns_count: patternsCount || 0,
    responses_count: responsesCount || 0,
  };
}
