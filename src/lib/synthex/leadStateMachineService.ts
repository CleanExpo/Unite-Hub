/**
 * Synthex Lead State Machine Service
 * Phase D19: Autonomous Lead Lifecycle Management
 *
 * AI-powered lead state tracking with automatic transitions,
 * confidence scoring, and lifecycle analytics.
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

export type LeadStateKey =
  | "new"
  | "contacted"
  | "engaged"
  | "qualified"
  | "proposal_sent"
  | "negotiating"
  | "won"
  | "lost"
  | "churned"
  | "reactivated"
  | "dormant";

export type EngagementLevel = "cold" | "warming" | "warm" | "hot" | "on_fire";

export type TransitionType =
  | "manual"
  | "automatic"
  | "ai_triggered"
  | "rule_based"
  | "time_based"
  | "event_based";

export interface LeadState {
  id: string;
  tenant_id: string;
  lead_id: string;
  contact_id: string | null;
  current_state: LeadStateKey;
  previous_state: string | null;
  state_score: number | null;
  entered_at: string;
  entered_reason: string | null;
  entered_by: string | null;
  time_in_state_seconds: number | null;
  expected_transition_at: string | null;
  engagement_level: EngagementLevel | null;
  last_activity_at: string | null;
  activity_count: number;
  estimated_value: number | null;
  currency: string;
  probability: number | null;
  next_best_action: string | null;
  predicted_next_state: string | null;
  prediction_confidence: number | null;
  ai_reasoning: string | null;
  ai_model: string | null;
  predicted_at: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StateTransition {
  id: string;
  tenant_id: string;
  lead_id: string;
  lead_state_id: string | null;
  from_state: string | null;
  to_state: string;
  transition_type: TransitionType;
  reason: string | null;
  trigger_event: string | null;
  trigger_data: Record<string, unknown>;
  confidence: number;
  ai_model: string | null;
  ai_reasoning: string | null;
  triggered_by: string | null;
  user_id: string | null;
  duration_in_previous_state_seconds: number | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface StateDefinition {
  id: string;
  tenant_id: string;
  state_key: string;
  display_name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  stage_order: number;
  stage_group: string | null;
  is_terminal: boolean;
  is_active: boolean;
  auto_transition_rules: unknown[];
  required_actions: string[] | null;
  min_time_in_state_hours: number | null;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
  notification_channels: string[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TransitionRule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  from_state: string;
  to_state: string;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  use_ai_validation: boolean;
  ai_confidence_threshold: number;
  priority: number;
  is_active: boolean;
  cooldown_hours: number;
  actions_on_transition: unknown[];
  times_triggered: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StateMetric {
  id: string;
  tenant_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  state_distribution: Record<string, number>;
  total_leads: number;
  transitions_count: number;
  transitions_by_type: Record<string, number>;
  avg_time_to_qualified_hours: number | null;
  avg_time_to_won_hours: number | null;
  avg_time_in_each_state: Record<string, number>;
  new_to_qualified_rate: number | null;
  qualified_to_won_rate: number | null;
  overall_conversion_rate: number | null;
  total_pipeline_value: number | null;
  weighted_pipeline_value: number | null;
  avg_deal_size: number | null;
  ai_summary: string | null;
  ai_recommendations: string[] | null;
  created_at: string;
}

export interface StateAlert {
  id: string;
  tenant_id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  lead_id: string | null;
  lead_state_id: string | null;
  transition_id: string | null;
  metric_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

// State probability mapping
const STATE_PROBABILITY: Record<LeadStateKey, number> = {
  new: 0.05,
  contacted: 0.1,
  engaged: 0.2,
  qualified: 0.4,
  proposal_sent: 0.6,
  negotiating: 0.8,
  won: 1.0,
  lost: 0.0,
  churned: 0.0,
  reactivated: 0.15,
  dormant: 0.02,
};

// =====================================================
// Lead State Functions
// =====================================================

export async function getLeadState(
  tenantId: string,
  leadId: string
): Promise<LeadState | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_lead_states")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get lead state: ${error.message}`);
  }

  return data;
}

export async function listLeadStates(
  tenantId: string,
  filters?: {
    current_state?: LeadStateKey;
    engagement_level?: EngagementLevel;
    min_value?: number;
    has_prediction?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<LeadState[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_lead_states")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (filters?.current_state) {
    query = query.eq("current_state", filters.current_state);
  }
  if (filters?.engagement_level) {
    query = query.eq("engagement_level", filters.engagement_level);
  }
  if (filters?.min_value !== undefined) {
    query = query.gte("estimated_value", filters.min_value);
  }
  if (filters?.has_prediction) {
    query = query.not("predicted_next_state", "is", null);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list lead states: ${error.message}`);
  }

  return data || [];
}

export async function createLeadState(
  tenantId: string,
  lead: {
    lead_id: string;
    contact_id?: string;
    current_state?: LeadStateKey;
    engagement_level?: EngagementLevel;
    estimated_value?: number;
    currency?: string;
    tags?: string[];
    meta?: Record<string, unknown>;
  }
): Promise<LeadState> {
  const supabase = await createClient();

  const initialState = lead.current_state || "new";
  const probability = STATE_PROBABILITY[initialState];

  const { data, error } = await supabase
    .from("synthex_library_lead_states")
    .insert({
      tenant_id: tenantId,
      lead_id: lead.lead_id,
      contact_id: lead.contact_id,
      current_state: initialState,
      engagement_level: lead.engagement_level || "cold",
      estimated_value: lead.estimated_value,
      currency: lead.currency || "AUD",
      probability,
      entered_by: "system",
      entered_reason: "Lead created",
      tags: lead.tags || [],
      meta: lead.meta || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead state: ${error.message}`);
  }

  return data;
}

export async function transitionLeadState(
  tenantId: string,
  leadId: string,
  toState: LeadStateKey,
  options?: {
    reason?: string;
    transition_type?: TransitionType;
    trigger_event?: string;
    trigger_data?: Record<string, unknown>;
    user_id?: string;
    confidence?: number;
    ai_reasoning?: string;
  }
): Promise<{ state: LeadState; transition: StateTransition }> {
  const supabase = await createClient();

  // Get current state
  const current = await getLeadState(tenantId, leadId);
  if (!current) {
    throw new Error("Lead state not found");
  }

  const fromState = current.current_state;
  const probability = STATE_PROBABILITY[toState];

  // Update lead state
  const { data: updatedState, error: stateError } = await supabase
    .from("synthex_library_lead_states")
    .update({
      current_state: toState,
      probability,
      entered_reason: options?.reason,
      entered_by: options?.user_id ? `user:${options.user_id}` : "system",
      meta: {
        ...current.meta,
        transition_type: options?.transition_type || "manual",
      },
    })
    .eq("id", current.id)
    .select()
    .single();

  if (stateError) {
    throw new Error(`Failed to update lead state: ${stateError.message}`);
  }

  // The trigger will auto-create the transition record, but we need to get it
  const { data: transitions } = await supabase
    .from("synthex_library_state_transitions")
    .select("*")
    .eq("lead_id", leadId)
    .eq("from_state", fromState)
    .eq("to_state", toState)
    .order("created_at", { ascending: false })
    .limit(1);

  const transition = transitions?.[0];

  // Update transition with additional context if needed
  if (transition && (options?.ai_reasoning || options?.trigger_event)) {
    await supabase
      .from("synthex_library_state_transitions")
      .update({
        transition_type: options?.transition_type || "manual",
        trigger_event: options?.trigger_event,
        trigger_data: options?.trigger_data || {},
        confidence: options?.confidence || 0,
        ai_reasoning: options?.ai_reasoning,
        user_id: options?.user_id,
      })
      .eq("id", transition.id);
  }

  return { state: updatedState, transition };
}

export async function updateLeadState(
  stateId: string,
  updates: Partial<LeadState>
): Promise<LeadState> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_lead_states")
    .update(updates)
    .eq("id", stateId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead state: ${error.message}`);
  }

  return data;
}

export async function recordActivity(
  tenantId: string,
  leadId: string,
  activityType: string
): Promise<LeadState> {
  const supabase = await createClient();

  const current = await getLeadState(tenantId, leadId);
  if (!current) {
    throw new Error("Lead state not found");
  }

  // Update engagement level based on activity
  let newEngagement = current.engagement_level;
  const activityCount = (current.activity_count || 0) + 1;

  if (activityCount >= 10) {
    newEngagement = "on_fire";
  } else if (activityCount >= 7) {
    newEngagement = "hot";
  } else if (activityCount >= 4) {
    newEngagement = "warm";
  } else if (activityCount >= 2) {
    newEngagement = "warming";
  }

  const { data, error } = await supabase
    .from("synthex_library_lead_states")
    .update({
      activity_count: activityCount,
      last_activity_at: new Date().toISOString(),
      engagement_level: newEngagement,
      meta: {
        ...current.meta,
        last_activity_type: activityType,
      },
    })
    .eq("id", current.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record activity: ${error.message}`);
  }

  return data;
}

// =====================================================
// AI Prediction Functions
// =====================================================

export async function predictNextState(
  tenantId: string,
  leadId: string
): Promise<LeadState> {
  const current = await getLeadState(tenantId, leadId);
  if (!current) {
    throw new Error("Lead state not found");
  }

  // Get transition history
  const supabase = await createClient();
  const { data: transitions } = await supabase
    .from("synthex_library_state_transitions")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(10);

  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyze this lead and predict the next state:

Current State: ${current.current_state}
Engagement Level: ${current.engagement_level}
Activity Count: ${current.activity_count}
Time in Current State: ${current.time_in_state_seconds} seconds
Estimated Value: ${current.estimated_value} ${current.currency}

Recent Transitions:
${transitions?.map((t) => `- ${t.from_state} → ${t.to_state} (${t.reason || "no reason"})`).join("\n") || "No history"}

Available States: new, contacted, engaged, qualified, proposal_sent, negotiating, won, lost, churned, reactivated, dormant

Return JSON:
{
  "predicted_next_state": "state_key",
  "confidence": 0.0-1.0,
  "next_best_action": "Specific action to take",
  "reasoning": "Why this prediction"
}`,
        },
      ],
      system: `You are an expert sales AI that predicts lead progression. Consider engagement patterns, timing, and sales psychology.`,
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

    // Update lead state with prediction
    return updateLeadState(current.id, {
      predicted_next_state: parsed.predicted_next_state as string,
      prediction_confidence: parsed.confidence as number,
      next_best_action: parsed.next_best_action as string,
      ai_reasoning: parsed.reasoning as string,
      ai_model: "claude-sonnet-4-5-20250514",
      predicted_at: new Date().toISOString(),
    } as Partial<LeadState>);
  } catch (error) {
    lastFailureTime = Date.now();
    throw error;
  }
}

export async function evaluateTransitionRules(
  tenantId: string,
  leadId: string
): Promise<{ triggered: TransitionRule[]; state: LeadState | null }> {
  const supabase = await createClient();

  const current = await getLeadState(tenantId, leadId);
  if (!current) {
    return { triggered: [], state: null };
  }

  // Get active rules for current state
  const { data: rules } = await supabase
    .from("synthex_library_transition_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("from_state", current.current_state)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  const triggeredRules: TransitionRule[] = [];

  for (const rule of rules || []) {
    // Evaluate conditions
    const conditionsMet = evaluateConditions(rule.conditions, current);

    if (conditionsMet) {
      // Check cooldown
      if (rule.cooldown_hours > 0 && rule.last_triggered_at) {
        const lastTriggered = new Date(rule.last_triggered_at);
        const cooldownEnd = new Date(lastTriggered.getTime() + rule.cooldown_hours * 3600000);
        if (new Date() < cooldownEnd) {
          continue; // Skip due to cooldown
        }
      }

      triggeredRules.push(rule);

      // Execute transition
      await transitionLeadState(tenantId, leadId, rule.to_state as LeadStateKey, {
        reason: `Rule triggered: ${rule.name}`,
        transition_type: "rule_based",
      });

      // Update rule stats
      await supabase
        .from("synthex_library_transition_rules")
        .update({
          times_triggered: (rule.times_triggered || 0) + 1,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", rule.id);

      break; // Only execute first matching rule
    }
  }

  const updatedState = await getLeadState(tenantId, leadId);
  return { triggered: triggeredRules, state: updatedState };
}

function evaluateConditions(
  conditions: Array<{ field: string; operator: string; value: unknown }>,
  leadState: LeadState
): boolean {
  for (const condition of conditions) {
    const fieldValue = getNestedValue(leadState, condition.field);

    switch (condition.operator) {
      case "eq":
        if (fieldValue !== condition.value) {
return false;
}
        break;
      case "neq":
        if (fieldValue === condition.value) {
return false;
}
        break;
      case "gt":
        if (!(fieldValue > (condition.value as number))) {
return false;
}
        break;
      case "gte":
        if (!(fieldValue >= (condition.value as number))) {
return false;
}
        break;
      case "lt":
        if (!(fieldValue < (condition.value as number))) {
return false;
}
        break;
      case "lte":
        if (!(fieldValue <= (condition.value as number))) {
return false;
}
        break;
      case "in":
        if (!(condition.value as unknown[]).includes(fieldValue)) {
return false;
}
        break;
      case "contains":
        if (typeof fieldValue !== "string" || !fieldValue.includes(condition.value as string)) {
return false;
}
        break;
    }
  }
  return true;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

// =====================================================
// State Definition Functions
// =====================================================

export async function listStateDefinitions(
  tenantId: string
): Promise<StateDefinition[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_state_definitions")
    .select("*")
    .or(`tenant_id.eq.${tenantId},tenant_id.eq.00000000-0000-0000-0000-000000000000`)
    .eq("is_active", true)
    .order("stage_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to list state definitions: ${error.message}`);
  }

  return data || [];
}

export async function createStateDefinition(
  tenantId: string,
  definition: {
    state_key: string;
    display_name: string;
    description?: string;
    color?: string;
    icon?: string;
    stage_order?: number;
    stage_group?: string;
    is_terminal?: boolean;
    required_actions?: string[];
    min_time_in_state_hours?: number;
    notify_on_enter?: boolean;
    notify_on_exit?: boolean;
    notification_channels?: string[];
  }
): Promise<StateDefinition> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_state_definitions")
    .insert({
      tenant_id: tenantId,
      ...definition,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create state definition: ${error.message}`);
  }

  return data;
}

// =====================================================
// Transition Rule Functions
// =====================================================

export async function listTransitionRules(
  tenantId: string,
  filters?: {
    from_state?: string;
    to_state?: string;
    is_active?: boolean;
  }
): Promise<TransitionRule[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_transition_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  if (filters?.from_state) {
    query = query.eq("from_state", filters.from_state);
  }
  if (filters?.to_state) {
    query = query.eq("to_state", filters.to_state);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list transition rules: ${error.message}`);
  }

  return data || [];
}

export async function createTransitionRule(
  tenantId: string,
  rule: {
    name: string;
    description?: string;
    from_state: string;
    to_state: string;
    conditions: Array<{ field: string; operator: string; value: unknown }>;
    use_ai_validation?: boolean;
    ai_confidence_threshold?: number;
    priority?: number;
    cooldown_hours?: number;
    actions_on_transition?: unknown[];
  },
  userId?: string
): Promise<TransitionRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_transition_rules")
    .insert({
      tenant_id: tenantId,
      ...rule,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transition rule: ${error.message}`);
  }

  return data;
}

export async function updateTransitionRule(
  ruleId: string,
  updates: Partial<TransitionRule>
): Promise<TransitionRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_transition_rules")
    .update(updates)
    .eq("id", ruleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update transition rule: ${error.message}`);
  }

  return data;
}

export async function deleteTransitionRule(ruleId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_transition_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    throw new Error(`Failed to delete transition rule: ${error.message}`);
  }
}

// =====================================================
// Transition History Functions
// =====================================================

export async function listTransitions(
  tenantId: string,
  filters?: {
    lead_id?: string;
    from_state?: string;
    to_state?: string;
    transition_type?: TransitionType;
    limit?: number;
    offset?: number;
  }
): Promise<StateTransition[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_state_transitions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.lead_id) {
    query = query.eq("lead_id", filters.lead_id);
  }
  if (filters?.from_state) {
    query = query.eq("from_state", filters.from_state);
  }
  if (filters?.to_state) {
    query = query.eq("to_state", filters.to_state);
  }
  if (filters?.transition_type) {
    query = query.eq("transition_type", filters.transition_type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list transitions: ${error.message}`);
  }

  return data || [];
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
    lead_id?: string;
    limit?: number;
  }
): Promise<StateAlert[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_state_alerts")
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
  if (filters?.lead_id) {
    query = query.eq("lead_id", filters.lead_id);
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
    lead_id?: string;
    lead_state_id?: string;
    metric_name?: string;
    metric_value?: number;
    threshold_value?: number;
  }
): Promise<StateAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_state_alerts")
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
): Promise<StateAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_state_alerts")
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
  notes?: string
): Promise<StateAlert> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_state_alerts")
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
// Metrics Functions
// =====================================================

export async function getStateMetrics(
  tenantId: string,
  filters?: {
    period_type?: string;
    limit?: number;
  }
): Promise<StateMetric[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_state_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false });

  if (filters?.period_type) {
    query = query.eq("period_type", filters.period_type);
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

export async function getStateMachineStats(tenantId: string): Promise<{
  total_leads: number;
  state_distribution: Record<string, number>;
  avg_conversion_rate: number | null;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  transitions_today: number;
  alerts_pending: number;
}> {
  const supabase = await createClient();

  // Get all lead states
  const { data: states } = await supabase
    .from("synthex_library_lead_states")
    .select("current_state, estimated_value, probability")
    .eq("tenant_id", tenantId);

  const stateList = states || [];
  const total = stateList.length;

  // State distribution
  const distribution: Record<string, number> = {};
  let totalValue = 0;
  let weightedValue = 0;

  stateList.forEach((s) => {
    distribution[s.current_state] = (distribution[s.current_state] || 0) + 1;
    totalValue += s.estimated_value || 0;
    weightedValue += (s.estimated_value || 0) * (s.probability || 0);
  });

  // Transitions today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: transitionsToday } = await supabase
    .from("synthex_library_state_transitions")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", today.toISOString());

  // Pending alerts
  const { count: alertsPending } = await supabase
    .from("synthex_library_state_alerts")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "new");

  // Conversion rate
  const won = distribution["won"] || 0;
  const lost = distribution["lost"] || 0;
  const conversionRate = won + lost > 0 ? won / (won + lost) : null;

  return {
    total_leads: total,
    state_distribution: distribution,
    avg_conversion_rate: conversionRate,
    total_pipeline_value: totalValue,
    weighted_pipeline_value: weightedValue,
    transitions_today: transitionsToday || 0,
    alerts_pending: alertsPending || 0,
  };
}
