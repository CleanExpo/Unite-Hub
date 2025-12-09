/**
 * Synthex Revenue Routing Service
 * Phase D20: Multi-Channel Revenue Routing Engine
 *
 * AI-powered revenue tracking with multi-channel attribution,
 * routing rules, and optimization recommendations.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// Lazy Anthropic Client with Circuit Breaker
// =====================================================
let anthropicClient: Anthropic | null = null;
let lastFailure: number = 0;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds

function getAnthropicClient(): Anthropic | null {
  if (Date.now() - lastFailure < CIRCUIT_BREAKER_TIMEOUT) {
    return null;
  }
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================
export type EventType =
  | "sale"
  | "subscription"
  | "renewal"
  | "upsell"
  | "cross_sell"
  | "refund"
  | "chargeback"
  | "credit"
  | "adjustment";

export type AttributionModel =
  | "first_touch"
  | "last_touch"
  | "linear"
  | "time_decay"
  | "position_based";

export type RoutingAction =
  | "route"
  | "boost"
  | "throttle"
  | "allocate"
  | "alert"
  | "optimize";

export type AlertType =
  | "revenue_spike"
  | "revenue_drop"
  | "channel_anomaly"
  | "high_value_transaction"
  | "refund_spike"
  | "attribution_issue"
  | "forecast_miss"
  | "opportunity";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus =
  | "new"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "dismissed";

export interface RevenueEvent {
  id: string;
  tenant_id: string;
  event_type: EventType;
  external_id: string | null;
  amount: number;
  currency: string;
  amount_usd: number | null;
  channel: string;
  source: string | null;
  medium: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  lead_id: string | null;
  contact_id: string | null;
  customer_id: string | null;
  is_new_customer: boolean;
  product_id: string | null;
  product_name: string | null;
  product_category: string | null;
  quantity: number;
  unit_price: number | null;
  attribution_model: AttributionModel;
  attribution_weight: number;
  touchpoints: Array<{
    channel: string;
    source?: string;
    timestamp: string;
    weight?: number;
  }>;
  cost_of_goods: number | null;
  gross_margin: number | null;
  acquisition_cost: number | null;
  occurred_at: string;
  first_touch_at: string | null;
  days_to_convert: number | null;
  predicted_ltv: number | null;
  churn_risk: number | null;
  ai_insights: Record<string, unknown>;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: string;
}

export interface RevenueRouting {
  id: string;
  tenant_id: string;
  rule_name: string;
  description: string | null;
  source_channels: string[];
  target_channel: string | null;
  action: RoutingAction;
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  min_revenue: number | null;
  min_events: number | null;
  priority: number;
  boost_factor: number;
  allocation_percent: number | null;
  active_days: string[];
  active_hours: { start?: number; end?: number };
  effective_from: string | null;
  effective_until: string | null;
  is_active: boolean;
  is_automated: boolean;
  times_triggered: number;
  total_revenue_impacted: number;
  last_triggered_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ChannelPerformance {
  id: string;
  tenant_id: string;
  channel: string;
  source: string | null;
  period_type: "daily" | "weekly" | "monthly";
  period_start: string;
  period_end: string;
  event_count: number;
  unique_customers: number;
  new_customers: number;
  total_revenue: number;
  avg_order_value: number | null;
  revenue_per_customer: number | null;
  acquisition_cost: number | null;
  cost_per_acquisition: number | null;
  marketing_spend: number | null;
  roas: number | null;
  roi: number | null;
  conversion_rate: number | null;
  margin_rate: number | null;
  revenue_change_percent: number | null;
  event_change_percent: number | null;
  rank_by_revenue: number | null;
  rank_by_efficiency: number | null;
  ai_score: number | null;
  ai_recommendations: string[];
  ai_prediction_next_period: number | null;
  created_at: string;
}

export interface AttributionPath {
  id: string;
  tenant_id: string;
  path_hash: string;
  path_sequence: string[];
  occurrence_count: number;
  total_revenue: number;
  avg_revenue: number | null;
  conversion_rate: number | null;
  avg_path_length_days: number | null;
  avg_touchpoint_count: number | null;
  first_touch_channel: string | null;
  last_touch_channel: string | null;
  converting_channel: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  path_score: number | null;
  is_optimal: boolean;
  created_at: string;
}

export interface RevenueForecast {
  id: string;
  tenant_id: string;
  channel: string | null;
  forecast_type: "daily" | "weekly" | "monthly" | "quarterly";
  forecast_date: string;
  horizon_days: number;
  predicted_revenue: number;
  predicted_events: number | null;
  confidence_lower: number | null;
  confidence_upper: number | null;
  confidence_level: number;
  contributing_factors: Array<{
    factor: string;
    weight: number;
    direction: "positive" | "negative";
  }>;
  seasonality_adjustment: number | null;
  trend_adjustment: number | null;
  ai_model: string | null;
  model_version: string | null;
  model_accuracy: number | null;
  actual_revenue: number | null;
  actual_events: number | null;
  forecast_error: number | null;
  was_accurate: boolean | null;
  created_at: string;
}

export interface RevenueAlert {
  id: string;
  tenant_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  channel: string | null;
  revenue_event_id: string | null;
  metric_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  change_percent: number | null;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// Revenue Events
// =====================================================
export async function recordRevenueEvent(
  tenantId: string,
  data: {
    event_type: EventType;
    amount: number;
    channel: string;
    external_id?: string;
    currency?: string;
    source?: string;
    medium?: string;
    campaign_id?: string;
    campaign_name?: string;
    lead_id?: string;
    contact_id?: string;
    customer_id?: string;
    is_new_customer?: boolean;
    product_id?: string;
    product_name?: string;
    product_category?: string;
    quantity?: number;
    unit_price?: number;
    attribution_model?: AttributionModel;
    touchpoints?: RevenueEvent["touchpoints"];
    cost_of_goods?: number;
    acquisition_cost?: number;
    first_touch_at?: string;
    tags?: string[];
    meta?: Record<string, unknown>;
  }
): Promise<RevenueEvent> {
  const supabase = await createClient();

  // Calculate derived fields
  const grossMargin = data.cost_of_goods
    ? data.amount - data.cost_of_goods
    : null;

  const firstTouchAt = data.first_touch_at
    ? new Date(data.first_touch_at)
    : null;
  const daysToConvert = firstTouchAt
    ? Math.floor(
        (Date.now() - firstTouchAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const { data: event, error } = await supabase
    .from("synthex_library_revenue_events")
    .insert({
      tenant_id: tenantId,
      event_type: data.event_type,
      external_id: data.external_id,
      amount: data.amount,
      currency: data.currency || "AUD",
      channel: data.channel,
      source: data.source,
      medium: data.medium,
      campaign_id: data.campaign_id,
      campaign_name: data.campaign_name,
      lead_id: data.lead_id,
      contact_id: data.contact_id,
      customer_id: data.customer_id,
      is_new_customer: data.is_new_customer ?? true,
      product_id: data.product_id,
      product_name: data.product_name,
      product_category: data.product_category,
      quantity: data.quantity || 1,
      unit_price: data.unit_price,
      attribution_model: data.attribution_model || "last_touch",
      touchpoints: data.touchpoints || [],
      cost_of_goods: data.cost_of_goods,
      gross_margin: grossMargin,
      acquisition_cost: data.acquisition_cost,
      first_touch_at: data.first_touch_at,
      days_to_convert: daysToConvert,
      tags: data.tags || [],
      meta: data.meta || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record revenue event: ${error.message}`);
}

  // Process routing rules asynchronously
  processRoutingRules(tenantId, event).catch(console.error);

  return event;
}

export async function listRevenueEvents(
  tenantId: string,
  filters?: {
    event_type?: EventType;
    channel?: string;
    source?: string;
    customer_id?: string;
    lead_id?: string;
    min_amount?: number;
    max_amount?: number;
    from_date?: string;
    to_date?: string;
    limit?: number;
    offset?: number;
  }
): Promise<RevenueEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_revenue_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false });

  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type);
  }
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.source) {
    query = query.eq("source", filters.source);
  }
  if (filters?.customer_id) {
    query = query.eq("customer_id", filters.customer_id);
  }
  if (filters?.lead_id) {
    query = query.eq("lead_id", filters.lead_id);
  }
  if (filters?.min_amount !== undefined) {
    query = query.gte("amount", filters.min_amount);
  }
  if (filters?.max_amount !== undefined) {
    query = query.lte("amount", filters.max_amount);
  }
  if (filters?.from_date) {
    query = query.gte("occurred_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("occurred_at", filters.to_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list revenue events: ${error.message}`);
}
  return data || [];
}

export async function getRevenueEventById(
  tenantId: string,
  eventId: string
): Promise<RevenueEvent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_revenue_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", eventId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get revenue event: ${error.message}`);
  }

  return data;
}

// =====================================================
// Revenue Routing Rules
// =====================================================
export async function createRoutingRule(
  tenantId: string,
  data: {
    rule_name: string;
    description?: string;
    source_channels: string[];
    target_channel?: string;
    action: RoutingAction;
    conditions?: RevenueRouting["conditions"];
    min_revenue?: number;
    min_events?: number;
    priority?: number;
    boost_factor?: number;
    allocation_percent?: number;
    active_days?: string[];
    active_hours?: RevenueRouting["active_hours"];
    effective_from?: string;
    effective_until?: string;
    is_automated?: boolean;
  },
  userId?: string
): Promise<RevenueRouting> {
  const supabase = await createClient();

  const { data: rule, error } = await supabase
    .from("synthex_library_revenue_routing")
    .insert({
      tenant_id: tenantId,
      rule_name: data.rule_name,
      description: data.description,
      source_channels: data.source_channels,
      target_channel: data.target_channel,
      action: data.action,
      conditions: data.conditions || [],
      min_revenue: data.min_revenue,
      min_events: data.min_events,
      priority: data.priority || 1,
      boost_factor: data.boost_factor || 1.0,
      allocation_percent: data.allocation_percent,
      active_days: data.active_days || [],
      active_hours: data.active_hours || {},
      effective_from: data.effective_from,
      effective_until: data.effective_until,
      is_automated: data.is_automated ?? false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create routing rule: ${error.message}`);
}
  return rule;
}

export async function listRoutingRules(
  tenantId: string,
  filters?: {
    action?: RoutingAction;
    channel?: string;
    is_active?: boolean;
    is_automated?: boolean;
  }
): Promise<RevenueRouting[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_revenue_routing")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.channel) {
    query = query.contains("source_channels", [filters.channel]);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_automated !== undefined) {
    query = query.eq("is_automated", filters.is_automated);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list routing rules: ${error.message}`);
}
  return data || [];
}

export async function updateRoutingRule(
  ruleId: string,
  updates: Partial<Omit<RevenueRouting, "id" | "tenant_id" | "created_at">>
): Promise<RevenueRouting> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_revenue_routing")
    .update(updates)
    .eq("id", ruleId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update routing rule: ${error.message}`);
}
  return data;
}

export async function deleteRoutingRule(ruleId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_revenue_routing")
    .delete()
    .eq("id", ruleId);

  if (error) {
throw new Error(`Failed to delete routing rule: ${error.message}`);
}
}

async function processRoutingRules(
  tenantId: string,
  event: RevenueEvent
): Promise<void> {
  const rules = await listRoutingRules(tenantId, { is_active: true });

  for (const rule of rules) {
    if (!rule.source_channels.includes(event.channel)) {
continue;
}

    // Check conditions
    const conditionsMet = evaluateConditions(rule.conditions, event);
    if (!conditionsMet) {
continue;
}

    // Check time constraints
    if (!isRuleActiveNow(rule)) {
continue;
}

    // Execute action
    await executeRoutingAction(tenantId, rule, event);
  }
}

function evaluateConditions(
  conditions: RevenueRouting["conditions"],
  event: RevenueEvent
): boolean {
  if (!conditions || conditions.length === 0) {
return true;
}

  return conditions.every((condition) => {
    const value = (event as Record<string, unknown>)[condition.field];

    switch (condition.operator) {
      case "eq":
      case "equals":
        return value === condition.value;
      case "neq":
      case "not_equals":
        return value !== condition.value;
      case "gt":
      case "greater_than":
        return typeof value === "number" && value > (condition.value as number);
      case "gte":
      case "greater_than_or_equal":
        return typeof value === "number" && value >= (condition.value as number);
      case "lt":
      case "less_than":
        return typeof value === "number" && value < (condition.value as number);
      case "lte":
      case "less_than_or_equal":
        return typeof value === "number" && value <= (condition.value as number);
      case "contains":
        return (
          typeof value === "string" &&
          value.includes(condition.value as string)
        );
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return true;
    }
  });
}

function isRuleActiveNow(rule: RevenueRouting): boolean {
  const now = new Date();

  // Check effective dates
  if (rule.effective_from && new Date(rule.effective_from) > now) {
return false;
}
  if (rule.effective_until && new Date(rule.effective_until) < now) {
return false;
}

  // Check active days
  if (rule.active_days && rule.active_days.length > 0) {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const today = days[now.getDay()];
    if (!rule.active_days.includes(today)) {
return false;
}
  }

  // Check active hours
  if (rule.active_hours?.start !== undefined && rule.active_hours?.end !== undefined) {
    const hour = now.getHours();
    if (hour < rule.active_hours.start || hour >= rule.active_hours.end) {
      return false;
    }
  }

  return true;
}

async function executeRoutingAction(
  tenantId: string,
  rule: RevenueRouting,
  event: RevenueEvent
): Promise<void> {
  const supabase = await createClient();

  // Update rule stats
  await supabase
    .from("synthex_library_revenue_routing")
    .update({
      times_triggered: rule.times_triggered + 1,
      total_revenue_impacted: rule.total_revenue_impacted + event.amount,
      last_triggered_at: new Date().toISOString(),
    })
    .eq("id", rule.id);

  // Execute action based on type
  switch (rule.action) {
    case "alert":
      await createRevenueAlert(tenantId, {
        alert_type: "high_value_transaction",
        severity: event.amount > 10000 ? "high" : "medium",
        title: `Routing Rule Triggered: ${rule.rule_name}`,
        description: `${rule.description || rule.rule_name} triggered for ${event.channel} channel`,
        channel: event.channel,
        revenue_event_id: event.id,
        metric_value: event.amount,
      });
      break;
    case "boost":
      // Store boost factor in event meta for downstream processing
      await supabase
        .from("synthex_library_revenue_events")
        .update({
          meta: {
            ...event.meta,
            boost_factor: rule.boost_factor,
            boosted_by_rule: rule.id,
          },
        })
        .eq("id", event.id);
      break;
    // Other actions can be implemented as needed
  }
}

// =====================================================
// Channel Performance
// =====================================================
export async function getChannelPerformance(
  tenantId: string,
  filters?: {
    channel?: string;
    source?: string;
    period_type?: "daily" | "weekly" | "monthly";
    from_date?: string;
    to_date?: string;
    limit?: number;
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
  if (filters?.source) {
    query = query.eq("source", filters.source);
  }
  if (filters?.period_type) {
    query = query.eq("period_type", filters.period_type);
  }
  if (filters?.from_date) {
    query = query.gte("period_start", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("period_end", filters.to_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to get channel performance: ${error.message}`);
}
  return data || [];
}

export async function calculateChannelPerformance(
  tenantId: string,
  channel: string,
  periodType: "daily" | "weekly" | "monthly",
  periodStart: Date,
  periodEnd: Date
): Promise<ChannelPerformance> {
  const supabase = await createClient();

  // Get events for the period
  const { data: events, error: eventsError } = await supabase
    .from("synthex_library_revenue_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("channel", channel)
    .gte("occurred_at", periodStart.toISOString())
    .lte("occurred_at", periodEnd.toISOString());

  if (eventsError) {
throw new Error(`Failed to fetch events: ${eventsError.message}`);
}

  const eventList = events || [];

  // Calculate metrics
  const totalRevenue = eventList.reduce((sum, e) => sum + (e.amount || 0), 0);
  const eventCount = eventList.length;
  const uniqueCustomers = new Set(eventList.map((e) => e.customer_id).filter(Boolean)).size;
  const newCustomers = eventList.filter((e) => e.is_new_customer).length;
  const avgOrderValue = eventCount > 0 ? totalRevenue / eventCount : null;
  const revenuePerCustomer = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : null;

  // Get previous period for comparison
  const periodDuration = periodEnd.getTime() - periodStart.getTime();
  const prevPeriodStart = new Date(periodStart.getTime() - periodDuration);
  const prevPeriodEnd = new Date(periodEnd.getTime() - periodDuration);

  const { data: prevEvents } = await supabase
    .from("synthex_library_revenue_events")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("channel", channel)
    .gte("occurred_at", prevPeriodStart.toISOString())
    .lte("occurred_at", prevPeriodEnd.toISOString());

  const prevRevenue = (prevEvents || []).reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const prevEventCount = (prevEvents || []).length;

  const revenueChangePercent =
    prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : null;
  const eventChangePercent =
    prevEventCount > 0
      ? ((eventCount - prevEventCount) / prevEventCount) * 100
      : null;

  // Upsert performance record
  const { data: performance, error } = await supabase
    .from("synthex_library_channel_performance")
    .upsert(
      {
        tenant_id: tenantId,
        channel,
        period_type: periodType,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        event_count: eventCount,
        unique_customers: uniqueCustomers,
        new_customers: newCustomers,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        revenue_per_customer: revenuePerCustomer,
        revenue_change_percent: revenueChangePercent,
        event_change_percent: eventChangePercent,
      },
      {
        onConflict: "tenant_id,channel,period_type,period_start",
      }
    )
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save channel performance: ${error.message}`);
}
  return performance;
}

// =====================================================
// Attribution Paths
// =====================================================
export async function getAttributionPaths(
  tenantId: string,
  filters?: {
    first_touch_channel?: string;
    last_touch_channel?: string;
    min_occurrences?: number;
    period_type?: string;
    limit?: number;
  }
): Promise<AttributionPath[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_attribution_paths")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("total_revenue", { ascending: false });

  if (filters?.first_touch_channel) {
    query = query.eq("first_touch_channel", filters.first_touch_channel);
  }
  if (filters?.last_touch_channel) {
    query = query.eq("last_touch_channel", filters.last_touch_channel);
  }
  if (filters?.min_occurrences) {
    query = query.gte("occurrence_count", filters.min_occurrences);
  }
  if (filters?.period_type) {
    query = query.eq("period_type", filters.period_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to get attribution paths: ${error.message}`);
}
  return data || [];
}

export async function analyzeAttributionPath(
  tenantId: string,
  pathSequence: string[]
): Promise<{
  path: AttributionPath | null;
  recommendation: string;
  optimal_path: string[] | null;
}> {
  const supabase = await createClient();

  // Create hash for path lookup
  const pathHash = pathSequence.join("->").toLowerCase();

  // Find existing path
  const { data: existingPath } = await supabase
    .from("synthex_library_attribution_paths")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("path_hash", pathHash)
    .single();

  // Get optimal paths for comparison
  const { data: optimalPaths } = await supabase
    .from("synthex_library_attribution_paths")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_optimal", true)
    .order("total_revenue", { ascending: false })
    .limit(3);

  // Generate AI recommendation
  const client = getAnthropicClient();
  let recommendation = "Unable to generate recommendation.";
  let optimalPath: string[] | null = null;

  if (client) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Analyze this customer journey attribution path and provide a brief recommendation:

Current Path: ${pathSequence.join(" → ")}
${existingPath ? `Path Revenue: $${existingPath.total_revenue}, Conversion Rate: ${(existingPath.conversion_rate || 0) * 100}%` : "No historical data for this path"}

Top Performing Paths:
${
  optimalPaths
    ?.map(
      (p) =>
        `- ${p.path_sequence.join(" → ")}: $${p.total_revenue}, ${((p.conversion_rate || 0) * 100).toFixed(1)}% conversion`
    )
    .join("\n") || "No optimal paths identified yet"
}

Provide a 2-3 sentence recommendation for optimizing this customer journey.`,
          },
        ],
      });

      recommendation =
        response.content[0].type === "text"
          ? response.content[0].text
          : recommendation;

      if (optimalPaths && optimalPaths.length > 0) {
        optimalPath = optimalPaths[0].path_sequence;
      }
    } catch (error) {
      lastFailure = Date.now();
      console.error("AI attribution analysis failed:", error);
    }
  }

  return {
    path: existingPath,
    recommendation,
    optimal_path: optimalPath,
  };
}

// =====================================================
// Revenue Forecasts
// =====================================================
export async function getForecasts(
  tenantId: string,
  filters?: {
    channel?: string;
    forecast_type?: "daily" | "weekly" | "monthly" | "quarterly";
    from_date?: string;
    include_actuals?: boolean;
    limit?: number;
  }
): Promise<RevenueForecast[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_revenue_forecasts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("forecast_date", { ascending: false });

  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.forecast_type) {
    query = query.eq("forecast_type", filters.forecast_type);
  }
  if (filters?.from_date) {
    query = query.gte("forecast_date", filters.from_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to get forecasts: ${error.message}`);
}
  return data || [];
}

export async function generateRevenueForecast(
  tenantId: string,
  options: {
    channel?: string;
    forecast_type: "daily" | "weekly" | "monthly" | "quarterly";
    horizon_days: number;
  }
): Promise<RevenueForecast> {
  const supabase = await createClient();

  // Get historical data
  const lookbackDays = options.horizon_days * 4;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  let query = supabase
    .from("synthex_library_revenue_events")
    .select("amount, occurred_at, channel")
    .eq("tenant_id", tenantId)
    .gte("occurred_at", lookbackDate.toISOString())
    .in("event_type", ["sale", "subscription", "renewal", "upsell", "cross_sell"]);

  if (options.channel) {
    query = query.eq("channel", options.channel);
  }

  const { data: events, error: eventsError } = await query;

  if (eventsError) {
throw new Error(`Failed to fetch historical data: ${eventsError.message}`);
}

  const eventList = events || [];
  const totalHistoricalRevenue = eventList.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );
  const avgDailyRevenue = totalHistoricalRevenue / lookbackDays;

  // Simple trend calculation
  const midpoint = Math.floor(eventList.length / 2);
  const firstHalf = eventList.slice(0, midpoint);
  const secondHalf = eventList.slice(midpoint);

  const firstHalfRevenue = firstHalf.reduce((sum, e) => sum + (e.amount || 0), 0);
  const secondHalfRevenue = secondHalf.reduce((sum, e) => sum + (e.amount || 0), 0);

  const trendAdjustment =
    firstHalfRevenue > 0
      ? (secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue
      : 0;

  // Calculate forecast
  const predictedRevenue = avgDailyRevenue * options.horizon_days * (1 + trendAdjustment);
  const confidence = 0.85;
  const marginOfError = predictedRevenue * (1 - confidence);

  // Use AI for enhanced prediction
  const client = getAnthropicClient();
  let contributingFactors: RevenueForecast["contributing_factors"] = [
    { factor: "historical_average", weight: 0.6, direction: "positive" },
    {
      factor: "trend",
      weight: 0.4,
      direction: trendAdjustment >= 0 ? "positive" : "negative",
    },
  ];

  if (client && eventList.length > 10) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Based on this revenue data, identify 2-3 key factors affecting the forecast:

Historical Revenue: $${totalHistoricalRevenue.toFixed(2)} over ${lookbackDays} days
Daily Average: $${avgDailyRevenue.toFixed(2)}
Trend: ${(trendAdjustment * 100).toFixed(1)}%
Channel: ${options.channel || "All channels"}

Respond with JSON only: [{"factor": "name", "weight": 0.0-1.0, "direction": "positive"|"negative"}]`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        contributingFactors = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      lastFailure = Date.now();
      console.error("AI forecast analysis failed:", error);
    }
  }

  // Save forecast
  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + options.horizon_days);

  const { data: forecast, error } = await supabase
    .from("synthex_library_revenue_forecasts")
    .insert({
      tenant_id: tenantId,
      channel: options.channel,
      forecast_type: options.forecast_type,
      forecast_date: forecastDate.toISOString(),
      horizon_days: options.horizon_days,
      predicted_revenue: Math.round(predictedRevenue * 100) / 100,
      predicted_events: Math.round(eventList.length * (options.horizon_days / lookbackDays)),
      confidence_lower: Math.round((predictedRevenue - marginOfError) * 100) / 100,
      confidence_upper: Math.round((predictedRevenue + marginOfError) * 100) / 100,
      confidence_level: confidence,
      contributing_factors: contributingFactors,
      trend_adjustment: trendAdjustment,
      ai_model: client ? "claude-sonnet-4-5-20250514" : null,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save forecast: ${error.message}`);
}
  return forecast;
}

// =====================================================
// Revenue Alerts
// =====================================================
export async function createRevenueAlert(
  tenantId: string,
  data: {
    alert_type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    channel?: string;
    revenue_event_id?: string;
    metric_name?: string;
    metric_value?: number;
    threshold_value?: number;
    change_percent?: number;
    meta?: Record<string, unknown>;
  }
): Promise<RevenueAlert> {
  const supabase = await createClient();

  const { data: alert, error } = await supabase
    .from("synthex_library_revenue_alerts")
    .insert({
      tenant_id: tenantId,
      alert_type: data.alert_type,
      severity: data.severity,
      title: data.title,
      description: data.description,
      channel: data.channel,
      revenue_event_id: data.revenue_event_id,
      metric_name: data.metric_name,
      metric_value: data.metric_value,
      threshold_value: data.threshold_value,
      change_percent: data.change_percent,
      meta: data.meta || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create revenue alert: ${error.message}`);
}
  return alert;
}

export async function listRevenueAlerts(
  tenantId: string,
  filters?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    alert_type?: AlertType;
    channel?: string;
    limit?: number;
  }
): Promise<RevenueAlert[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_revenue_alerts")
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
  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list revenue alerts: ${error.message}`);
}
  return data || [];
}

export async function acknowledgeRevenueAlert(
  alertId: string,
  userId: string
): Promise<RevenueAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_revenue_alerts")
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

export async function resolveRevenueAlert(
  alertId: string,
  userId: string,
  notes?: string
): Promise<RevenueAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_revenue_alerts")
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
throw new Error(`Failed to resolve alert: ${error.message}`);
}
  return data;
}

// =====================================================
// Revenue Statistics
// =====================================================
export async function getRevenueStats(
  tenantId: string,
  options?: {
    from_date?: string;
    to_date?: string;
    channel?: string;
  }
): Promise<{
  total_revenue: number;
  event_count: number;
  avg_order_value: number;
  new_customer_revenue: number;
  returning_customer_revenue: number;
  channel_breakdown: Record<string, number>;
  event_type_breakdown: Record<string, number>;
  top_products: Array<{ product_name: string; revenue: number; count: number }>;
  alerts_summary: { new: number; acknowledged: number; critical: number };
}> {
  const supabase = await createClient();

  // Build date filters
  const fromDate = options?.from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toDate = options?.to_date || new Date().toISOString();

  let eventsQuery = supabase
    .from("synthex_library_revenue_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("occurred_at", fromDate)
    .lte("occurred_at", toDate)
    .in("event_type", ["sale", "subscription", "renewal", "upsell", "cross_sell"]);

  if (options?.channel) {
    eventsQuery = eventsQuery.eq("channel", options.channel);
  }

  const { data: events, error: eventsError } = await eventsQuery;

  if (eventsError) {
throw new Error(`Failed to fetch revenue stats: ${eventsError.message}`);
}

  const eventList = events || [];

  // Calculate metrics
  const totalRevenue = eventList.reduce((sum, e) => sum + (e.amount || 0), 0);
  const eventCount = eventList.length;
  const avgOrderValue = eventCount > 0 ? totalRevenue / eventCount : 0;

  const newCustomerRevenue = eventList
    .filter((e) => e.is_new_customer)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const returningCustomerRevenue = totalRevenue - newCustomerRevenue;

  // Channel breakdown
  const channelBreakdown: Record<string, number> = {};
  eventList.forEach((e) => {
    channelBreakdown[e.channel] = (channelBreakdown[e.channel] || 0) + e.amount;
  });

  // Event type breakdown
  const eventTypeBreakdown: Record<string, number> = {};
  eventList.forEach((e) => {
    eventTypeBreakdown[e.event_type] = (eventTypeBreakdown[e.event_type] || 0) + e.amount;
  });

  // Top products
  const productMap = new Map<string, { revenue: number; count: number }>();
  eventList.forEach((e) => {
    if (e.product_name) {
      const current = productMap.get(e.product_name) || { revenue: 0, count: 0 };
      productMap.set(e.product_name, {
        revenue: current.revenue + e.amount,
        count: current.count + 1,
      });
    }
  });

  const topProducts = Array.from(productMap.entries())
    .map(([product_name, { revenue, count }]) => ({ product_name, revenue, count }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Alerts summary
  const { data: alerts } = await supabase
    .from("synthex_library_revenue_alerts")
    .select("status, severity")
    .eq("tenant_id", tenantId)
    .in("status", ["new", "acknowledged"]);

  const alertsSummary = {
    new: (alerts || []).filter((a) => a.status === "new").length,
    acknowledged: (alerts || []).filter((a) => a.status === "acknowledged").length,
    critical: (alerts || []).filter((a) => a.severity === "critical").length,
  };

  return {
    total_revenue: totalRevenue,
    event_count: eventCount,
    avg_order_value: avgOrderValue,
    new_customer_revenue: newCustomerRevenue,
    returning_customer_revenue: returningCustomerRevenue,
    channel_breakdown: channelBreakdown,
    event_type_breakdown: eventTypeBreakdown,
    top_products: topProducts,
    alerts_summary: alertsSummary,
  };
}
