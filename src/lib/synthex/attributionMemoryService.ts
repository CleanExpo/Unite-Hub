/**
 * Synthex Attribution Memory Engine v2 Service
 *
 * Phase D29: Contact-level attribution memory with event vectors,
 * channel bias tracking, and journey reconstruction.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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
  | "impression"
  | "click"
  | "page_view"
  | "form_submit"
  | "email_open"
  | "email_click"
  | "call"
  | "chat"
  | "demo_request"
  | "purchase"
  | "signup";

export type EventCategory =
  | "awareness"
  | "consideration"
  | "conversion"
  | "retention";

export type ChannelType =
  | "organic_search"
  | "paid_search"
  | "social_organic"
  | "social_paid"
  | "email"
  | "direct"
  | "referral"
  | "display"
  | "video"
  | "affiliate";

export type AttributionModel =
  | "first_touch"
  | "last_touch"
  | "linear"
  | "time_decay"
  | "position_based"
  | "data_driven"
  | "markov_chain"
  | "shapley";

export type JourneyType =
  | "acquisition"
  | "activation"
  | "retention"
  | "expansion"
  | "reactivation";

export type JourneyStatus =
  | "in_progress"
  | "converted"
  | "abandoned"
  | "churned";

export type PersonaType =
  | "quick_decider"
  | "researcher"
  | "price_sensitive"
  | "brand_loyal"
  | "multi_channel";

export type InsightType =
  | "channel_efficiency"
  | "journey_optimization"
  | "budget_reallocation"
  | "timing_optimization"
  | "persona_insight"
  | "anomaly_detection";

export type InsightStatus =
  | "active"
  | "acted_upon"
  | "dismissed"
  | "expired";

// =====================================================
// Interfaces
// =====================================================

export interface AttributionContact {
  id: string;
  tenant_id: string;
  contact_id: string;
  attribution_profile: Record<string, unknown>;
  channel_weights: Record<string, number>;
  first_touch_channel: string | null;
  first_touch_campaign: string | null;
  first_touch_at: string | null;
  last_touch_channel: string | null;
  last_touch_campaign: string | null;
  last_touch_at: string | null;
  total_touchpoints: number;
  total_conversions: number;
  total_revenue: number;
  avg_time_to_convert: string | null;
  avg_touchpoints_to_convert: number | null;
  predicted_next_channel: string | null;
  predicted_conversion_probability: number;
  predicted_lifetime_value: number | null;
  ai_persona_type: PersonaType | null;
  channel_bias_score: number;
  bias_explanation: Record<string, unknown>;
  is_active: boolean;
  last_event_at: string | null;
  last_analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface AttributionEvent {
  id: string;
  tenant_id: string;
  attribution_contact_id: string;
  event_type: EventType;
  event_category: EventCategory | null;
  channel: ChannelType;
  sub_channel: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  ad_group: string | null;
  creative_id: string | null;
  source: string | null;
  medium: string | null;
  content: string | null;
  term: string | null;
  landing_page: string | null;
  referrer: string | null;
  event_vector: number[];
  attributed_value: number;
  attribution_model: AttributionModel;
  attribution_weight: number;
  is_conversion_event: boolean;
  conversion_id: string | null;
  conversion_value: number | null;
  session_id: string | null;
  session_sequence: number | null;
  journey_sequence: number | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  geo_country: string | null;
  geo_region: string | null;
  geo_city: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface AttributionJourney {
  id: string;
  tenant_id: string;
  attribution_contact_id: string;
  journey_type: JourneyType;
  journey_status: JourneyStatus;
  started_at: string;
  converted_at: string | null;
  ended_at: string | null;
  duration: string | null;
  total_touchpoints: number;
  touchpoint_sequence: string[];
  channel_sequence: string[];
  unique_channels: number;
  conversion_id: string | null;
  conversion_type: string | null;
  conversion_value: number;
  attribution_breakdown: Record<string, unknown>;
  ai_journey_score: number;
  ai_friction_points: FrictionPoint[];
  ai_optimization_suggestions: OptimizationSuggestion[];
  similarity_to_ideal_journey: number;
  deviation_analysis: Record<string, unknown>;
  model_version: string;
  analyzed_at: string;
  created_at: string;
}

export interface FrictionPoint {
  position: number;
  issue: string;
  severity: number;
}

export interface OptimizationSuggestion {
  suggestion: string;
  expected_lift: number;
  details?: string;
}

export interface AttributionModelConfig {
  id: string;
  tenant_id: string;
  model_name: string;
  model_type: AttributionModel;
  model_description: string | null;
  config: Record<string, unknown>;
  model_accuracy: number | null;
  model_r_squared: number | null;
  last_trained_at: string | null;
  training_sample_size: number | null;
  validation_metrics: Record<string, number>;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelPerformance {
  id: string;
  tenant_id: string;
  channel: ChannelType;
  sub_channel: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  total_impressions: number;
  total_clicks: number;
  total_sessions: number;
  unique_visitors: number;
  click_through_rate: number;
  avg_session_duration: number | null;
  bounce_rate: number | null;
  pages_per_session: number | null;
  total_conversions: number;
  conversion_rate: number;
  conversion_value: number;
  avg_conversion_value: number | null;
  first_touch_conversions: number;
  first_touch_value: number;
  last_touch_conversions: number;
  last_touch_value: number;
  linear_conversions: number;
  linear_value: number;
  data_driven_conversions: number;
  data_driven_value: number;
  total_spend: number;
  cost_per_click: number | null;
  cost_per_conversion: number | null;
  return_on_ad_spend: number | null;
  avg_journey_position: number | null;
  assist_rate: number;
  ai_channel_score: number | null;
  ai_recommendations: unknown[];
  created_at: string;
}

export interface AttributionInsight {
  id: string;
  tenant_id: string;
  insight_type: InsightType;
  insight_category: string | null;
  target_channel: string | null;
  target_segment: string | null;
  target_journey_type: string | null;
  score: number;
  confidence: number;
  impact_score: number;
  urgency_score: number;
  headline: string;
  description: string | null;
  supporting_data: Record<string, unknown>;
  recommendations: Recommendation[];
  status: InsightStatus;
  acted_upon_at: string | null;
  outcome: Record<string, unknown>;
  valid_from: string;
  valid_until: string | null;
  model_version: string;
  created_at: string;
}

export interface Recommendation {
  action: string;
  channel?: string;
  expected_lift?: number;
  details?: string;
}

export interface AttributionSummary {
  total_contacts: number;
  total_events: number;
  total_journeys: number;
  converted_journeys: number;
  conversion_rate: number;
  total_revenue: number;
  avg_touchpoints_to_convert: number;
  top_channels: { channel: string; conversions: number; events: number }[];
}

// =====================================================
// Contact Management Functions
// =====================================================

export async function getOrCreateAttributionContact(
  tenantId: string,
  contactId: string
): Promise<AttributionContact> {
  const supabase = await createClient();

  // Try to find existing
  const { data: existing } = await supabase
    .from("synthex_library_attribution_contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("contact_id", contactId)
    .single();

  if (existing) {
return existing;
}

  // Create new
  const { data: created, error } = await supabase
    .from("synthex_library_attribution_contacts")
    .insert({
      tenant_id: tenantId,
      contact_id: contactId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create attribution contact: ${error.message}`);
}
  return created;
}

export async function listAttributionContacts(
  tenantId: string,
  filters?: {
    persona_type?: PersonaType;
    min_touchpoints?: number;
    min_conversions?: number;
    has_recent_activity?: boolean;
    limit?: number;
  }
): Promise<AttributionContact[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_attribution_contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("last_event_at", { ascending: false });

  if (filters?.persona_type) {
query = query.eq("ai_persona_type", filters.persona_type);
}
  if (filters?.min_touchpoints) {
query = query.gte("total_touchpoints", filters.min_touchpoints);
}
  if (filters?.min_conversions) {
query = query.gte("total_conversions", filters.min_conversions);
}
  if (filters?.has_recent_activity) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("last_event_at", thirtyDaysAgo);
  }
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list attribution contacts: ${error.message}`);
}
  return data || [];
}

export async function updateAttributionContact(
  contactId: string,
  updates: Partial<AttributionContact>
): Promise<AttributionContact> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_attribution_contacts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", contactId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update attribution contact: ${error.message}`);
}
  return data;
}

// =====================================================
// Event Tracking Functions
// =====================================================

export async function recordEvent(
  tenantId: string,
  contactId: string,
  data: {
    event_type: EventType;
    channel: ChannelType;
    event_category?: EventCategory;
    sub_channel?: string;
    campaign_id?: string;
    campaign_name?: string;
    source?: string;
    medium?: string;
    content?: string;
    term?: string;
    landing_page?: string;
    referrer?: string;
    is_conversion_event?: boolean;
    conversion_id?: string;
    conversion_value?: number;
    session_id?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    geo_country?: string;
    geo_region?: string;
    geo_city?: string;
    raw_data?: Record<string, unknown>;
  }
): Promise<AttributionEvent> {
  const supabase = await createClient();

  // Get or create attribution contact
  const attrContact = await getOrCreateAttributionContact(tenantId, contactId);

  // Determine journey sequence
  const { count } = await supabase
    .from("synthex_library_attribution_events")
    .select("*", { count: "exact", head: true })
    .eq("attribution_contact_id", attrContact.id);

  const journeySequence = (count || 0) + 1;

  // Record the event
  const { data: event, error } = await supabase
    .from("synthex_library_attribution_events")
    .insert({
      tenant_id: tenantId,
      attribution_contact_id: attrContact.id,
      event_type: data.event_type,
      event_category: data.event_category || categorizeEvent(data.event_type),
      channel: data.channel,
      sub_channel: data.sub_channel,
      campaign_id: data.campaign_id,
      campaign_name: data.campaign_name,
      source: data.source,
      medium: data.medium,
      content: data.content,
      term: data.term,
      landing_page: data.landing_page,
      referrer: data.referrer,
      is_conversion_event: data.is_conversion_event || false,
      conversion_id: data.conversion_id,
      conversion_value: data.conversion_value,
      session_id: data.session_id,
      journey_sequence: journeySequence,
      device_type: data.device_type,
      browser: data.browser,
      os: data.os,
      geo_country: data.geo_country,
      geo_region: data.geo_region,
      geo_city: data.geo_city,
      raw_data: data.raw_data || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record event: ${error.message}`);
}

  // Update attribution contact
  const updateData: Partial<AttributionContact> = {
    total_touchpoints: journeySequence,
    last_event_at: new Date().toISOString(),
    last_touch_channel: data.channel,
    last_touch_campaign: data.campaign_name || null,
    last_touch_at: new Date().toISOString(),
  };

  if (journeySequence === 1) {
    updateData.first_touch_channel = data.channel;
    updateData.first_touch_campaign = data.campaign_name || null;
    updateData.first_touch_at = new Date().toISOString();
  }

  if (data.is_conversion_event && data.conversion_value) {
    updateData.total_conversions = attrContact.total_conversions + 1;
    updateData.total_revenue = attrContact.total_revenue + data.conversion_value;
  }

  await updateAttributionContact(attrContact.id, updateData);

  return event;
}

function categorizeEvent(eventType: EventType): EventCategory {
  switch (eventType) {
    case "impression":
    case "click":
      return "awareness";
    case "page_view":
    case "email_open":
    case "email_click":
      return "consideration";
    case "form_submit":
    case "demo_request":
    case "chat":
    case "call":
      return "consideration";
    case "purchase":
    case "signup":
      return "conversion";
    default:
      return "awareness";
  }
}

export async function listEvents(
  tenantId: string,
  filters?: {
    attribution_contact_id?: string;
    channel?: ChannelType;
    event_type?: EventType;
    campaign_id?: string;
    is_conversion_event?: boolean;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<AttributionEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_attribution_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.attribution_contact_id) {
    query = query.eq("attribution_contact_id", filters.attribution_contact_id);
  }
  if (filters?.channel) {
query = query.eq("channel", filters.channel);
}
  if (filters?.event_type) {
query = query.eq("event_type", filters.event_type);
}
  if (filters?.campaign_id) {
query = query.eq("campaign_id", filters.campaign_id);
}
  if (filters?.is_conversion_event !== undefined) {
    query = query.eq("is_conversion_event", filters.is_conversion_event);
  }
  if (filters?.start_date) {
query = query.gte("created_at", filters.start_date);
}
  if (filters?.end_date) {
query = query.lte("created_at", filters.end_date);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list events: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Journey Functions
// =====================================================

export async function createJourney(
  tenantId: string,
  attributionContactId: string,
  data: {
    journey_type?: JourneyType;
    started_at?: string;
  }
): Promise<AttributionJourney> {
  const supabase = await createClient();

  const { data: journey, error } = await supabase
    .from("synthex_library_attribution_journeys")
    .insert({
      tenant_id: tenantId,
      attribution_contact_id: attributionContactId,
      journey_type: data.journey_type || "acquisition",
      started_at: data.started_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create journey: ${error.message}`);
}
  return journey;
}

export async function listJourneys(
  tenantId: string,
  filters?: {
    attribution_contact_id?: string;
    journey_type?: JourneyType;
    journey_status?: JourneyStatus;
    min_touchpoints?: number;
    limit?: number;
  }
): Promise<AttributionJourney[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_attribution_journeys")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.attribution_contact_id) {
    query = query.eq("attribution_contact_id", filters.attribution_contact_id);
  }
  if (filters?.journey_type) {
query = query.eq("journey_type", filters.journey_type);
}
  if (filters?.journey_status) {
query = query.eq("journey_status", filters.journey_status);
}
  if (filters?.min_touchpoints) {
query = query.gte("total_touchpoints", filters.min_touchpoints);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list journeys: ${error.message}`);
}
  return data || [];
}

export async function completeJourney(
  journeyId: string,
  data: {
    conversion_type?: string;
    conversion_value?: number;
    conversion_id?: string;
  }
): Promise<AttributionJourney> {
  const supabase = await createClient();

  const { data: journey, error } = await supabase
    .from("synthex_library_attribution_journeys")
    .update({
      journey_status: "converted",
      converted_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      conversion_type: data.conversion_type,
      conversion_value: data.conversion_value || 0,
      conversion_id: data.conversion_id,
    })
    .eq("id", journeyId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to complete journey: ${error.message}`);
}
  return journey;
}

export async function analyzeJourney(
  tenantId: string,
  journeyId: string
): Promise<AttributionJourney> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  // Get journey and events
  const { data: journey } = await supabase
    .from("synthex_library_attribution_journeys")
    .select("*")
    .eq("id", journeyId)
    .single();

  if (!journey) {
throw new Error("Journey not found");
}

  const { data: events } = await supabase
    .from("synthex_library_attribution_events")
    .select("*")
    .eq("attribution_contact_id", journey.attribution_contact_id)
    .gte("created_at", journey.started_at)
    .order("created_at");

  // Build channel sequence
  const channelSequence = events?.map((e) => e.channel) || [];
  const touchpointSequence = events?.map((e) => `${e.channel}:${e.event_type}`) || [];
  const uniqueChannels = new Set(channelSequence).size;

  // Calculate attribution breakdown using linear model
  const attributionBreakdown = calculateLinearAttribution(events || []);

  // AI analysis
  let aiAnalysis = {
    journey_score: 0.7,
    friction_points: [] as FrictionPoint[],
    optimization_suggestions: [] as OptimizationSuggestion[],
    similarity_to_ideal: 0.6,
    deviation_analysis: {},
  };

  if (client && events && events.length > 2) {
    try {
      const prompt = buildJourneyAnalysisPrompt(journey, events);
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const parsed = parseJourneyAnalysisResponse(content.text);
        if (parsed) {
aiAnalysis = parsed;
}
      }
    } catch (err) {
      console.error("[attributionMemoryService] AI journey analysis failed:", err);
    }
  }

  // Update journey with analysis
  const { data: updated, error } = await supabase
    .from("synthex_library_attribution_journeys")
    .update({
      total_touchpoints: events?.length || 0,
      touchpoint_sequence: touchpointSequence,
      channel_sequence: channelSequence,
      unique_channels: uniqueChannels,
      attribution_breakdown: attributionBreakdown,
      ai_journey_score: aiAnalysis.journey_score,
      ai_friction_points: aiAnalysis.friction_points,
      ai_optimization_suggestions: aiAnalysis.optimization_suggestions,
      similarity_to_ideal_journey: aiAnalysis.similarity_to_ideal,
      deviation_analysis: aiAnalysis.deviation_analysis,
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", journeyId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update journey analysis: ${error.message}`);
}
  return updated;
}

function calculateLinearAttribution(
  events: AttributionEvent[]
): Record<string, unknown> {
  if (events.length === 0) {
return {};
}

  const channelWeights: Record<string, number> = {};
  const weight = 1 / events.length;

  for (const event of events) {
    channelWeights[event.channel] = (channelWeights[event.channel] || 0) + weight;
  }

  return {
    model: "linear",
    channel_weights: channelWeights,
    first_touch: { channel: events[0]?.channel, weight: 0 },
    last_touch: { channel: events[events.length - 1]?.channel, weight: 0 },
  };
}

function buildJourneyAnalysisPrompt(
  journey: AttributionJourney,
  events: AttributionEvent[]
): string {
  const eventSummary = events.map((e, i) => ({
    position: i + 1,
    channel: e.channel,
    type: e.event_type,
    category: e.event_category,
    is_conversion: e.is_conversion_event,
  }));

  return `Analyze this customer journey for optimization opportunities:

Journey Type: ${journey.journey_type}
Status: ${journey.journey_status}
Total Touchpoints: ${events.length}

Event Sequence:
${JSON.stringify(eventSummary, null, 2)}

Provide analysis in JSON format:
{
  "journey_score": 0.0-1.0,
  "friction_points": [
    { "position": 1, "issue": "description", "severity": 0.0-1.0 }
  ],
  "optimization_suggestions": [
    { "suggestion": "description", "expected_lift": 0.0-1.0, "details": "..." }
  ],
  "similarity_to_ideal": 0.0-1.0,
  "deviation_analysis": {
    "key_deviations": ["..."],
    "missed_opportunities": ["..."]
  }
}`;
}

function parseJourneyAnalysisResponse(text: string): {
  journey_score: number;
  friction_points: FrictionPoint[];
  optimization_suggestions: OptimizationSuggestion[];
  similarity_to_ideal: number;
  deviation_analysis: Record<string, unknown>;
} | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        journey_score: Math.min(1, Math.max(0, parsed.journey_score || 0.7)),
        friction_points: parsed.friction_points || [],
        optimization_suggestions: parsed.optimization_suggestions || [],
        similarity_to_ideal: Math.min(1, Math.max(0, parsed.similarity_to_ideal || 0.6)),
        deviation_analysis: parsed.deviation_analysis || {},
      };
    }
  } catch (err) {
    console.error("[attributionMemoryService] Failed to parse journey analysis:", err);
  }
  return null;
}

// =====================================================
// Attribution Model Functions
// =====================================================

export async function createAttributionModel(
  tenantId: string,
  data: {
    model_name: string;
    model_type: AttributionModel;
    model_description?: string;
    config?: Record<string, unknown>;
    is_default?: boolean;
  },
  userId?: string
): Promise<AttributionModelConfig> {
  const supabase = await createClient();

  // If setting as default, unset other defaults
  if (data.is_default) {
    await supabase
      .from("synthex_library_attribution_models")
      .update({ is_default: false })
      .eq("tenant_id", tenantId);
  }

  const { data: model, error } = await supabase
    .from("synthex_library_attribution_models")
    .insert({
      tenant_id: tenantId,
      model_name: data.model_name,
      model_type: data.model_type,
      model_description: data.model_description,
      config: data.config || getDefaultModelConfig(data.model_type),
      is_default: data.is_default ?? false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create attribution model: ${error.message}`);
}
  return model;
}

function getDefaultModelConfig(modelType: AttributionModel): Record<string, unknown> {
  switch (modelType) {
    case "time_decay":
      return { half_life_days: 7 };
    case "position_based":
      return { first: 0.4, last: 0.4, middle: 0.2 };
    case "data_driven":
      return { min_conversions: 100, lookback_days: 90 };
    case "markov_chain":
      return { order: 1, min_transitions: 50 };
    default:
      return {};
  }
}

export async function listAttributionModels(
  tenantId: string
): Promise<AttributionModelConfig[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_attribution_models")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("is_default", { ascending: false });

  if (error) {
throw new Error(`Failed to list attribution models: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Channel Performance Functions
// =====================================================

export async function getChannelPerformance(
  tenantId: string,
  filters?: {
    channel?: ChannelType;
    period_type?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<ChannelPerformance[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_channel_performance")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false });

  if (filters?.channel) {
query = query.eq("channel", filters.channel);
}
  if (filters?.period_type) {
query = query.eq("period_type", filters.period_type);
}
  if (filters?.start_date) {
query = query.gte("period_start", filters.start_date);
}
  if (filters?.end_date) {
query = query.lte("period_end", filters.end_date);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to get channel performance: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Insight Functions
// =====================================================

export async function generateAttributionInsight(
  tenantId: string,
  data: {
    insight_type: InsightType;
    target_channel?: string;
    target_segment?: string;
    context?: Record<string, unknown>;
  }
): Promise<AttributionInsight> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  // Get attribution summary for context
  const { data: summary } = await supabase.rpc("get_attribution_summary", {
    p_tenant_id: tenantId,
  });

  let aiAnalysis = {
    score: 0.7,
    confidence: 0.75,
    impact_score: 0.6,
    urgency_score: 0.5,
    headline: `${data.insight_type.replace(/_/g, " ")} insight generated`,
    description: "Analysis based on current attribution data.",
    supporting_data: {},
    recommendations: [] as Recommendation[],
  };

  if (client) {
    try {
      const prompt = buildInsightPrompt(data.insight_type, summary, data.context);
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        const parsed = parseInsightResponse(content.text);
        if (parsed) {
aiAnalysis = { ...aiAnalysis, ...parsed };
}
      }
    } catch (err) {
      console.error("[attributionMemoryService] AI insight generation failed:", err);
    }
  }

  const { data: insight, error } = await supabase
    .from("synthex_library_attribution_insights")
    .insert({
      tenant_id: tenantId,
      insight_type: data.insight_type,
      target_channel: data.target_channel,
      target_segment: data.target_segment,
      score: aiAnalysis.score,
      confidence: aiAnalysis.confidence,
      impact_score: aiAnalysis.impact_score,
      urgency_score: aiAnalysis.urgency_score,
      headline: aiAnalysis.headline,
      description: aiAnalysis.description,
      supporting_data: aiAnalysis.supporting_data,
      recommendations: aiAnalysis.recommendations,
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to generate insight: ${error.message}`);
}
  return insight;
}

function buildInsightPrompt(
  insightType: InsightType,
  summary: AttributionSummary | null,
  context?: Record<string, unknown>
): string {
  return `Generate an attribution insight of type: ${insightType}

Attribution Summary:
${JSON.stringify(summary || {}, null, 2)}

Additional Context:
${JSON.stringify(context || {}, null, 2)}

Provide the insight in JSON format:
{
  "score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "impact_score": 0.0-1.0,
  "urgency_score": 0.0-1.0,
  "headline": "Short headline",
  "description": "Detailed description",
  "supporting_data": {},
  "recommendations": [
    { "action": "action_name", "channel": "channel_name", "expected_lift": 0.0-1.0, "details": "..." }
  ]
}`;
}

function parseInsightResponse(text: string): Partial<{
  score: number;
  confidence: number;
  impact_score: number;
  urgency_score: number;
  headline: string;
  description: string;
  supporting_data: Record<string, unknown>;
  recommendations: Recommendation[];
}> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(1, Math.max(0, parsed.score || 0.7)),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.75)),
        impact_score: Math.min(1, Math.max(0, parsed.impact_score || 0.6)),
        urgency_score: Math.min(1, Math.max(0, parsed.urgency_score || 0.5)),
        headline: parsed.headline || "",
        description: parsed.description || "",
        supporting_data: parsed.supporting_data || {},
        recommendations: parsed.recommendations || [],
      };
    }
  } catch (err) {
    console.error("[attributionMemoryService] Failed to parse insight response:", err);
  }
  return null;
}

export async function listAttributionInsights(
  tenantId: string,
  filters?: {
    insight_type?: InsightType;
    status?: InsightStatus;
    target_channel?: string;
    min_score?: number;
    limit?: number;
  }
): Promise<AttributionInsight[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_attribution_insights")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.insight_type) {
query = query.eq("insight_type", filters.insight_type);
}
  if (filters?.status) {
query = query.eq("status", filters.status);
}
  if (filters?.target_channel) {
query = query.eq("target_channel", filters.target_channel);
}
  if (filters?.min_score) {
query = query.gte("score", filters.min_score);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list attribution insights: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Stats Functions
// =====================================================

export async function getAttributionStats(tenantId: string): Promise<{
  total_contacts: number;
  active_contacts: number;
  total_events: number;
  conversion_events: number;
  total_journeys: number;
  converted_journeys: number;
  in_progress_journeys: number;
  total_revenue: number;
  avg_touchpoints_to_convert: number;
  top_channels: { channel: string; events: number; conversions: number }[];
  top_personas: { persona: string; count: number }[];
  active_models: number;
  total_insights: number;
  active_insights: number;
}> {
  const supabase = await createClient();

  // Contacts stats
  const { data: contacts } = await supabase
    .from("synthex_library_attribution_contacts")
    .select("is_active, total_conversions, total_revenue, ai_persona_type, total_touchpoints")
    .eq("tenant_id", tenantId);

  // Events stats
  const { data: events } = await supabase
    .from("synthex_library_attribution_events")
    .select("channel, is_conversion_event")
    .eq("tenant_id", tenantId);

  // Journeys stats
  const { data: journeys } = await supabase
    .from("synthex_library_attribution_journeys")
    .select("journey_status, total_touchpoints")
    .eq("tenant_id", tenantId);

  // Models and insights
  const { count: modelsCount } = await supabase
    .from("synthex_library_attribution_models")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { data: insights } = await supabase
    .from("synthex_library_attribution_insights")
    .select("status")
    .eq("tenant_id", tenantId);

  // Calculate metrics
  const totalContacts = contacts?.length || 0;
  const activeContacts = contacts?.filter((c) => c.is_active).length || 0;
  const totalRevenue = contacts?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0;

  const totalEvents = events?.length || 0;
  const conversionEvents = events?.filter((e) => e.is_conversion_event).length || 0;

  const totalJourneys = journeys?.length || 0;
  const convertedJourneys = journeys?.filter((j) => j.journey_status === "converted").length || 0;
  const inProgressJourneys = journeys?.filter((j) => j.journey_status === "in_progress").length || 0;

  const convertedWithTouchpoints = journeys?.filter(
    (j) => j.journey_status === "converted" && j.total_touchpoints > 0
  );
  const avgTouchpoints =
    convertedWithTouchpoints && convertedWithTouchpoints.length > 0
      ? convertedWithTouchpoints.reduce((sum, j) => sum + j.total_touchpoints, 0) /
        convertedWithTouchpoints.length
      : 0;

  // Channel breakdown
  const channelBreakdown: Record<string, { events: number; conversions: number }> = {};
  events?.forEach((e) => {
    if (!channelBreakdown[e.channel]) {
      channelBreakdown[e.channel] = { events: 0, conversions: 0 };
    }
    channelBreakdown[e.channel].events++;
    if (e.is_conversion_event) {
channelBreakdown[e.channel].conversions++;
}
  });

  const topChannels = Object.entries(channelBreakdown)
    .map(([channel, data]) => ({ channel, ...data }))
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 5);

  // Persona breakdown
  const personaBreakdown: Record<string, number> = {};
  contacts?.forEach((c) => {
    if (c.ai_persona_type) {
      personaBreakdown[c.ai_persona_type] = (personaBreakdown[c.ai_persona_type] || 0) + 1;
    }
  });

  const topPersonas = Object.entries(personaBreakdown)
    .map(([persona, count]) => ({ persona, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total_contacts: totalContacts,
    active_contacts: activeContacts,
    total_events: totalEvents,
    conversion_events: conversionEvents,
    total_journeys: totalJourneys,
    converted_journeys: convertedJourneys,
    in_progress_journeys: inProgressJourneys,
    total_revenue: totalRevenue,
    avg_touchpoints_to_convert: Math.round(avgTouchpoints * 10) / 10,
    top_channels: topChannels,
    top_personas: topPersonas,
    active_models: modelsCount || 0,
    total_insights: insights?.length || 0,
    active_insights: insights?.filter((i) => i.status === "active").length || 0,
  };
}
