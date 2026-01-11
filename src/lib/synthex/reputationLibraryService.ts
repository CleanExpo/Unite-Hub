/**
 * Synthex Reputation Library Service
 * Phase D17: Reputation Intelligence Engine
 *
 * AI-powered reputation monitoring with sentiment analysis,
 * review aggregation, and response recommendations.
 *
 * Uses synthex_library_reputation_* tables (D17)
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// Lazy Anthropic client with circuit breaker
let anthropicClient: Anthropic | null = null;
let lastFailureTime: number | null = null;
const CIRCUIT_BREAKER_TIMEOUT = 60000;

function getAnthropicClient(): Anthropic {
  if (lastFailureTime && Date.now() - lastFailureTime < CIRCUIT_BREAKER_TIMEOUT) {
    throw new Error("Anthropic API circuit breaker open");
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export interface ReputationSource {
  id: string;
  tenant_id: string;
  name: string;
  source_type: string;
  source_url: string | null;
  business_id: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_frequency: string;
  total_reviews: number;
  average_rating: number | null;
  rating_distribution: Record<string, number>;
  auto_respond: boolean;
  notification_enabled: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReputationReview {
  id: string;
  tenant_id: string;
  source_id: string | null;
  external_id: string | null;
  source_type: string;
  source_url: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  reviewer_profile_url: string | null;
  is_verified_purchase: boolean;
  rating: number | null;
  rating_max: number;
  recommend: boolean | null;
  title: string | null;
  review_text: string;
  language: string;
  has_response: boolean;
  response_text: string | null;
  response_by: string | null;
  responded_at: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  emotions: string[];
  topics: unknown[];
  key_phrases: string[] | null;
  ai_summary: string | null;
  ai_model: string | null;
  analyzed_at: string | null;
  priority: string;
  requires_attention: boolean;
  status: string;
  review_date: string;
  imported_at: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReputationResponse {
  id: string;
  tenant_id: string;
  is_template: boolean;
  template_name: string | null;
  review_id: string | null;
  response_text: string;
  is_ai_generated: boolean;
  ai_model: string | null;
  ai_prompt: string | null;
  generation_params: Record<string, unknown>;
  variables_used: Record<string, unknown>;
  tone: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  usage_count: number;
  effectiveness_score: number | null;
  tags: string[];
  created_at: string;
  created_by: string | null;
}

export interface ReputationMetric {
  id: string;
  tenant_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  source_id: string | null;
  source_type: string | null;
  total_reviews: number;
  new_reviews: number;
  responded_reviews: number;
  average_rating: number | null;
  rating_distribution: Record<string, number>;
  rating_trend: number | null;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  average_sentiment: number | null;
  sentiment_trend: number | null;
  response_rate: number | null;
  avg_response_time_hours: number | null;
  top_topics: unknown[];
  top_positive_topics: unknown[];
  top_negative_topics: unknown[];
  ai_summary: string | null;
  ai_recommendations: string[] | null;
  created_at: string;
}

export interface ReputationAlert {
  id: string;
  tenant_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  review_id: string | null;
  source_id: string | null;
  metric_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  notification_sent: boolean;
  notification_channels: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ReputationCompetitor {
  id: string;
  tenant_id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  google_place_id: string | null;
  yelp_id: string | null;
  trustpilot_id: string | null;
  other_sources: Record<string, unknown>;
  average_rating: number | null;
  total_reviews: number | null;
  sentiment_score: number | null;
  last_updated: string | null;
  rating_difference: number | null;
  review_velocity: number | null;
  sentiment_comparison: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Source Functions
// =====================================================

export async function listSources(
  tenantId: string,
  filters?: {
    source_type?: string;
    is_active?: boolean;
    is_connected?: boolean;
  }
): Promise<ReputationSource[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reputation_sources")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.source_type) {
    query = query.eq("source_type", filters.source_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_connected !== undefined) {
    query = query.eq("is_connected", filters.is_connected);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list sources: ${error.message}`);
  }

  return data || [];
}

export async function getSource(sourceId: string): Promise<ReputationSource | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get source: ${error.message}`);
  }

  return data;
}

export async function createSource(
  tenantId: string,
  source: {
    name: string;
    source_type: string;
    source_url?: string;
    business_id?: string;
    sync_frequency?: string;
    auto_respond?: boolean;
    notification_enabled?: boolean;
    metadata?: Record<string, unknown>;
  }
): Promise<ReputationSource> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_sources")
    .insert({
      tenant_id: tenantId,
      ...source,
      is_connected: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create source: ${error.message}`);
  }

  return data;
}

export async function updateSource(
  sourceId: string,
  updates: Partial<ReputationSource>
): Promise<ReputationSource> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_sources")
    .update(updates)
    .eq("id", sourceId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update source: ${error.message}`);
  }

  return data;
}

export async function deleteSource(sourceId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_reputation_sources")
    .delete()
    .eq("id", sourceId);

  if (error) {
    throw new Error(`Failed to delete source: ${error.message}`);
  }
}

// =====================================================
// Review Functions
// =====================================================

export async function listReviews(
  tenantId: string,
  filters?: {
    source_id?: string;
    source_type?: string;
    sentiment?: string;
    status?: string;
    priority?: string;
    requires_attention?: boolean;
    min_rating?: number;
    max_rating?: number;
    limit?: number;
    offset?: number;
  }
): Promise<ReputationReview[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reputation_reviews")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("review_date", { ascending: false });

  if (filters?.source_id) {
    query = query.eq("source_id", filters.source_id);
  }
  if (filters?.source_type) {
    query = query.eq("source_type", filters.source_type);
  }
  if (filters?.sentiment) {
    query = query.eq("sentiment", filters.sentiment);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.requires_attention !== undefined) {
    query = query.eq("requires_attention", filters.requires_attention);
  }
  if (filters?.min_rating !== undefined) {
    query = query.gte("rating", filters.min_rating);
  }
  if (filters?.max_rating !== undefined) {
    query = query.lte("rating", filters.max_rating);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list reviews: ${error.message}`);
  }

  return data || [];
}

export async function getReview(reviewId: string): Promise<ReputationReview | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get review: ${error.message}`);
  }

  return data;
}

export async function importReview(
  tenantId: string,
  review: {
    source_id?: string;
    external_id?: string;
    source_type: string;
    source_url?: string;
    reviewer_name?: string;
    reviewer_avatar?: string;
    reviewer_profile_url?: string;
    is_verified_purchase?: boolean;
    rating?: number;
    rating_max?: number;
    recommend?: boolean;
    title?: string;
    review_text: string;
    language?: string;
    review_date: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): Promise<ReputationReview> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_reviews")
    .insert({
      tenant_id: tenantId,
      ...review,
      status: "new",
      priority: "normal",
      requires_attention: (review.rating || 5) <= 2,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to import review: ${error.message}`);
  }

  return data;
}

export async function updateReview(
  reviewId: string,
  updates: Partial<ReputationReview>
): Promise<ReputationReview> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_reviews")
    .update(updates)
    .eq("id", reviewId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update review: ${error.message}`);
  }

  return data;
}

export async function analyzeReview(reviewId: string): Promise<ReputationReview> {
  const review = await getReview(reviewId);
  if (!review) {
    throw new Error("Review not found");
  }

  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Analyze this customer review:

Rating: ${review.rating || "N/A"} / ${review.rating_max}
Title: ${review.title || "N/A"}
Review: ${review.review_text}

Provide analysis in JSON format:
{
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "sentiment_score": -1.0 to 1.0,
  "emotions": ["list", "of", "emotions"],
  "topics": [{"topic": "name", "sentiment": "positive/negative"}],
  "key_phrases": ["important", "phrases"],
  "summary": "One sentence summary",
  "priority": "low" | "normal" | "high" | "urgent",
  "requires_attention": true/false,
  "reasoning": "Explain your analysis"
}`,
        },
      ],
      system: `You are a reputation analysis expert. Analyze customer reviews for sentiment, topics, and actionable insights. Be objective and thorough.`,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response");
    }

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return updateReview(reviewId, {
      sentiment: parsed.sentiment as string,
      sentiment_score: parsed.sentiment_score as number,
      emotions: parsed.emotions as string[],
      topics: parsed.topics as unknown[],
      key_phrases: parsed.key_phrases as string[],
      ai_summary: parsed.summary as string,
      ai_model: "claude-sonnet-4-5-20250514",
      analyzed_at: new Date().toISOString(),
      priority: parsed.priority as string,
      requires_attention: parsed.requires_attention as boolean,
      status: "read",
    } as Partial<ReputationReview>);
  } catch (error) {
    lastFailureTime = Date.now();
    throw error;
  }
}

export async function respondToReview(
  reviewId: string,
  responseText: string,
  userId: string
): Promise<ReputationReview> {
  return updateReview(reviewId, {
    has_response: true,
    response_text: responseText,
    response_by: userId,
    responded_at: new Date().toISOString(),
    status: "responded",
  } as Partial<ReputationReview>);
}

// =====================================================
// Response Template Functions
// =====================================================

export async function listResponseTemplates(
  tenantId: string,
  filters?: {
    tone?: string;
    limit?: number;
  }
): Promise<ReputationResponse[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reputation_responses")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_template", true)
    .order("usage_count", { ascending: false });

  if (filters?.tone) {
    query = query.eq("tone", filters.tone);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }

  return data || [];
}

export async function createResponseTemplate(
  tenantId: string,
  template: {
    template_name: string;
    response_text: string;
    tone?: string;
    tags?: string[];
  },
  userId?: string
): Promise<ReputationResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_responses")
    .insert({
      tenant_id: tenantId,
      is_template: true,
      ...template,
      status: "approved",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return data;
}

export async function generateResponse(
  reviewId: string,
  options?: {
    tone?: string;
    template_id?: string;
    additional_context?: string;
  }
): Promise<ReputationResponse> {
  const review = await getReview(reviewId);
  if (!review) {
    throw new Error("Review not found");
  }

  const supabase = await createClient();

  // Get template if provided
  let templateText = "";
  if (options?.template_id) {
    const { data: template } = await supabase
      .from("synthex_library_reputation_responses")
      .select("response_text")
      .eq("id", options.template_id)
      .single();
    if (template) {
      templateText = `\n\nUse this template as a guide:\n${template.response_text}`;
    }
  }

  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Generate a response to this customer review:

Reviewer: ${review.reviewer_name || "Customer"}
Rating: ${review.rating || "N/A"} / ${review.rating_max}
Review: ${review.review_text}
${review.ai_summary ? `\nAI Summary: ${review.ai_summary}` : ""}
${options?.additional_context ? `\nAdditional Context: ${options.additional_context}` : ""}
${templateText}

Tone: ${options?.tone || "professional and empathetic"}

Provide response in JSON format:
{
  "response_text": "The full response text",
  "tone": "The tone used",
  "reasoning": "Why this response is appropriate"
}`,
        },
      ],
      system: `You are a customer service expert. Write thoughtful, personalized responses to reviews. Be genuine, address specific concerns, and thank customers for their feedback.`,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response");
    }

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in response");
      }
    } catch {
      throw new Error("Failed to parse AI response");
    }

    // Save generated response
    const { data, error } = await supabase
      .from("synthex_library_reputation_responses")
      .insert({
        tenant_id: review.tenant_id,
        is_template: false,
        review_id: reviewId,
        response_text: parsed.response_text as string,
        is_ai_generated: true,
        ai_model: "claude-sonnet-4-5-20250514",
        tone: parsed.tone as string,
        status: "pending_approval",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save response: ${error.message}`);
    }

    return data;
  } catch (error) {
    lastFailureTime = Date.now();
    throw error;
  }
}

export async function approveResponse(
  responseId: string,
  userId: string
): Promise<ReputationResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_responses")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", responseId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve response: ${error.message}`);
  }

  return data;
}

export async function publishResponse(
  responseId: string
): Promise<{ response: ReputationResponse; review: ReputationReview }> {
  const supabase = await createClient();

  // Get response
  const { data: response, error: respError } = await supabase
    .from("synthex_library_reputation_responses")
    .select("*")
    .eq("id", responseId)
    .single();

  if (respError || !response) {
    throw new Error("Response not found");
  }

  if (!response.review_id) {
    throw new Error("Response not linked to a review");
  }

  // Update response status
  const { data: updatedResponse, error: updateRespError } = await supabase
    .from("synthex_library_reputation_responses")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", responseId)
    .select()
    .single();

  if (updateRespError) {
    throw new Error(`Failed to update response: ${updateRespError.message}`);
  }

  // Update review with response
  const review = await respondToReview(
    response.review_id,
    response.response_text,
    response.approved_by || ""
  );

  return { response: updatedResponse, review };
}

// =====================================================
// Metrics Functions
// =====================================================

export async function getMetrics(
  tenantId: string,
  filters?: {
    period_type?: string;
    source_id?: string;
    limit?: number;
  }
): Promise<ReputationMetric[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reputation_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false });

  if (filters?.period_type) {
    query = query.eq("period_type", filters.period_type);
  }
  if (filters?.source_id) {
    query = query.eq("source_id", filters.source_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get metrics: ${error.message}`);
  }

  return data || [];
}

export async function aggregateMetrics(
  tenantId: string,
  periodType: "daily" | "weekly" | "monthly"
): Promise<ReputationMetric> {
  const supabase = await createClient();

  // Calculate period boundaries
  const now = new Date();
  let periodStart: Date;
  const periodEnd = now;

  switch (periodType) {
    case "daily":
      periodStart = new Date(now);
      periodStart.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      break;
    case "monthly":
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
      break;
  }

  // Get reviews in period
  const { data: reviews } = await supabase
    .from("synthex_library_reputation_reviews")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("review_date", periodStart.toISOString())
    .lte("review_date", periodEnd.toISOString());

  const reviewList = reviews || [];
  const totalReviews = reviewList.length;
  const respondedReviews = reviewList.filter((r) => r.has_response).length;

  // Calculate averages
  const withRating = reviewList.filter((r) => r.rating !== null);
  const avgRating = withRating.length
    ? withRating.reduce((sum, r) => sum + (r.rating || 0), 0) / withRating.length
    : null;

  // Rating distribution
  const ratingDist: Record<string, number> = {};
  withRating.forEach((r) => {
    const key = Math.floor(r.rating || 0).toString();
    ratingDist[key] = (ratingDist[key] || 0) + 1;
  });

  // Sentiment counts
  const positive = reviewList.filter((r) => r.sentiment === "positive").length;
  const neutral = reviewList.filter((r) => r.sentiment === "neutral").length;
  const negative = reviewList.filter((r) => r.sentiment === "negative").length;

  const withSentiment = reviewList.filter((r) => r.sentiment_score !== null);
  const avgSentiment = withSentiment.length
    ? withSentiment.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / withSentiment.length
    : null;

  // Response rate
  const responseRate = totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : null;

  // Insert metric
  const { data, error } = await supabase
    .from("synthex_library_reputation_metrics")
    .insert({
      tenant_id: tenantId,
      period_type: periodType,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      total_reviews: totalReviews,
      new_reviews: totalReviews,
      responded_reviews: respondedReviews,
      average_rating: avgRating,
      rating_distribution: ratingDist,
      positive_count: positive,
      neutral_count: neutral,
      negative_count: negative,
      average_sentiment: avgSentiment,
      response_rate: responseRate,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create metrics: ${error.message}`);
  }

  return data;
}

// =====================================================
// Alert Functions
// =====================================================

export async function listAlerts(
  tenantId: string,
  filters?: {
    status?: string;
    severity?: string;
    alert_type?: string;
    limit?: number;
  }
): Promise<ReputationAlert[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reputation_alerts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.severity) {
    query = query.eq("severity", filters.severity);
  }
  if (filters?.alert_type) {
    query = query.eq("alert_type", filters.alert_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list alerts: ${error.message}`);
  }

  return data || [];
}

export async function createAlert(
  tenantId: string,
  alert: {
    alert_type: string;
    severity: string;
    title: string;
    description: string;
    review_id?: string;
    source_id?: string;
    metric_name?: string;
    metric_value?: number;
    threshold_value?: number;
  }
): Promise<ReputationAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_alerts")
    .insert({
      tenant_id: tenantId,
      ...alert,
      status: "new",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create alert: ${error.message}`);
  }

  return data;
}

export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<ReputationAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_alerts")
    .update({
      status: "acknowledged",
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to acknowledge alert: ${error.message}`);
  }

  return data;
}

export async function resolveAlert(
  alertId: string,
  userId: string
): Promise<ReputationAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_alerts")
    .update({
      status: "resolved",
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to resolve alert: ${error.message}`);
  }

  return data;
}

// =====================================================
// Competitor Functions
// =====================================================

export async function listCompetitors(
  tenantId: string,
  filters?: {
    is_active?: boolean;
    limit?: number;
  }
): Promise<ReputationCompetitor[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reputation_competitors")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list competitors: ${error.message}`);
  }

  return data || [];
}

export async function addCompetitor(
  tenantId: string,
  competitor: {
    name: string;
    website?: string;
    logo_url?: string;
    google_place_id?: string;
    yelp_id?: string;
    trustpilot_id?: string;
    other_sources?: Record<string, unknown>;
    notes?: string;
  }
): Promise<ReputationCompetitor> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_competitors")
    .insert({
      tenant_id: tenantId,
      ...competitor,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add competitor: ${error.message}`);
  }

  return data;
}

export async function updateCompetitor(
  competitorId: string,
  updates: Partial<ReputationCompetitor>
): Promise<ReputationCompetitor> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reputation_competitors")
    .update(updates)
    .eq("id", competitorId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update competitor: ${error.message}`);
  }

  return data;
}

export async function deleteCompetitor(competitorId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_reputation_competitors")
    .delete()
    .eq("id", competitorId);

  if (error) {
    throw new Error(`Failed to delete competitor: ${error.message}`);
  }
}

// =====================================================
// Stats
// =====================================================

export async function getReputationStats(tenantId: string): Promise<{
  total_sources: number;
  total_reviews: number;
  average_rating: number | null;
  response_rate: number | null;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
  pending_alerts: number;
  competitors_tracked: number;
  reviews_by_source: Record<string, number>;
}> {
  const supabase = await createClient();

  // Get counts
  const [
    { count: sourceCount },
    { count: reviewCount },
    { count: alertCount },
    { count: competitorCount },
  ] = await Promise.all([
    supabase
      .from("synthex_library_reputation_sources")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
    supabase
      .from("synthex_library_reputation_reviews")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_reputation_alerts")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "new"),
    supabase
      .from("synthex_library_reputation_competitors")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
  ]);

  // Get reviews for calculations
  const { data: reviews } = await supabase
    .from("synthex_library_reputation_reviews")
    .select("rating, sentiment, has_response, source_type")
    .eq("tenant_id", tenantId);

  const reviewList = reviews || [];

  // Average rating
  const withRating = reviewList.filter((r) => r.rating !== null);
  const avgRating = withRating.length
    ? withRating.reduce((sum, r) => sum + (r.rating || 0), 0) / withRating.length
    : null;

  // Response rate
  const responded = reviewList.filter((r) => r.has_response).length;
  const responseRate = reviewList.length > 0 ? (responded / reviewList.length) * 100 : null;

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: reviewList.filter((r) => r.sentiment === "positive").length,
    neutral: reviewList.filter((r) => r.sentiment === "neutral").length,
    negative: reviewList.filter((r) => r.sentiment === "negative").length,
    mixed: reviewList.filter((r) => r.sentiment === "mixed").length,
  };

  // Reviews by source
  const reviewsBySource: Record<string, number> = {};
  reviewList.forEach((r) => {
    reviewsBySource[r.source_type] = (reviewsBySource[r.source_type] || 0) + 1;
  });

  return {
    total_sources: sourceCount || 0,
    total_reviews: reviewCount || 0,
    average_rating: avgRating,
    response_rate: responseRate,
    sentiment_breakdown: sentimentBreakdown,
    pending_alerts: alertCount || 0,
    competitors_tracked: competitorCount || 0,
    reviews_by_source: reviewsBySource,
  };
}
