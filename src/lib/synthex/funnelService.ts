/**
 * Synthex Funnel Drop-Off Detection Service
 *
 * Phase D26: AI-powered funnel analysis with drop-off detection,
 * recovery recommendations, and optimization insights.
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

export type FunnelType =
  | "sales"
  | "onboarding"
  | "signup"
  | "checkout"
  | "engagement"
  | "custom";

export type EventType = "enter" | "exit" | "complete" | "drop_off" | "skip";

export type DropoffStatus =
  | "detected"
  | "analyzing"
  | "action_recommended"
  | "action_taken"
  | "resolved"
  | "ignored";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus =
  | "new"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "dismissed";

export interface FunnelStage {
  id: string;
  name: string;
  position: number;
  expected_conversion?: number;
}

export interface FunnelDefinition {
  id: string;
  tenant_id: string;
  funnel_name: string;
  funnel_description: string | null;
  funnel_type: FunnelType;
  stages: FunnelStage[];
  tracking_window_days: number;
  attribution_model: string;
  target_conversion_rate: number | null;
  target_time_to_convert_hours: number | null;
  is_active: boolean;
  is_primary: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunnelEvent {
  id: string;
  tenant_id: string;
  funnel_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  session_id: string | null;
  stage: string;
  stage_position: number | null;
  previous_stage: string | null;
  event_type: EventType;
  entered_at: string;
  exited_at: string | null;
  duration_seconds: number | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  channel: string | null;
  page_url: string | null;
  referrer_url: string | null;
  device_type: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface FunnelDropoff {
  id: string;
  tenant_id: string;
  funnel_id: string | null;
  stage: string;
  next_stage: string | null;
  stage_position: number | null;
  dropoff_rate: number;
  dropoff_count: number;
  total_entered: number;
  avg_time_before_dropoff_seconds: number | null;
  benchmark_dropoff_rate: number | null;
  variance_from_benchmark: number | null;
  is_above_threshold: boolean;
  alert_threshold: number;
  ai_recommendation: string | null;
  ai_confidence: number;
  ai_analysis: Record<string, unknown>;
  recovery_actions: RecoveryAction[];
  analysis_period_start: string | null;
  analysis_period_end: string | null;
  status: DropoffStatus;
  resolved_at: string | null;
  resolution_notes: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RecoveryAction {
  type: string;
  template?: string;
  delay_hours?: number;
  audience?: string;
  [key: string]: unknown;
}

export interface FunnelRecoveryAction {
  id: string;
  tenant_id: string;
  dropoff_id: string | null;
  funnel_id: string | null;
  contact_id: string | null;
  action_type: string;
  action_config: Record<string, unknown>;
  action_message: string | null;
  scheduled_at: string | null;
  executed_at: string | null;
  delay_hours: number;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  converted_at: string | null;
  conversion_value: number | null;
  created_at: string;
}

export interface FunnelMetrics {
  id: string;
  tenant_id: string;
  funnel_id: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  total_entries: number;
  total_conversions: number;
  overall_conversion_rate: number;
  avg_time_to_convert_seconds: number | null;
  stage_metrics: Record<string, StageMetrics>;
  total_dropoffs: number;
  primary_dropoff_stage: string | null;
  dropoff_distribution: Record<string, number>;
  total_revenue: number;
  avg_order_value: number | null;
  revenue_per_entry: number | null;
  created_at: string;
}

export interface StageMetrics {
  entries: number;
  exits: number;
  completions: number;
  conversion_rate: number;
  avg_duration: number;
}

export interface FunnelAlert {
  id: string;
  tenant_id: string;
  funnel_id: string | null;
  dropoff_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  current_value: number | null;
  expected_value: number | null;
  threshold_value: number | null;
  variance_percent: number | null;
  affected_stage: string | null;
  affected_period_start: string | null;
  affected_period_end: string | null;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface CreateFunnelInput {
  funnel_name: string;
  funnel_description?: string;
  funnel_type: FunnelType;
  stages: FunnelStage[];
  tracking_window_days?: number;
  attribution_model?: string;
  target_conversion_rate?: number;
  target_time_to_convert_hours?: number;
  is_primary?: boolean;
}

export interface TrackEventInput {
  funnel_id: string;
  contact_id?: string;
  lead_id?: string;
  session_id?: string;
  stage: string;
  stage_position?: number;
  previous_stage?: string;
  event_type?: EventType;
  source?: string;
  medium?: string;
  campaign?: string;
  channel?: string;
  page_url?: string;
  referrer_url?: string;
  device_type?: string;
  browser?: string;
  country?: string;
  city?: string;
  meta?: Record<string, unknown>;
}

export interface AnalyzeDropoffInput {
  funnel_id: string;
  stage: string;
  context?: Record<string, unknown>;
}

export interface FunnelStats {
  total_funnels: number;
  active_funnels: number;
  total_events_today: number;
  total_dropoffs_detected: number;
  avg_conversion_rate: number;
  top_dropoff_stages: { stage: string; rate: number; count: number }[];
  alerts_pending: number;
  recovery_actions_pending: number;
}

// =====================================================
// Funnel Definition Functions
// =====================================================

export async function createFunnel(
  tenantId: string,
  input: CreateFunnelInput,
  userId?: string
): Promise<FunnelDefinition> {
  const supabase = await createClient();

  // If this is marked as primary, unset other primaries
  if (input.is_primary) {
    await supabase
      .from("synthex_library_funnel_definitions")
      .update({ is_primary: false })
      .eq("tenant_id", tenantId);
  }

  const { data, error } = await supabase
    .from("synthex_library_funnel_definitions")
    .insert({
      tenant_id: tenantId,
      funnel_name: input.funnel_name,
      funnel_description: input.funnel_description,
      funnel_type: input.funnel_type,
      stages: input.stages,
      tracking_window_days: input.tracking_window_days || 30,
      attribution_model: input.attribution_model || "first_touch",
      target_conversion_rate: input.target_conversion_rate,
      target_time_to_convert_hours: input.target_time_to_convert_hours,
      is_primary: input.is_primary || false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create funnel: ${error.message}`);
}
  return data;
}

export async function getFunnel(
  tenantId: string,
  funnelId: string
): Promise<FunnelDefinition | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_definitions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", funnelId)
    .single();

  if (error) {
return null;
}
  return data;
}

export async function listFunnels(
  tenantId: string,
  filters?: { funnel_type?: FunnelType; is_active?: boolean }
): Promise<FunnelDefinition[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_funnel_definitions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.funnel_type) {
    query = query.eq("funnel_type", filters.funnel_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list funnels: ${error.message}`);
}
  return data || [];
}

export async function updateFunnel(
  funnelId: string,
  updates: Partial<FunnelDefinition>
): Promise<FunnelDefinition> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_definitions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", funnelId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update funnel: ${error.message}`);
}
  return data;
}

export async function deleteFunnel(funnelId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_funnel_definitions")
    .delete()
    .eq("id", funnelId);

  if (error) {
throw new Error(`Failed to delete funnel: ${error.message}`);
}
}

// =====================================================
// Event Tracking Functions
// =====================================================

export async function trackEvent(
  tenantId: string,
  input: TrackEventInput
): Promise<FunnelEvent> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_events")
    .insert({
      tenant_id: tenantId,
      funnel_id: input.funnel_id,
      contact_id: input.contact_id,
      lead_id: input.lead_id,
      session_id: input.session_id,
      stage: input.stage,
      stage_position: input.stage_position,
      previous_stage: input.previous_stage,
      event_type: input.event_type || "enter",
      source: input.source,
      medium: input.medium,
      campaign: input.campaign,
      channel: input.channel,
      page_url: input.page_url,
      referrer_url: input.referrer_url,
      device_type: input.device_type,
      browser: input.browser,
      country: input.country,
      city: input.city,
      meta: input.meta || {},
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
  filters?: {
    funnel_id?: string;
    contact_id?: string;
    stage?: string;
    event_type?: EventType;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }
): Promise<FunnelEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_funnel_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.funnel_id) {
    query = query.eq("funnel_id", filters.funnel_id);
  }
  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.stage) {
    query = query.eq("stage", filters.stage);
  }
  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }
  if (filters?.from_date) {
    query = query.gte("created_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("created_at", filters.to_date);
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
// Drop-off Analysis Functions
// =====================================================

export async function analyzeDropoffs(
  tenantId: string,
  funnelId: string
): Promise<FunnelDropoff[]> {
  const supabase = await createClient();

  // Get recent events for this funnel
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: events } = await supabase
    .from("synthex_library_funnel_events")
    .select("stage, event_type")
    .eq("tenant_id", tenantId)
    .eq("funnel_id", funnelId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (!events || events.length === 0) {
    return [];
  }

  // Calculate drop-off rates per stage
  const stageStats = new Map<
    string,
    { entries: number; dropoffs: number }
  >();

  events.forEach((event) => {
    const current = stageStats.get(event.stage) || { entries: 0, dropoffs: 0 };
    if (event.event_type === "enter") {
      current.entries++;
    }
    if (event.event_type === "drop_off" || event.event_type === "exit") {
      current.dropoffs++;
    }
    stageStats.set(event.stage, current);
  });

  // Create or update dropoff records
  const dropoffs: FunnelDropoff[] = [];
  const client = getAnthropicClient();

  for (const [stage, stats] of stageStats) {
    const dropoffRate =
      stats.entries > 0 ? stats.dropoffs / stats.entries : 0;

    // Get AI recommendation if drop-off rate is significant
    let aiRecommendation = "";
    let aiConfidence = 0;
    let aiAnalysis: Record<string, unknown> = {};

    if (dropoffRate > 0.2 && client) {
      try {
        const prompt = `Analyze this funnel drop-off and provide recommendations:

Stage: ${stage}
Drop-off Rate: ${(dropoffRate * 100).toFixed(1)}%
Entries: ${stats.entries}
Drop-offs: ${stats.dropoffs}

Respond with JSON only:
{
  "recommendation": "string - specific actionable recommendation",
  "confidence": 0.0-1.0,
  "analysis": {
    "primary_reasons": ["string"],
    "suggested_actions": ["string"],
    "estimated_improvement": 0.0-1.0,
    "priority": "low|medium|high"
  }
}`;

        const response = await client.messages.create({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.content[0];
        if (content.type === "text") {
          try {
            const parsed = JSON.parse(content.text);
            aiRecommendation = parsed.recommendation || "";
            aiConfidence = parsed.confidence || 0.7;
            aiAnalysis = parsed.analysis || {};
          } catch {
            aiRecommendation = content.text;
            aiConfidence = 0.5;
          }
        }
      } catch (error) {
        console.error("[funnelService] AI analysis failed:", error);
      }
    }

    // Upsert dropoff record
    const { data, error } = await supabase
      .from("synthex_library_funnel_dropoffs")
      .upsert(
        {
          tenant_id: tenantId,
          funnel_id: funnelId,
          stage,
          dropoff_rate: dropoffRate,
          dropoff_count: stats.dropoffs,
          total_entered: stats.entries,
          is_above_threshold: dropoffRate > 0.3,
          ai_recommendation: aiRecommendation,
          ai_confidence: aiConfidence,
          ai_analysis: aiAnalysis,
          status: dropoffRate > 0.3 ? "action_recommended" : "detected",
          analysis_period_start: sevenDaysAgo.toISOString(),
          analysis_period_end: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,funnel_id,stage" }
      )
      .select()
      .single();

    if (!error && data) {
      dropoffs.push(data);
    }
  }

  return dropoffs;
}

export async function getDropoff(
  tenantId: string,
  dropoffId: string
): Promise<FunnelDropoff | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_dropoffs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", dropoffId)
    .single();

  if (error) {
return null;
}
  return data;
}

export async function listDropoffs(
  tenantId: string,
  filters?: {
    funnel_id?: string;
    status?: DropoffStatus;
    min_rate?: number;
    limit?: number;
  }
): Promise<FunnelDropoff[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_funnel_dropoffs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("dropoff_rate", { ascending: false });

  if (filters?.funnel_id) {
    query = query.eq("funnel_id", filters.funnel_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.min_rate) {
    query = query.gte("dropoff_rate", filters.min_rate);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list dropoffs: ${error.message}`);
}
  return data || [];
}

export async function updateDropoffStatus(
  dropoffId: string,
  status: DropoffStatus,
  resolution_notes?: string
): Promise<FunnelDropoff> {
  const supabase = await createClient();

  const updates: Partial<FunnelDropoff> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
    updates.resolution_notes = resolution_notes;
  }

  const { data, error } = await supabase
    .from("synthex_library_funnel_dropoffs")
    .update(updates)
    .eq("id", dropoffId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update dropoff: ${error.message}`);
}
  return data;
}

// =====================================================
// Recovery Action Functions
// =====================================================

export async function createRecoveryAction(
  tenantId: string,
  input: {
    dropoff_id?: string;
    funnel_id?: string;
    contact_id?: string;
    action_type: string;
    action_config?: Record<string, unknown>;
    action_message?: string;
    delay_hours?: number;
  }
): Promise<FunnelRecoveryAction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_recovery_actions")
    .insert({
      tenant_id: tenantId,
      dropoff_id: input.dropoff_id,
      funnel_id: input.funnel_id,
      contact_id: input.contact_id,
      action_type: input.action_type,
      action_config: input.action_config || {},
      action_message: input.action_message,
      delay_hours: input.delay_hours || 0,
      scheduled_at: input.delay_hours
        ? new Date(Date.now() + input.delay_hours * 60 * 60 * 1000).toISOString()
        : new Date().toISOString(),
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create recovery action: ${error.message}`);
}
  return data;
}

export async function listRecoveryActions(
  tenantId: string,
  filters?: {
    dropoff_id?: string;
    funnel_id?: string;
    status?: string;
    limit?: number;
  }
): Promise<FunnelRecoveryAction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_funnel_recovery_actions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.dropoff_id) {
    query = query.eq("dropoff_id", filters.dropoff_id);
  }
  if (filters?.funnel_id) {
    query = query.eq("funnel_id", filters.funnel_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list recovery actions: ${error.message}`);
}
  return data || [];
}

export async function updateRecoveryActionStatus(
  actionId: string,
  status: string,
  additionalUpdates?: Partial<FunnelRecoveryAction>
): Promise<FunnelRecoveryAction> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_recovery_actions")
    .update({ status, ...additionalUpdates })
    .eq("id", actionId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update recovery action: ${error.message}`);
}
  return data;
}

// =====================================================
// Alert Functions
// =====================================================

export async function listAlerts(
  tenantId: string,
  filters?: {
    funnel_id?: string;
    status?: AlertStatus;
    severity?: AlertSeverity;
    limit?: number;
  }
): Promise<FunnelAlert[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_funnel_alerts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.funnel_id) {
    query = query.eq("funnel_id", filters.funnel_id);
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
throw new Error(`Failed to list alerts: ${error.message}`);
}
  return data || [];
}

export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<FunnelAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_alerts")
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
  userId: string,
  resolution_notes?: string
): Promise<FunnelAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_alerts")
    .update({
      status: "resolved",
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes,
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
// Metrics Functions
// =====================================================

export async function getFunnelMetrics(
  tenantId: string,
  funnelId: string,
  periodType: string = "daily",
  limit: number = 30
): Promise<FunnelMetrics[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_funnel_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("funnel_id", funnelId)
    .eq("period_type", periodType)
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) {
throw new Error(`Failed to get metrics: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Statistics Functions
// =====================================================

export async function getFunnelStats(tenantId: string): Promise<FunnelStats> {
  const supabase = await createClient();

  // Get funnel counts
  const { data: funnels } = await supabase
    .from("synthex_library_funnel_definitions")
    .select("id, is_active")
    .eq("tenant_id", tenantId);

  // Get today's events
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayEvents } = await supabase
    .from("synthex_library_funnel_events")
    .select("id")
    .eq("tenant_id", tenantId)
    .gte("created_at", todayStart.toISOString());

  // Get dropoffs
  const { data: dropoffs } = await supabase
    .from("synthex_library_funnel_dropoffs")
    .select("stage, dropoff_rate, dropoff_count")
    .eq("tenant_id", tenantId)
    .order("dropoff_rate", { ascending: false })
    .limit(5);

  // Get pending alerts
  const { data: alerts } = await supabase
    .from("synthex_library_funnel_alerts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "new");

  // Get pending recovery actions
  const { data: recoveryActions } = await supabase
    .from("synthex_library_funnel_recovery_actions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "scheduled");

  const totalFunnels = funnels?.length || 0;
  const activeFunnels = funnels?.filter((f) => f.is_active).length || 0;

  return {
    total_funnels: totalFunnels,
    active_funnels: activeFunnels,
    total_events_today: todayEvents?.length || 0,
    total_dropoffs_detected: dropoffs?.length || 0,
    avg_conversion_rate: 0, // Would calculate from metrics
    top_dropoff_stages: (dropoffs || []).map((d) => ({
      stage: d.stage,
      rate: d.dropoff_rate,
      count: d.dropoff_count,
    })),
    alerts_pending: alerts?.length || 0,
    recovery_actions_pending: recoveryActions?.length || 0,
  };
}

// =====================================================
// Initialization
// =====================================================

export async function initializeDefaultFunnels(
  tenantId: string,
  userId?: string
): Promise<void> {
  const supabase = await createClient();

  const defaultFunnels = [
    {
      funnel_name: "Sales Funnel",
      funnel_description: "Standard sales funnel from awareness to purchase",
      funnel_type: "sales",
      stages: [
        { id: "awareness", name: "Awareness", position: 1, expected_conversion: 0.5 },
        { id: "interest", name: "Interest", position: 2, expected_conversion: 0.4 },
        { id: "consideration", name: "Consideration", position: 3, expected_conversion: 0.3 },
        { id: "intent", name: "Intent", position: 4, expected_conversion: 0.25 },
        { id: "evaluation", name: "Evaluation", position: 5, expected_conversion: 0.2 },
        { id: "purchase", name: "Purchase", position: 6, expected_conversion: 0.15 },
      ],
      is_primary: true,
    },
    {
      funnel_name: "Signup Funnel",
      funnel_description: "User registration and activation flow",
      funnel_type: "signup",
      stages: [
        { id: "landing", name: "Landing Page", position: 1, expected_conversion: 0.6 },
        { id: "signup_start", name: "Signup Started", position: 2, expected_conversion: 0.5 },
        { id: "email_verified", name: "Email Verified", position: 3, expected_conversion: 0.8 },
        { id: "profile_complete", name: "Profile Complete", position: 4, expected_conversion: 0.7 },
        { id: "first_action", name: "First Action", position: 5, expected_conversion: 0.6 },
      ],
      is_primary: false,
    },
    {
      funnel_name: "Checkout Funnel",
      funnel_description: "E-commerce checkout flow",
      funnel_type: "checkout",
      stages: [
        { id: "cart", name: "Add to Cart", position: 1, expected_conversion: 0.7 },
        { id: "checkout_start", name: "Checkout Started", position: 2, expected_conversion: 0.6 },
        { id: "shipping", name: "Shipping Info", position: 3, expected_conversion: 0.8 },
        { id: "payment", name: "Payment", position: 4, expected_conversion: 0.85 },
        { id: "confirmation", name: "Order Confirmed", position: 5, expected_conversion: 0.95 },
      ],
      is_primary: false,
    },
  ];

  for (const funnel of defaultFunnels) {
    const { data: existing } = await supabase
      .from("synthex_library_funnel_definitions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("funnel_name", funnel.funnel_name)
      .single();

    if (!existing) {
      await supabase.from("synthex_library_funnel_definitions").insert({
        tenant_id: tenantId,
        ...funnel,
        created_by: userId,
      });
    }
  }
}
