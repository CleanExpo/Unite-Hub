/**
 * @fileoverview F11 Founder Intent Router Service
 * Server-side only service for intent signal interpretation
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("intentRouterService must only run on server");
}

export type FounderIntentType =
  | "deep_work_request"
  | "break_request"
  | "meeting_request"
  | "decision_needed"
  | "review_needed"
  | "planning_mode"
  | "learning_mode"
  | "admin_mode"
  | "delegation_intent"
  | "automation_intent"
  | "clarification_needed"
  | "other";

export type IntentConfidenceLevel = "very_low" | "low" | "medium" | "high" | "very_high";

export type IntentRoutingStatus =
  | "detected"
  | "routed"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Record intent signal
 */
export async function recordIntentSignal(args: {
  tenantId: string;
  intentType: FounderIntentType;
  signalSource: string;
  signalData: Record<string, any>;
  confidenceScore?: number;
  confidence?: IntentConfidenceLevel;
  interpretation?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_intent_signal", {
    p_tenant_id: args.tenantId,
    p_intent_type: args.intentType,
    p_signal_source: args.signalSource,
    p_signal_data: args.signalData,
    p_confidence_score: args.confidenceScore ?? null,
    p_confidence: args.confidence || null,
    p_interpretation: args.interpretation || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record intent signal: ${error.message}`);
  return data;
}

/**
 * Update intent routing status
 */
export async function updateIntentRouting(args: {
  signalId: string;
  routingStatus: IntentRoutingStatus;
  routedTo?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("update_intent_routing", {
    p_signal_id: args.signalId,
    p_routing_status: args.routingStatus,
    p_routed_to: args.routedTo || null,
  });

  if (error) throw new Error(`Failed to update intent routing: ${error.message}`);
}

/**
 * List intent signals
 */
export async function listIntentSignals(
  tenantId: string,
  filters?: {
    intentType?: FounderIntentType;
    routingStatus?: IntentRoutingStatus;
    routedTo?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_intent_signals", {
    p_tenant_id: tenantId,
    p_intent_type: filters?.intentType || null,
    p_routing_status: filters?.routingStatus || null,
    p_routed_to: filters?.routedTo || null,
    p_start_date: filters?.startDate?.toISOString() || null,
    p_end_date: filters?.endDate?.toISOString() || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list intent signals: ${error.message}`);
  return data || [];
}

/**
 * Get intent routing summary
 */
export async function getIntentRoutingSummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_intent_routing_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get intent routing summary: ${error.message}`);
  return data || {};
}
