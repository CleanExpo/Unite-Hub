/**
 * Founder Pre-Emptive Risk Grid Service (F22)
 * Identifies structural, behavioural, and temporal risks before they escalate
 */

if (typeof window !== "undefined") {
  throw new Error("preemptiveRiskGridService must only run on server");
}

import { supabaseAdmin } from "@/lib/supabase/admin";

export type RiskDomain = 'cognitive' | 'emotional' | 'operational' | 'strategic' | 'social' | 'financial' | 'health';
export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical' | 'severe';

export type PreemptiveRisk = {
  id: string;
  risk_domain: RiskDomain;
  risk_level: RiskLevel;
  risk_score: number;
  factors: Record<string, any>;
  contributing_signals: Record<string, any> | null;
  risk_indicators: string[] | null;
  potential_impact: string | null;
  escalation_probability: number | null;
  time_to_escalation: string | null;
  mitigation_strategies: string[] | null;
  preventive_actions: string[] | null;
  monitoring_triggers: string[] | null;
  created_at: string;
};

export type RiskSummary = {
  avg_risk_score: number;
  max_risk_score: number;
  severe_count: number;
  critical_count: number;
  high_count: number;
  by_domain: Record<string, number>;
  period_days: number;
};

/**
 * Calculate preemptive risk assessment
 */
export async function calculatePreemptiveRisk(args: {
  tenantId: string;
  riskDomain?: RiskDomain;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("calculate_preemptive_risk", {
    p_tenant_id: args.tenantId,
    p_risk_domain: args.riskDomain || 'operational',
  });

  if (error) {
    throw new Error(`Failed to calculate preemptive risk: ${error.message}`);
  }

  return data;
}

/**
 * List preemptive risk grid entries
 */
export async function listPreemptiveRisk(
  tenantId: string,
  filters?: {
    riskDomain?: RiskDomain;
    riskLevel?: RiskLevel;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<PreemptiveRisk[]> {
  const { data, error } = await supabaseAdmin.rpc("list_preemptive_risk", {
    p_tenant_id: tenantId,
    p_risk_domain: filters?.riskDomain || null,
    p_risk_level: filters?.riskLevel || null,
    p_start_date: filters?.startDate || null,
    p_end_date: filters?.endDate || null,
    p_limit: filters?.limit || 100,
  });

  if (error) {
    throw new Error(`Failed to list preemptive risk: ${error.message}`);
  }

  return data || [];
}

/**
 * Get preemptive risk summary
 */
export async function getPreemptiveRiskSummary(
  tenantId: string,
  days: number = 7
): Promise<RiskSummary> {
  const { data, error } = await supabaseAdmin.rpc("get_preemptive_risk_summary", {
    p_tenant_id: tenantId,
    p_days: days,
  });

  if (error) {
    throw new Error(`Failed to get preemptive risk summary: ${error.message}`);
  }

  return data || null;
}
