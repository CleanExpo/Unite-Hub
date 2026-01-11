/**
 * Synthex Behavioral Trend Service
 * Phase D16: Behavioral Analytics & Trend Detection
 *
 * AI-powered behavioral analysis with trend detection,
 * pattern recognition, and predictive insights.
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

export interface BehaviorEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_category: string | null;
  event_action: string | null;
  event_label: string | null;
  contact_id: string | null;
  session_id: string | null;
  channel: string | null;
  source: string | null;
  page_url: string | null;
  event_value: number | null;
  revenue: number | null;
  device_type: string | null;
  geo_country: string | null;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface BehaviorSession {
  id: string;
  tenant_id: string;
  session_id: string;
  contact_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_views: number;
  events_count: number;
  interactions: number;
  conversions: number;
  entry_page: string | null;
  exit_page: string | null;
  channel: string | null;
  device_type: string | null;
  engagement_score: number | null;
  intent_score: number | null;
}

export interface BehaviorTrend {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  trend_type: string;
  event_type: string | null;
  channel: string | null;
  segment: string | null;
  metric_name: string;
  baseline_value: number | null;
  current_value: number | null;
  change_percent: number | null;
  trend_direction: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  confidence_score: number | null;
  sample_size: number | null;
  ai_summary: string | null;
  ai_insights: string[] | null;
  ai_recommendations: string[] | null;
  status: string;
  severity: string | null;
  created_at: string;
}

export interface BehaviorPattern {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  pattern_type: string;
  pattern_rules: Record<string, unknown>;
  event_sequence: string[] | null;
  occurrence_count: number;
  impact_score: number | null;
  ai_explanation: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BehaviorPrediction {
  id: string;
  tenant_id: string;
  prediction_type: string;
  contact_id: string | null;
  scope: string;
  predicted_value: number | null;
  predicted_label: string | null;
  probability: number | null;
  contributing_factors: Array<{ factor: string; weight: number }>;
  ai_reasoning: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface BehaviorAlert {
  id: string;
  tenant_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metric_name: string | null;
  metric_value: number | null;
  status: string;
  created_at: string;
}

// =====================================================
// Events
// =====================================================

export async function trackEvent(
  tenantId: string,
  event: {
    event_type: string;
    event_category?: string;
    event_action?: string;
    event_label?: string;
    contact_id?: string;
    session_id?: string;
    channel?: string;
    source?: string;
    page_url?: string;
    event_value?: number;
    revenue?: number;
    device_type?: string;
    geo_country?: string;
    properties?: Record<string, unknown>;
  }
): Promise<BehaviorEvent> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_behavior_events")
    .insert({
      tenant_id: tenantId,
      ...event,
      properties: event.properties || {},
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

export async function trackBatchEvents(
  tenantId: string,
  events: Array<{
    event_type: string;
    event_category?: string;
    event_action?: string;
    contact_id?: string;
    session_id?: string;
    channel?: string;
    properties?: Record<string, unknown>;
  }>
): Promise<number> {
  const supabase = await createClient();

  const eventRows = events.map((e) => ({
    tenant_id: tenantId,
    ...e,
    properties: e.properties || {},
  }));

  const { error } = await supabase
    .from("synthex_library_behavior_events")
    .insert(eventRows);

  if (error) {
throw error;
}
  return events.length;
}

export async function getEvents(
  tenantId: string,
  filters?: {
    eventType?: string;
    channel?: string;
    contactId?: string;
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<BehaviorEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_behavior_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.eventType) {
query = query.eq("event_type", filters.eventType);
}
  if (filters?.channel) {
query = query.eq("channel", filters.channel);
}
  if (filters?.contactId) {
query = query.eq("contact_id", filters.contactId);
}
  if (filters?.sessionId) {
query = query.eq("session_id", filters.sessionId);
}
  if (filters?.startDate) {
query = query.gte("created_at", filters.startDate);
}
  if (filters?.endDate) {
query = query.lte("created_at", filters.endDate);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

// =====================================================
// Sessions
// =====================================================

export async function getOrCreateSession(
  tenantId: string,
  sessionId: string,
  data?: {
    contact_id?: string;
    channel?: string;
    source?: string;
    device_type?: string;
    entry_page?: string;
  }
): Promise<BehaviorSession> {
  const supabase = await createClient();

  // Try to get existing session
  const { data: existing } = await supabase
    .from("synthex_library_behavior_sessions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("session_id", sessionId)
    .single();

  if (existing) {
return existing;
}

  // Create new session
  const { data: session, error } = await supabase
    .from("synthex_library_behavior_sessions")
    .insert({
      tenant_id: tenantId,
      session_id: sessionId,
      started_at: new Date().toISOString(),
      ...data,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return session;
}

export async function updateSession(
  sessionId: string,
  updates: Partial<{
    ended_at: string;
    duration_seconds: number;
    page_views: number;
    events_count: number;
    interactions: number;
    conversions: number;
    exit_page: string;
    engagement_score: number;
    intent_score: number;
  }>
): Promise<BehaviorSession> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_behavior_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

export async function getSessions(
  tenantId: string,
  filters?: {
    contactId?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
    minEngagement?: number;
    limit?: number;
  }
): Promise<BehaviorSession[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_behavior_sessions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("started_at", { ascending: false });

  if (filters?.contactId) {
query = query.eq("contact_id", filters.contactId);
}
  if (filters?.channel) {
query = query.eq("channel", filters.channel);
}
  if (filters?.startDate) {
query = query.gte("started_at", filters.startDate);
}
  if (filters?.endDate) {
query = query.lte("started_at", filters.endDate);
}
  if (filters?.minEngagement) {
query = query.gte("engagement_score", filters.minEngagement);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

// =====================================================
// Trend Analysis
// =====================================================

export async function analyzeTrends(
  tenantId: string,
  config: {
    metricName: string;
    eventType?: string;
    channel?: string;
    periodType: "daily" | "weekly" | "monthly";
    lookbackPeriods?: number;
  }
): Promise<BehaviorTrend> {
  const supabase = await createClient();

  // Get historical data
  const now = new Date();
  const lookback = config.lookbackPeriods || 7;
  let periodMs: number;

  switch (config.periodType) {
    case "daily":
      periodMs = 24 * 60 * 60 * 1000;
      break;
    case "weekly":
      periodMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case "monthly":
      periodMs = 30 * 24 * 60 * 60 * 1000;
      break;
  }

  const periodStart = new Date(now.getTime() - periodMs);
  const baselineEnd = new Date(periodStart.getTime());
  const baselineStart = new Date(baselineEnd.getTime() - periodMs * lookback);

  // Query events for baseline period
  let baselineQuery = supabase
    .from("synthex_library_behavior_events")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .gte("created_at", baselineStart.toISOString())
    .lt("created_at", baselineEnd.toISOString());

  if (config.eventType) {
baselineQuery = baselineQuery.eq("event_type", config.eventType);
}
  if (config.channel) {
baselineQuery = baselineQuery.eq("channel", config.channel);
}

  const { count: baselineCount } = await baselineQuery;

  // Query events for current period
  let currentQuery = supabase
    .from("synthex_library_behavior_events")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .gte("created_at", periodStart.toISOString())
    .lt("created_at", now.toISOString());

  if (config.eventType) {
currentQuery = currentQuery.eq("event_type", config.eventType);
}
  if (config.channel) {
currentQuery = currentQuery.eq("channel", config.channel);
}

  const { count: currentCount } = await currentQuery;

  const baselineAvg = (baselineCount || 0) / lookback;
  const currentValue = currentCount || 0;
  const changePercent =
    baselineAvg > 0 ? ((currentValue - baselineAvg) / baselineAvg) * 100 : 0;

  let trendDirection: "up" | "down" | "stable" = "stable";
  if (changePercent > 10) {
trendDirection = "up";
} else if (changePercent < -10) {
trendDirection = "down";
}

  let trendType: "emerging" | "declining" | "pattern" | "anomaly" = "pattern";
  if (Math.abs(changePercent) > 50) {
trendType = "anomaly";
} else if (changePercent > 20) {
trendType = "emerging";
} else if (changePercent < -20) {
trendType = "declining";
}

  // AI analysis
  let aiSummary = "";
  let aiInsights: string[] = [];
  let aiRecommendations: string[] = [];

  try {
    const anthropic = getAnthropicClient();

    const analysisPrompt = `Analyze this behavioral trend:
- Metric: ${config.metricName}
- Event Type: ${config.eventType || "all"}
- Channel: ${config.channel || "all"}
- Period: ${config.periodType}
- Baseline Average: ${baselineAvg.toFixed(2)}
- Current Value: ${currentValue}
- Change: ${changePercent.toFixed(1)}%
- Direction: ${trendDirection}

Provide:
1. A brief summary (2-3 sentences)
2. 3 key insights
3. 3 actionable recommendations

Respond in JSON format:
{
  "summary": "...",
  "insights": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."]
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: analysisPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (textContent && textContent.type === "text") {
      try {
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiSummary = parsed.summary || "";
          aiInsights = parsed.insights || [];
          aiRecommendations = parsed.recommendations || [];
        }
      } catch {
        aiSummary = textContent.text;
      }
    }
  } catch (error) {
    lastFailureTime = Date.now();
    console.error("AI analysis failed:", error);
  }

  // Save trend
  const { data: trend, error } = await supabase
    .from("synthex_library_behavior_trends")
    .insert({
      tenant_id: tenantId,
      name: `${config.metricName} ${config.periodType} trend`,
      trend_type: trendType,
      event_type: config.eventType,
      channel: config.channel,
      metric_name: config.metricName,
      baseline_value: baselineAvg,
      current_value: currentValue,
      change_percent: changePercent,
      trend_direction: trendDirection,
      period_type: config.periodType,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString(),
      confidence_score: 0.8,
      sample_size: currentCount,
      ai_summary: aiSummary,
      ai_insights: aiInsights,
      ai_recommendations: aiRecommendations,
      ai_model: "claude-sonnet-4-5-20250514",
      analyzed_at: new Date().toISOString(),
      status: "active",
      severity: Math.abs(changePercent) > 50 ? "high" : Math.abs(changePercent) > 20 ? "medium" : "low",
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return trend;
}

export async function getTrends(
  tenantId: string,
  filters?: {
    trendType?: string;
    status?: string;
    severity?: string;
    limit?: number;
  }
): Promise<BehaviorTrend[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_behavior_trends")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.trendType) {
query = query.eq("trend_type", filters.trendType);
}
  if (filters?.status) {
query = query.eq("status", filters.status);
}
  if (filters?.severity) {
query = query.eq("severity", filters.severity);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

// =====================================================
// Patterns
// =====================================================

export async function detectPatterns(
  tenantId: string,
  config: {
    patternType: "journey" | "sequence" | "correlation";
    minOccurrences?: number;
    channel?: string;
  }
): Promise<BehaviorPattern[]> {
  const supabase = await createClient();

  // Get recent events for pattern detection
  const { data: events } = await supabase
    .from("synthex_library_behavior_events")
    .select("event_type, session_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
    .limit(10000);

  if (!events || events.length < 10) {
    return [];
  }

  // Group events by session for sequence detection
  const sessionEvents: Record<string, string[]> = {};
  for (const event of events) {
    if (event.session_id) {
      if (!sessionEvents[event.session_id]) {
        sessionEvents[event.session_id] = [];
      }
      sessionEvents[event.session_id].push(event.event_type);
    }
  }

  // Find common sequences (simplified pattern detection)
  const sequences: Record<string, number> = {};
  for (const events of Object.values(sessionEvents)) {
    if (events.length >= 2) {
      for (let i = 0; i < events.length - 1; i++) {
        const seq = `${events[i]} -> ${events[i + 1]}`;
        sequences[seq] = (sequences[seq] || 0) + 1;
      }
    }
  }

  // Filter by min occurrences and create patterns
  const minOccur = config.minOccurrences || 5;
  const patterns: BehaviorPattern[] = [];

  for (const [seq, count] of Object.entries(sequences)) {
    if (count >= minOccur) {
      const [from, to] = seq.split(" -> ");

      const { data: pattern, error } = await supabase
        .from("synthex_library_behavior_patterns")
        .insert({
          tenant_id: tenantId,
          name: `${from} to ${to} sequence`,
          pattern_type: config.patternType,
          pattern_rules: { from, to, min_occurrences: minOccur },
          event_sequence: [from, to],
          occurrence_count: count,
          is_active: true,
        })
        .select()
        .single();

      if (!error && pattern) {
        patterns.push(pattern);
      }
    }
  }

  return patterns;
}

export async function getPatterns(
  tenantId: string,
  filters?: {
    patternType?: string;
    activeOnly?: boolean;
    limit?: number;
  }
): Promise<BehaviorPattern[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_behavior_patterns")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("occurrence_count", { ascending: false });

  if (filters?.patternType) {
query = query.eq("pattern_type", filters.patternType);
}
  if (filters?.activeOnly !== false) {
query = query.eq("is_active", true);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

// =====================================================
// Predictions
// =====================================================

export async function generatePrediction(
  tenantId: string,
  config: {
    predictionType:
      | "churn_risk"
      | "conversion_likelihood"
      | "ltv_forecast"
      | "next_action"
      | "engagement_decline";
    contactId?: string;
    horizon?: string;
  }
): Promise<BehaviorPrediction> {
  const supabase = await createClient();

  // Get contact's behavioral data
  let query = supabase
    .from("synthex_library_behavior_events")
    .select("*")
    .eq("tenant_id", tenantId);

  if (config.contactId) {
    query = query.eq("contact_id", config.contactId);
  }

  const { data: events } = await query.order("created_at", { ascending: false }).limit(100);

  // Simple prediction logic (would be ML model in production)
  let predictedValue = 0.5;
  let predictedLabel = "medium";
  const factors: Array<{ factor: string; weight: number }> = [];

  const eventCount = events?.length || 0;

  if (config.predictionType === "churn_risk") {
    // Higher event count = lower churn risk
    predictedValue = Math.max(0.1, 1 - eventCount / 100);
    predictedLabel = predictedValue > 0.7 ? "high" : predictedValue > 0.3 ? "medium" : "low";
    factors.push({ factor: "recent_activity", weight: 0.4 });
    factors.push({ factor: "engagement_frequency", weight: 0.3 });
    factors.push({ factor: "session_duration", weight: 0.3 });
  } else if (config.predictionType === "conversion_likelihood") {
    // More engagement = higher conversion likelihood
    predictedValue = Math.min(0.9, eventCount / 50);
    predictedLabel = predictedValue > 0.6 ? "high" : predictedValue > 0.3 ? "medium" : "low";
    factors.push({ factor: "page_views", weight: 0.35 });
    factors.push({ factor: "product_interactions", weight: 0.4 });
    factors.push({ factor: "time_on_site", weight: 0.25 });
  }

  // AI reasoning
  let aiReasoning = "";
  try {
    const anthropic = getAnthropicClient();

    const prompt = `Based on ${eventCount} behavioral events, provide a brief explanation for a ${config.predictionType} prediction with probability ${(predictedValue * 100).toFixed(0)}% (${predictedLabel}). Keep it to 2-3 sentences.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (textContent && textContent.type === "text") {
      aiReasoning = textContent.text;
    }
  } catch (error) {
    lastFailureTime = Date.now();
    console.error("AI reasoning failed:", error);
  }

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (config.horizon === "30d" ? 30 : config.horizon === "90d" ? 90 : 7));

  const { data: prediction, error } = await supabase
    .from("synthex_library_behavior_predictions")
    .insert({
      tenant_id: tenantId,
      prediction_type: config.predictionType,
      contact_id: config.contactId,
      scope: config.contactId ? "individual" : "tenant",
      predicted_value: predictedValue,
      predicted_label: predictedLabel,
      probability: predictedValue,
      contributing_factors: factors,
      data_points_used: eventCount,
      ai_model: "claude-sonnet-4-5-20250514",
      ai_reasoning: aiReasoning,
      prediction_horizon: config.horizon || "7d",
      valid_until: validUntil.toISOString(),
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return prediction;
}

export async function getPredictions(
  tenantId: string,
  filters?: {
    predictionType?: string;
    contactId?: string;
    validOnly?: boolean;
    limit?: number;
  }
): Promise<BehaviorPrediction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_behavior_predictions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.predictionType) {
query = query.eq("prediction_type", filters.predictionType);
}
  if (filters?.contactId) {
query = query.eq("contact_id", filters.contactId);
}
  if (filters?.validOnly) {
query = query.gte("valid_until", new Date().toISOString());
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

// =====================================================
// Alerts
// =====================================================

export async function createAlert(
  tenantId: string,
  alert: {
    alert_type: string;
    severity: string;
    title: string;
    description: string;
    metric_name?: string;
    metric_value?: number;
    threshold_value?: number;
    trend_id?: string;
    pattern_id?: string;
    prediction_id?: string;
  }
): Promise<BehaviorAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_behavior_alerts")
    .insert({
      tenant_id: tenantId,
      ...alert,
    })
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

export async function getAlerts(
  tenantId: string,
  filters?: {
    alertType?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }
): Promise<BehaviorAlert[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_behavior_alerts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.alertType) {
query = query.eq("alert_type", filters.alertType);
}
  if (filters?.severity) {
query = query.eq("severity", filters.severity);
}
  if (filters?.status) {
query = query.eq("status", filters.status);
}
  if (filters?.limit) {
query = query.limit(filters.limit);
}

  const { data, error } = await query;

  if (error) {
throw error;
}
  return data || [];
}

export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<BehaviorAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_behavior_alerts")
    .update({
      status: "acknowledged",
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

export async function resolveAlert(
  alertId: string,
  userId: string,
  notes?: string
): Promise<BehaviorAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_behavior_alerts")
    .update({
      status: "resolved",
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
    })
    .eq("id", alertId)
    .select()
    .single();

  if (error) {
throw error;
}
  return data;
}

// =====================================================
// Stats
// =====================================================

export async function getBehaviorStats(tenantId: string): Promise<{
  totalEvents: number;
  totalSessions: number;
  avgEngagementScore: number;
  activeTrends: number;
  activePatterns: number;
  pendingAlerts: number;
}> {
  const supabase = await createClient();

  const [events, sessions, trends, patterns, alerts] = await Promise.all([
    supabase
      .from("synthex_library_behavior_events")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_behavior_sessions")
      .select("engagement_score")
      .eq("tenant_id", tenantId),
    supabase
      .from("synthex_library_behavior_trends")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("synthex_library_behavior_patterns")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
    supabase
      .from("synthex_library_behavior_alerts")
      .select("id", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "new"),
  ]);

  const sessionData = sessions.data || [];
  const avgEngagement =
    sessionData.length > 0
      ? sessionData.reduce((sum, s) => sum + (s.engagement_score || 0), 0) /
        sessionData.length
      : 0;

  return {
    totalEvents: events.count || 0,
    totalSessions: sessionData.length,
    avgEngagementScore: avgEngagement,
    activeTrends: trends.count || 0,
    activePatterns: patterns.count || 0,
    pendingAlerts: alerts.count || 0,
  };
}
