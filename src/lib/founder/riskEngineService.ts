/**
 * Risk Engine Service (Phase E28)
 *
 * Tenant-scoped risk score tracking and anomaly detection
 * Server-side only - never expose to client
 *
 * @module riskEngineService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type RiskCategory =
  | "security"
  | "compliance"
  | "operational"
  | "financial"
  | "reputation"
  | "data_quality"
  | "performance"
  | "availability"
  | "other";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskEventType =
  | "anomaly_detected"
  | "threshold_exceeded"
  | "pattern_change"
  | "unusual_activity"
  | "data_drift"
  | "security_threat"
  | "compliance_violation"
  | "performance_degradation"
  | "outage"
  | "other";

export interface RiskScore {
  id: string;
  tenant_id: string;
  category: RiskCategory;
  score: number;
  severity: RiskSeverity;
  description: string | null;
  contributing_factors: any[];
  last_event_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RiskEvent {
  id: string;
  tenant_id: string;
  category: RiskCategory;
  event_type: RiskEventType;
  severity: RiskSeverity;
  score_impact: number | null;
  title: string;
  description: string;
  source: string | null;
  source_id: string | null;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RiskOverview {
  total_events: number;
  unresolved_events: number;
  critical_events: number;
  high_events: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  avg_score: number;
  max_score: number;
}

/**
 * List risk scores
 */
export async function listRiskScores(tenantId: string): Promise<RiskScore[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("risk_scores")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("score", { ascending: false });

    if (error) {
      console.error("[RiskEngine] Error listing scores:", error);
      return [];
    }

    return (data || []) as RiskScore[];
  } catch (err) {
    console.error("[RiskEngine] Exception in listRiskScores:", err);
    return [];
  }
}

/**
 * Get risk score for category
 */
export async function getRiskScore(
  tenantId: string,
  category: RiskCategory
): Promise<RiskScore | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("risk_scores")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("category", category)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[RiskEngine] Error fetching score:", error);
      return null;
    }

    return data as RiskScore;
  } catch (err) {
    console.error("[RiskEngine] Exception in getRiskScore:", err);
    return null;
  }
}

/**
 * Update risk score
 */
export async function updateRiskScore(args: {
  tenantId: string;
  category: RiskCategory;
  score: number;
  description?: string;
  contributingFactors?: any[];
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("update_risk_score", {
      p_tenant_id: args.tenantId,
      p_category: args.category,
      p_score: args.score,
      p_description: args.description || null,
      p_contributing_factors: args.contributingFactors || [],
      p_metadata: {},
    });

    if (error) {
      throw new Error(`Failed to update risk score: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * Record risk event
 */
export async function recordRiskEvent(args: {
  tenantId: string;
  category: RiskCategory;
  eventType: RiskEventType;
  severity: RiskSeverity;
  title: string;
  description: string;
  scoreImpact?: number;
  source?: string;
  sourceId?: string;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_risk_event", {
      p_tenant_id: args.tenantId,
      p_category: args.category,
      p_event_type: args.eventType,
      p_severity: args.severity,
      p_title: args.title,
      p_description: args.description,
      p_score_impact: args.scoreImpact || null,
      p_source: args.source || null,
      p_source_id: args.sourceId || null,
      p_metadata: {},
    });

    if (error) {
      throw new Error(`Failed to record risk event: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List risk events
 */
export async function listRiskEvents(
  tenantId: string,
  category?: RiskCategory,
  resolved?: boolean,
  limit: number = 100
): Promise<RiskEvent[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    let query = supabaseAdmin
      .from("risk_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("detected_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }

    if (resolved !== undefined) {
      query = query.eq("resolved", resolved);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RiskEngine] Error listing events:", error);
      return [];
    }

    return (data || []) as RiskEvent[];
  } catch (err) {
    console.error("[RiskEngine] Exception in listRiskEvents:", err);
    return [];
  }
}

/**
 * Resolve risk event
 */
export async function resolveRiskEvent(
  eventId: string,
  tenantId: string,
  resolvedBy: string,
  resolutionNotes?: string,
  scoreReduction?: number
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("resolve_risk_event", {
      p_event_id: eventId,
      p_tenant_id: tenantId,
      p_resolved_by: resolvedBy,
      p_resolution_notes: resolutionNotes || null,
      p_score_reduction: scoreReduction || 0,
    });

    if (error) {
      throw new Error(`Failed to resolve risk event: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Get risk overview
 */
export async function getRiskOverview(tenantId: string): Promise<RiskOverview> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("riskEngineService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_risk_overview", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[RiskEngine] Error getting overview:", error);
      return {
        total_events: 0,
        unresolved_events: 0,
        critical_events: 0,
        high_events: 0,
        by_category: {},
        by_severity: {},
        avg_score: 0,
        max_score: 0,
      };
    }

    return data as RiskOverview;
  } catch (err) {
    console.error("[RiskEngine] Exception in getRiskOverview:", err);
    return {
      total_events: 0,
      unresolved_events: 0,
      critical_events: 0,
      high_events: 0,
      by_category: {},
      by_severity: {},
      avg_score: 0,
      max_score: 0,
    };
  }
}
