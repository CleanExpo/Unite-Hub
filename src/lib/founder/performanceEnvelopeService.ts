/**
 * Founder Performance Envelope Service (F23)
 * Defines operating limits, ideal bands, and overload thresholds
 */

if (typeof window !== "undefined") {
  throw new Error("performanceEnvelopeService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type EnvelopeState = 'optimal' | 'stable' | 'strained' | 'overloaded' | 'critical' | 'recovery';

export type PerformanceEnvelope = {
  id: string;
  envelope_state: EnvelopeState;
  load_index: number;
  efficiency_index: number;
  capacity_utilization: number | null;
  performance_score: number | null;
  overhead_ratio: number | null;
  envelope_factors: Record<string, any>;
  limiting_factors: string[] | null;
  enhancing_factors: string[] | null;
  created_at: string;
};

export type EnvelopeSummary = {
  avg_load_index: number;
  avg_efficiency_index: number;
  current_state: EnvelopeState;
  critical_count: number;
  overloaded_count: number;
  optimal_count: number;
  period_days: number;
};

export async function calculatePerformanceEnvelope(tenantId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("calculate_performance_envelope", {
    p_tenant_id: tenantId,
  });

  if (error) {
    throw new Error(`Failed to calculate performance envelope: ${error.message}`);
  }

  return data;
}

export async function listPerformanceEnvelope(
  tenantId: string,
  filters?: {
    envelopeState?: EnvelopeState;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<PerformanceEnvelope[]> {
  const { data, error } = await supabaseAdmin.rpc("list_performance_envelope", {
    p_tenant_id: tenantId,
    p_envelope_state: filters?.envelopeState || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
    throw new Error(`Failed to list performance envelope: ${error.message}`);
  }

  return data || [];
}

export async function getPerformanceEnvelopeSummary(
  tenantId: string,
  days: number = 7
): Promise<EnvelopeSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_performance_envelope_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get performance envelope summary: ${error.message}`);
  }

  return data || null;
}
