/**
 * Synthex Adaptive Personalisation Service
 *
 * Phase D24: Adaptive Personalisation Engine (Real-Time)
 *
 * Real-time content and experience personalization based on
 * behavioral profiles and AI-driven recommendations.
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

export type EventType =
  | "page_view"
  | "content_view"
  | "email_open"
  | "email_click"
  | "form_submit"
  | "download"
  | "video_watch"
  | "product_view"
  | "cart_add"
  | "purchase"
  | "search"
  | "share"
  | "comment"
  | "chat_start"
  | "support_ticket"
  | "webinar_attend"
  | "custom";

export type RecommendationType =
  | "content"
  | "product"
  | "offer"
  | "channel"
  | "timing"
  | "action";

export type RuleType =
  | "content_recommendation"
  | "channel_preference"
  | "timing_optimization"
  | "offer_targeting"
  | "message_adaptation"
  | "experience_customization";

export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "archived";

export interface ProfileVector {
  engagement_score?: number;
  content_preferences?: Record<string, number>;
  channel_preferences?: Record<string, number>;
  time_preferences?: Record<string, number>;
  topic_interests?: Record<string, number>;
  buying_stage?: "awareness" | "consideration" | "decision";
  persona_match?: Record<string, number>;
  behavior_patterns?: Record<string, unknown>;
  device_preferences?: Record<string, number>;
  location_context?: Record<string, unknown>;
}

export interface PersonalisationProfile {
  id: string;
  tenant_id: string;
  contact_id: string;
  lead_id?: string;
  customer_id?: string;
  profile_vector: ProfileVector;
  avg_session_duration?: number;
  pages_per_session?: number;
  bounce_rate?: number;
  conversion_rate?: number;
  email_engagement_rate?: number;
  content_consumption_score?: number;
  preferred_content_types: string[];
  preferred_channels: string[];
  preferred_topics: string[];
  preferred_times: Record<string, number[]>;
  predicted_interests: string[];
  predicted_next_action?: string;
  predicted_lifetime_value?: number;
  churn_probability?: number;
  upsell_probability?: number;
  matched_persona_id?: string;
  persona_confidence?: number;
  experiment_groups: Record<string, string>;
  is_active: boolean;
  quality_score?: number;
  completeness_score?: number;
  last_activity_at?: string;
  last_computed_at?: string;
  created_at: string;
  updated_at: string;
  meta: Record<string, unknown>;
}

export interface PersonalisationEvent {
  id: string;
  tenant_id: string;
  contact_id: string;
  event_type: EventType;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  page_url?: string;
  referrer_url?: string;
  content_id?: string;
  content_type?: string;
  campaign_id?: string;
  source?: string;
  medium?: string;
  payload: Record<string, unknown>;
  session_id?: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  country?: string;
  city?: string;
  is_processed: boolean;
  processed_at?: string;
  profile_impact?: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface PersonalisationRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  description?: string;
  rule_type: RuleType;
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
    weight?: number;
  }>;
  condition_logic: "and" | "or";
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  priority: number;
  is_exclusive: boolean;
  exclusion_rules: string[];
  impressions: number;
  conversions: number;
  conversion_rate?: number;
  avg_lift?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalisationRecommendation {
  id: string;
  tenant_id: string;
  contact_id: string;
  recommendation_type: RecommendationType;
  recommended_id: string;
  recommended_type?: string;
  recommendation_reason?: string;
  relevance_score: number;
  confidence_score?: number;
  predicted_engagement?: number;
  context: Record<string, unknown>;
  algorithm: string;
  model_version?: string;
  features_used: string[];
  status: "active" | "served" | "clicked" | "converted" | "dismissed" | "expired";
  served_at?: string;
  clicked_at?: string;
  converted_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface PersonalisationExperiment {
  id: string;
  tenant_id: string;
  experiment_name: string;
  description?: string;
  hypothesis?: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    config: Record<string, unknown>;
  }>;
  control_variant_id?: string;
  targeting_rules: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  traffic_allocation: number;
  primary_goal: string;
  secondary_goals: string[];
  results: Record<string, {
    impressions: number;
    conversions: number;
    rate: number;
    confidence?: number;
  }>;
  winner_variant_id?: string;
  statistical_significance?: number;
  status: ExperimentStatus;
  start_date?: string;
  end_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalisationPersona {
  id: string;
  tenant_id: string;
  persona_name: string;
  description?: string;
  avatar_url?: string;
  age_range?: string;
  gender?: string;
  location_type?: string;
  income_level?: string;
  education_level?: string;
  job_role?: string;
  industry?: string;
  traits: Record<string, string>;
  preferred_content_types: string[];
  preferred_content_length?: string;
  preferred_tone?: string;
  preferred_channels: string[];
  goals: string[];
  pain_points: string[];
  objections: string[];
  matching_rules: Array<{
    field: string;
    operator: string;
    value: unknown;
    weight?: number;
  }>;
  min_match_score: number;
  matched_contacts: number;
  avg_conversion_rate?: number;
  avg_lifetime_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Input Types
// =====================================================

export interface TrackEventInput {
  contact_id: string;
  event_type: EventType;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  page_url?: string;
  referrer_url?: string;
  content_id?: string;
  content_type?: string;
  campaign_id?: string;
  source?: string;
  medium?: string;
  payload?: Record<string, unknown>;
  session_id?: string;
  device_type?: string;
  browser?: string;
  platform?: string;
  country?: string;
  city?: string;
  occurred_at?: string;
}

export interface CreateRuleInput {
  rule_name: string;
  description?: string;
  rule_type: RuleType;
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
    weight?: number;
  }>;
  condition_logic?: "and" | "or";
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  priority?: number;
  is_exclusive?: boolean;
  exclusion_rules?: string[];
  start_date?: string;
  end_date?: string;
}

export interface CreateExperimentInput {
  experiment_name: string;
  description?: string;
  hypothesis?: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
    config: Record<string, unknown>;
  }>;
  control_variant_id?: string;
  targeting_rules?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  traffic_allocation?: number;
  primary_goal: string;
  secondary_goals?: string[];
}

export interface CreatePersonaInput {
  persona_name: string;
  description?: string;
  avatar_url?: string;
  age_range?: string;
  gender?: string;
  location_type?: string;
  income_level?: string;
  education_level?: string;
  job_role?: string;
  industry?: string;
  traits?: Record<string, string>;
  preferred_content_types?: string[];
  preferred_content_length?: string;
  preferred_tone?: string;
  preferred_channels?: string[];
  goals?: string[];
  pain_points?: string[];
  objections?: string[];
  matching_rules?: Array<{
    field: string;
    operator: string;
    value: unknown;
    weight?: number;
  }>;
  min_match_score?: number;
}

// =====================================================
// Filter Types
// =====================================================

export interface EventFilters {
  contact_id?: string;
  event_type?: EventType;
  from_date?: string;
  to_date?: string;
  is_processed?: boolean;
  limit?: number;
  offset?: number;
}

export interface RecommendationFilters {
  contact_id?: string;
  recommendation_type?: RecommendationType;
  status?: PersonalisationRecommendation["status"];
  min_relevance?: number;
  limit?: number;
  offset?: number;
}

// =====================================================
// Result Types
// =====================================================

export interface PersonalisationStats {
  total_profiles: number;
  active_profiles: number;
  total_events_today: number;
  avg_engagement_score: number;
  active_experiments: number;
  active_rules: number;
  personas_count: number;
  recommendations_served: number;
  conversion_rate: number;
}

export interface PersonalisedContent {
  content_key: string;
  variant_id: string;
  content: unknown;
  rule_id?: string;
  experiment_id?: string;
}

// =====================================================
// Profile Management
// =====================================================

export async function getProfile(
  tenantId: string,
  contactId: string
): Promise<PersonalisationProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_personalisation_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contactId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get profile: ${error.message}`);
  }
  return data;
}

export async function updateProfile(
  tenantId: string,
  contactId: string,
  updates: Partial<PersonalisationProfile>
): Promise<PersonalisationProfile> {
  const supabase = await createClient();

  // Upsert profile
  const { data, error } = await supabase
    .from("synthex_library_personalisation_profiles")
    .upsert(
      {
        tenant_id: tenantId,
        contact_id: contactId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "contact_id" }
    )
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update profile: ${error.message}`);
}
  return data;
}

export async function computeProfile(
  tenantId: string,
  contactId: string
): Promise<PersonalisationProfile> {
  const supabase = await createClient();

  // Get recent events
  const { data: events } = await supabase
    .from("synthex_library_personalisation_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  // Compute profile vector from events
  const profileVector = computeProfileVector(events || []);

  // Get AI insights
  const aiInsights = await getAIProfileInsights(profileVector, events || []);

  // Match to personas
  const personaMatch = await matchToPersonas(tenantId, profileVector);

  // Update profile
  const profile = await updateProfile(tenantId, contactId, {
    profile_vector: profileVector,
    predicted_interests: aiInsights.predicted_interests,
    predicted_next_action: aiInsights.predicted_next_action,
    churn_probability: aiInsights.churn_probability,
    upsell_probability: aiInsights.upsell_probability,
    matched_persona_id: personaMatch?.persona_id,
    persona_confidence: personaMatch?.confidence,
    last_computed_at: new Date().toISOString(),
    completeness_score: calculateCompletenessScore(profileVector),
  });

  return profile;
}

function computeProfileVector(events: PersonalisationEvent[]): ProfileVector {
  const vector: ProfileVector = {
    engagement_score: 0,
    content_preferences: {},
    channel_preferences: {},
    time_preferences: {},
    topic_interests: {},
  };

  if (events.length === 0) {
return vector;
}

  // Calculate engagement score
  const recentEvents = events.filter(
    (e) => new Date(e.occurred_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  vector.engagement_score = Math.min(100, recentEvents.length * 2);

  // Content preferences
  const contentCounts: Record<string, number> = {};
  events.forEach((e) => {
    if (e.content_type) {
      contentCounts[e.content_type] = (contentCounts[e.content_type] || 0) + 1;
    }
  });
  const maxContent = Math.max(...Object.values(contentCounts), 1);
  Object.keys(contentCounts).forEach((type) => {
    vector.content_preferences![type] = contentCounts[type] / maxContent;
  });

  // Channel preferences
  const channelCounts: Record<string, number> = {};
  events.forEach((e) => {
    if (e.source) {
      channelCounts[e.source] = (channelCounts[e.source] || 0) + 1;
    }
  });
  const maxChannel = Math.max(...Object.values(channelCounts), 1);
  Object.keys(channelCounts).forEach((channel) => {
    vector.channel_preferences![channel] = channelCounts[channel] / maxChannel;
  });

  // Time preferences
  const hourCounts: Record<number, number> = {};
  events.forEach((e) => {
    const hour = new Date(e.occurred_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const maxHour = Math.max(...Object.values(hourCounts), 1);
  Object.keys(hourCounts).forEach((hour) => {
    vector.time_preferences![`hour_${hour}`] = hourCounts[parseInt(hour)] / maxHour;
  });

  // Determine buying stage based on event types
  const hasProductView = events.some((e) => e.event_type === "product_view");
  const hasCartAdd = events.some((e) => e.event_type === "cart_add");
  const hasPurchase = events.some((e) => e.event_type === "purchase");

  if (hasPurchase) {
    vector.buying_stage = "decision";
  } else if (hasCartAdd || hasProductView) {
    vector.buying_stage = "consideration";
  } else {
    vector.buying_stage = "awareness";
  }

  return vector;
}

async function getAIProfileInsights(
  profileVector: ProfileVector,
  events: PersonalisationEvent[]
): Promise<{
  predicted_interests: string[];
  predicted_next_action?: string;
  churn_probability: number;
  upsell_probability: number;
}> {
  const client = getAnthropicClient();

  if (!client || events.length < 5) {
    return {
      predicted_interests: [],
      predicted_next_action: undefined,
      churn_probability: 0.5,
      upsell_probability: 0.3,
    };
  }

  try {
    const eventSummary = events.slice(0, 20).map((e) => ({
      type: e.event_type,
      content: e.content_type,
      page: e.page_url,
      date: e.occurred_at,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Analyze this user's behavioral data and predict:
1. Their top 5 predicted interests (topics they're likely interested in)
2. Their predicted next action
3. Churn probability (0-1)
4. Upsell probability (0-1)

Profile:
${JSON.stringify(profileVector, null, 2)}

Recent Events:
${JSON.stringify(eventSummary, null, 2)}

Return JSON: { "predicted_interests": [], "predicted_next_action": "", "churn_probability": 0.0, "upsell_probability": 0.0 }`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response");
    }

    return JSON.parse(textContent.text);
  } catch (error) {
    console.error("AI profile insights failed:", error);
    return {
      predicted_interests: [],
      predicted_next_action: undefined,
      churn_probability: 0.5,
      upsell_probability: 0.3,
    };
  }
}

async function matchToPersonas(
  tenantId: string,
  profileVector: ProfileVector
): Promise<{ persona_id: string; confidence: number } | null> {
  const supabase = await createClient();

  const { data: personas } = await supabase
    .from("synthex_library_personalisation_personas")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (!personas || personas.length === 0) {
return null;
}

  let bestMatch: { persona_id: string; confidence: number } | null = null;

  for (const persona of personas) {
    let matchScore = 0;
    let totalWeight = 0;

    for (const rule of persona.matching_rules || []) {
      const weight = rule.weight || 1;
      totalWeight += weight;

      // Simple matching logic
      const profileValue = getNestedValue(profileVector, rule.field);
      if (profileValue !== undefined) {
        if (evaluateCondition(profileValue, rule.operator, rule.value)) {
          matchScore += weight;
        }
      }
    }

    const confidence = totalWeight > 0 ? matchScore / totalWeight : 0;

    if (confidence >= persona.min_match_score) {
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { persona_id: persona.id, confidence };
      }
    }
  }

  return bestMatch;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

function evaluateCondition(value: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case "equals":
      return value === expected;
    case "not_equals":
      return value !== expected;
    case "greater_than":
      return typeof value === "number" && value > (expected as number);
    case "less_than":
      return typeof value === "number" && value < (expected as number);
    case "contains":
      return typeof value === "string" && value.includes(expected as string);
    case "in":
      return Array.isArray(expected) && expected.includes(value);
    default:
      return false;
  }
}

function calculateCompletenessScore(vector: ProfileVector): number {
  let filled = 0;
  const total = 10;

  if (vector.engagement_score !== undefined) {
filled++;
}
  if (Object.keys(vector.content_preferences || {}).length > 0) {
filled++;
}
  if (Object.keys(vector.channel_preferences || {}).length > 0) {
filled++;
}
  if (Object.keys(vector.time_preferences || {}).length > 0) {
filled++;
}
  if (Object.keys(vector.topic_interests || {}).length > 0) {
filled++;
}
  if (vector.buying_stage) {
filled++;
}
  if (vector.persona_match) {
filled++;
}
  if (vector.behavior_patterns) {
filled++;
}
  if (vector.device_preferences) {
filled++;
}
  if (vector.location_context) {
filled++;
}

  return filled / total;
}

// =====================================================
// Event Tracking
// =====================================================

export async function trackEvent(
  tenantId: string,
  input: TrackEventInput
): Promise<PersonalisationEvent> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_personalisation_events")
    .insert({
      tenant_id: tenantId,
      contact_id: input.contact_id,
      event_type: input.event_type,
      event_category: input.event_category,
      event_action: input.event_action,
      event_label: input.event_label,
      event_value: input.event_value,
      page_url: input.page_url,
      referrer_url: input.referrer_url,
      content_id: input.content_id,
      content_type: input.content_type,
      campaign_id: input.campaign_id,
      source: input.source,
      medium: input.medium,
      payload: input.payload || {},
      session_id: input.session_id,
      device_type: input.device_type,
      browser: input.browser,
      platform: input.platform,
      country: input.country,
      city: input.city,
      occurred_at: input.occurred_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to track event: ${error.message}`);
}
  return data;
}

export async function listEvents(
  tenantId: string,
  filters?: EventFilters
): Promise<PersonalisationEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_personalisation_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false });

  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }
  if (filters?.from_date) {
    query = query.gte("occurred_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("occurred_at", filters.to_date);
  }
  if (filters?.is_processed !== undefined) {
    query = query.eq("is_processed", filters.is_processed);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list events: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Recommendations
// =====================================================

export async function generateRecommendations(
  tenantId: string,
  contactId: string,
  types?: RecommendationType[]
): Promise<PersonalisationRecommendation[]> {
  const supabase = await createClient();

  // Get profile
  const profile = await getProfile(tenantId, contactId);
  if (!profile) {
    await computeProfile(tenantId, contactId);
  }

  const recommendations: PersonalisationRecommendation[] = [];

  // Use AI to generate recommendations
  const client = getAnthropicClient();
  if (client && profile) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Based on this user profile, suggest 3 content recommendations:

Profile:
- Engagement Score: ${profile.profile_vector.engagement_score}
- Preferred Content: ${JSON.stringify(profile.profile_vector.content_preferences)}
- Topics: ${JSON.stringify(profile.profile_vector.topic_interests)}
- Buying Stage: ${profile.profile_vector.buying_stage}

Return JSON array: [{ "type": "content", "id": "topic-id", "reason": "why", "score": 0.9 }]`,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (textContent && textContent.type === "text") {
        const aiRecs = JSON.parse(textContent.text);
        for (const rec of aiRecs) {
          const { data, error } = await supabase
            .from("synthex_library_personalisation_recommendations")
            .insert({
              tenant_id: tenantId,
              contact_id: contactId,
              recommendation_type: rec.type || "content",
              recommended_id: rec.id,
              recommendation_reason: rec.reason,
              relevance_score: rec.score,
              confidence_score: 0.8,
              algorithm: "ai",
              model_version: "claude-sonnet-4-5-20250514",
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

          if (!error && data) {
            recommendations.push(data);
          }
        }
      }
    } catch (error) {
      console.error("AI recommendations failed:", error);
    }
  }

  return recommendations;
}

export async function listRecommendations(
  tenantId: string,
  filters?: RecommendationFilters
): Promise<PersonalisationRecommendation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_personalisation_recommendations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("relevance_score", { ascending: false });

  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.recommendation_type) {
    query = query.eq("recommendation_type", filters.recommendation_type);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.min_relevance) {
    query = query.gte("relevance_score", filters.min_relevance);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list recommendations: ${error.message}`);
}
  return data || [];
}

export async function updateRecommendationStatus(
  recommendationId: string,
  status: PersonalisationRecommendation["status"]
): Promise<PersonalisationRecommendation> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };
  if (status === "served") {
updateData.served_at = new Date().toISOString();
}
  if (status === "clicked") {
updateData.clicked_at = new Date().toISOString();
}
  if (status === "converted") {
updateData.converted_at = new Date().toISOString();
}

  const { data, error } = await supabase
    .from("synthex_library_personalisation_recommendations")
    .update(updateData)
    .eq("id", recommendationId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update recommendation: ${error.message}`);
}
  return data;
}

// =====================================================
// Rules
// =====================================================

export async function createRule(
  tenantId: string,
  input: CreateRuleInput
): Promise<PersonalisationRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_personalisation_rules")
    .insert({
      tenant_id: tenantId,
      rule_name: input.rule_name,
      description: input.description,
      rule_type: input.rule_type,
      conditions: input.conditions,
      condition_logic: input.condition_logic || "and",
      actions: input.actions,
      priority: input.priority || 100,
      is_exclusive: input.is_exclusive ?? false,
      exclusion_rules: input.exclusion_rules || [],
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create rule: ${error.message}`);
}
  return data;
}

export async function listRules(
  tenantId: string,
  ruleType?: RuleType
): Promise<PersonalisationRule[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_personalisation_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: true });

  if (ruleType) {
    query = query.eq("rule_type", ruleType);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list rules: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Experiments
// =====================================================

export async function createExperiment(
  tenantId: string,
  input: CreateExperimentInput
): Promise<PersonalisationExperiment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_personalisation_experiments")
    .insert({
      tenant_id: tenantId,
      experiment_name: input.experiment_name,
      description: input.description,
      hypothesis: input.hypothesis,
      variants: input.variants,
      control_variant_id: input.control_variant_id,
      targeting_rules: input.targeting_rules || [],
      traffic_allocation: input.traffic_allocation || 1.0,
      primary_goal: input.primary_goal,
      secondary_goals: input.secondary_goals || [],
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create experiment: ${error.message}`);
}
  return data;
}

export async function listExperiments(
  tenantId: string,
  status?: ExperimentStatus
): Promise<PersonalisationExperiment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_personalisation_experiments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list experiments: ${error.message}`);
}
  return data || [];
}

export async function updateExperimentStatus(
  experimentId: string,
  status: ExperimentStatus
): Promise<PersonalisationExperiment> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "running") {
    updateData.start_date = new Date().toISOString();
  }
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("synthex_library_personalisation_experiments")
    .update(updateData)
    .eq("id", experimentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update experiment: ${error.message}`);
}
  return data;
}

// =====================================================
// Personas
// =====================================================

export async function createPersona(
  tenantId: string,
  input: CreatePersonaInput
): Promise<PersonalisationPersona> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_personalisation_personas")
    .insert({
      tenant_id: tenantId,
      persona_name: input.persona_name,
      description: input.description,
      avatar_url: input.avatar_url,
      age_range: input.age_range,
      gender: input.gender,
      location_type: input.location_type,
      income_level: input.income_level,
      education_level: input.education_level,
      job_role: input.job_role,
      industry: input.industry,
      traits: input.traits || {},
      preferred_content_types: input.preferred_content_types || [],
      preferred_content_length: input.preferred_content_length,
      preferred_tone: input.preferred_tone,
      preferred_channels: input.preferred_channels || [],
      goals: input.goals || [],
      pain_points: input.pain_points || [],
      objections: input.objections || [],
      matching_rules: input.matching_rules || [],
      min_match_score: input.min_match_score || 0.6,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create persona: ${error.message}`);
}
  return data;
}

export async function listPersonas(
  tenantId: string
): Promise<PersonalisationPersona[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_personalisation_personas")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("persona_name", { ascending: true });

  if (error) {
throw new Error(`Failed to list personas: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Statistics
// =====================================================

export async function getPersonalisationStats(
  tenantId: string
): Promise<PersonalisationStats> {
  const supabase = await createClient();

  // Get profile counts
  const { count: totalProfiles } = await supabase
    .from("synthex_library_personalisation_profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { count: activeProfiles } = await supabase
    .from("synthex_library_personalisation_profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // Get today's events
  const today = new Date().toISOString().split("T")[0];
  const { count: todayEvents } = await supabase
    .from("synthex_library_personalisation_events")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("occurred_at", today);

  // Get active experiments
  const { count: activeExperiments } = await supabase
    .from("synthex_library_personalisation_experiments")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "running");

  // Get active rules
  const { count: activeRules } = await supabase
    .from("synthex_library_personalisation_rules")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // Get personas count
  const { count: personasCount } = await supabase
    .from("synthex_library_personalisation_personas")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // Get recommendations served
  const { count: recommendationsServed } = await supabase
    .from("synthex_library_personalisation_recommendations")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "served");

  // Get avg engagement score
  const { data: profiles } = await supabase
    .from("synthex_library_personalisation_profiles")
    .select("profile_vector")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  let avgEngagement = 0;
  if (profiles && profiles.length > 0) {
    const scores = profiles
      .map((p) => (p.profile_vector as ProfileVector)?.engagement_score || 0)
      .filter((s) => s > 0);
    avgEngagement = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  return {
    total_profiles: totalProfiles || 0,
    active_profiles: activeProfiles || 0,
    total_events_today: todayEvents || 0,
    avg_engagement_score: avgEngagement,
    active_experiments: activeExperiments || 0,
    active_rules: activeRules || 0,
    personas_count: personasCount || 0,
    recommendations_served: recommendationsServed || 0,
    conversion_rate: 0, // Would be calculated from actual conversion data
  };
}
