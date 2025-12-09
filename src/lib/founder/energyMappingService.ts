/**
 * @fileoverview F10 Energy Mapping Engine Service
 * Server-side only service for energy tracking and pattern detection
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("energyMappingService must only run on server");
}

export type EnergyLevelCategory =
  | "depleted"
  | "low"
  | "moderate"
  | "high"
  | "peak"
  | "flow_state";

export type EnergyMeasurementType =
  | "self_reported"
  | "activity_inferred"
  | "productivity_score"
  | "focus_depth"
  | "task_completion"
  | "response_time"
  | "decision_quality"
  | "other";

/**
 * Record energy reading
 */
export async function recordEnergyReading(args: {
  tenantId: string;
  energyLevel: number;
  measurementType: EnergyMeasurementType;
  category?: EnergyLevelCategory;
  activityContext?: string;
  contributingFactors?: Record<string, any>[];
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_energy_reading", {
    p_tenant_id: args.tenantId,
    p_energy_level: args.energyLevel,
    p_measurement_type: args.measurementType,
    p_category: args.category || null,
    p_activity_context: args.activityContext || null,
    p_contributing_factors: args.contributingFactors || [],
    p_notes: args.notes || null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record energy reading: ${error.message}`);
  return data;
}

/**
 * List energy readings
 */
export async function listEnergyReadings(
  tenantId: string,
  filters?: {
    category?: EnergyLevelCategory;
    measurementType?: EnergyMeasurementType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_energy_readings", {
    p_tenant_id: tenantId,
    p_category: filters?.category || null,
    p_measurement_type: filters?.measurementType || null,
    p_start_date: filters?.startDate?.toISOString() || null,
    p_end_date: filters?.endDate?.toISOString() || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list energy readings: ${error.message}`);
  return data || [];
}

/**
 * Get energy summary
 */
export async function getEnergySummary(tenantId: string, days: number = 7): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_energy_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) throw new Error(`Failed to get energy summary: ${error.message}`);
  return data || {};
}

/**
 * Detect energy patterns
 */
export async function detectEnergyPatterns(
  tenantId: string,
  minConfidence: number = 70
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("detect_energy_patterns", {
    p_tenant_id: tenantId,
    p_min_confidence: minConfidence,
  });

  if (error) throw new Error(`Failed to detect energy patterns: ${error.message}`);
  return data || [];
}

/**
 * Get optimal work windows
 */
export async function getOptimalWorkWindows(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_optimal_work_windows", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get optimal work windows: ${error.message}`);
  return data || {};
}
