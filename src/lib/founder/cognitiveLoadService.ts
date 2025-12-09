/**
 * @fileoverview F09 Cognitive Load Monitor Service
 * Server-side only service for cognitive load tracking
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("cognitiveLoadService must only run on server");
}

export type CognitiveLoadIntensity =
  | "minimal"
  | "low"
  | "moderate"
  | "high"
  | "extreme"
  | "overload";

export type CognitiveLoadSignalType =
  | "task_count"
  | "decision_count"
  | "context_switch"
  | "interruption"
  | "time_pressure"
  | "complexity"
  | "uncertainty"
  | "novelty"
  | "multitasking"
  | "cognitive_fatigue"
  | "information_overload"
  | "other";

/**
 * Record cognitive load event
 */
export async function recordCognitiveLoad(args: {
  tenantId: string;
  signalType: CognitiveLoadSignalType;
  signalValue: number;
  intensity?: CognitiveLoadIntensity;
  context?: string;
  contributingFactors?: Record<string, any>[];
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_cognitive_load", {
    p_tenant_id: args.tenantId,
    p_signal_type: args.signalType,
    p_signal_value: args.signalValue,
    p_intensity: args.intensity || null,
    p_context: args.context || null,
    p_contributing_factors: args.contributingFactors || [],
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record cognitive load: ${error.message}`);
  return data;
}

/**
 * List cognitive load events
 */
export async function listCognitiveLoadEvents(
  tenantId: string,
  filters?: {
    intensity?: CognitiveLoadIntensity;
    signalType?: CognitiveLoadSignalType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_cognitive_load_events", {
    p_tenant_id: tenantId,
    p_intensity: filters?.intensity || null,
    p_signal_type: filters?.signalType || null,
    p_start_date: filters?.startDate?.toISOString() || null,
    p_end_date: filters?.endDate?.toISOString() || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list cognitive load events: ${error.message}`);
  return data || [];
}

/**
 * Get cognitive load summary
 */
export async function getCognitiveLoadSummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_cognitive_load_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get cognitive load summary: ${error.message}`);
  return data || {};
}

/**
 * Get current cognitive load level
 */
export async function getCurrentCognitiveLoad(
  tenantId: string,
  windowMinutes: number = 60
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_current_cognitive_load", {
    p_tenant_id: tenantId,
    p_window_minutes: windowMinutes,
  });

  if (error) throw new Error(`Failed to get current cognitive load: ${error.message}`);
  return data || {};
}
