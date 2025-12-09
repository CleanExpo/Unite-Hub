/**
 * @fileoverview F12 Founder Recovery Protocols Service
 * Server-side only service for recovery state tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("recoveryProtocolsService must only run on server");
}

export type RecoveryState =
  | "well_rested"
  | "normal"
  | "fatigued"
  | "exhausted"
  | "burned_out"
  | "recovering";

export type RecoveryActionType =
  | "micro_break"
  | "short_break"
  | "long_break"
  | "power_nap"
  | "physical_activity"
  | "meditation"
  | "social_connection"
  | "creative_activity"
  | "nature_exposure"
  | "sleep_optimization"
  | "workload_reduction"
  | "other";

export type RecoveryUrgency = "low" | "moderate" | "high" | "critical";

/**
 * Record recovery state
 */
export async function recordRecoveryState(args: {
  tenantId: string;
  recoveryScore: number;
  fatigueLevel?: number;
  stressLevel?: number;
  sleepQuality?: number;
  state?: RecoveryState;
  contributingFactors?: Record<string, any>[];
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_recovery_state", {
    p_tenant_id: args.tenantId,
    p_recovery_score: args.recoveryScore,
    p_fatigue_level: args.fatigueLevel ?? null,
    p_stress_level: args.stressLevel ?? null,
    p_sleep_quality: args.sleepQuality ?? null,
    p_state: args.state || null,
    p_contributing_factors: args.contributingFactors || [],
    p_notes: args.notes || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record recovery state: ${error.message}`);
  return data;
}

/**
 * Recommend recovery action
 */
export async function recommendRecoveryAction(args: {
  tenantId: string;
  actionType: RecoveryActionType;
  urgency: RecoveryUrgency;
  description: string;
  durationMinutes?: number;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("recommend_recovery_action", {
    p_tenant_id: args.tenantId,
    p_action_type: args.actionType,
    p_urgency: args.urgency,
    p_description: args.description,
    p_duration_minutes: args.durationMinutes ?? null,
    p_scheduled_for: args.scheduledFor?.toISOString() || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to recommend recovery action: ${error.message}`);
  return data;
}

/**
 * Mark recovery action as taken
 */
export async function markRecoveryActionTaken(args: {
  actionId: string;
  effectivenessRating?: number;
  notes?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("mark_recovery_action_taken", {
    p_action_id: args.actionId,
    p_effectiveness_rating: args.effectivenessRating ?? null,
    p_notes: args.notes || null,
  });

  if (error) throw new Error(`Failed to mark recovery action as taken: ${error.message}`);
}

/**
 * List recovery states
 */
export async function listRecoveryStates(
  tenantId: string,
  filters?: {
    state?: RecoveryState;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_recovery_states", {
    p_tenant_id: tenantId,
    p_state: filters?.state || null,
    p_start_date: filters?.startDate?.toISOString() || null,
    p_end_date: filters?.endDate?.toISOString() || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list recovery states: ${error.message}`);
  return data || [];
}

/**
 * List recovery actions
 */
export async function listRecoveryActions(
  tenantId: string,
  filters?: {
    actionType?: RecoveryActionType;
    urgency?: RecoveryUrgency;
    taken?: boolean;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_recovery_actions", {
    p_tenant_id: tenantId,
    p_action_type: filters?.actionType || null,
    p_urgency: filters?.urgency || null,
    p_taken: filters?.taken ?? null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list recovery actions: ${error.message}`);
  return data || [];
}

/**
 * Get recovery summary
 */
export async function getRecoverySummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_recovery_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get recovery summary: ${error.message}`);
  return data || {};
}

/**
 * Auto-recommend recovery actions
 */
export async function autoRecommendRecovery(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("auto_recommend_recovery", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to auto-recommend recovery: ${error.message}`);
  return data || {};
}
