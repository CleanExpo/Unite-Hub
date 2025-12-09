/**
 * @fileoverview E44 Intelligence Bus Service
 * Server-side only service for cross-domain agent intelligence signals
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("intelligenceBusService must only run on server");
}

export type IntelligenceDomain =
  | "seo"
  | "ops"
  | "security"
  | "product"
  | "market"
  | "finance"
  | "content"
  | "social"
  | "governance"
  | "other";

export type IntelligenceKind =
  | "observation"
  | "insight"
  | "recommendation"
  | "alert"
  | "anomaly"
  | "pattern"
  | "forecast"
  | "other";

/**
 * List intelligence signals
 */
export async function listIntelligenceSignals(
  tenantId: string,
  filters?: {
    domain?: IntelligenceDomain;
    kind?: IntelligenceKind;
    sourceAgent?: string;
    minImportance?: number;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_intelligence_signals", {
    p_tenant_id: tenantId,
    p_domain: filters?.domain || null,
    p_kind: filters?.kind || null,
    p_source_agent: filters?.sourceAgent || null,
    p_min_importance: filters?.minImportance ?? null,
    p_limit: filters?.limit || 300,
  });

  if (error) throw new Error(`Failed to list intelligence signals: ${error.message}`);
  return data || [];
}

/**
 * Record intelligence signal
 */
export async function recordIntelligenceSignal(args: {
  tenantId: string;
  sourceAgent: string;
  domain: IntelligenceDomain;
  kind: IntelligenceKind;
  title?: string;
  summary?: string;
  payload?: Record<string, any>;
  importance?: number;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_intelligence_signal", {
    p_tenant_id: args.tenantId,
    p_source_agent: args.sourceAgent,
    p_domain: args.domain,
    p_kind: args.kind,
    p_title: args.title || null,
    p_summary: args.summary || null,
    p_payload: args.payload || {},
    p_importance: args.importance ?? 0,
  });

  if (error) throw new Error(`Failed to record intelligence signal: ${error.message}`);
  return data;
}

/**
 * Get intelligence summary
 */
export async function getIntelligenceSummary(
  tenantId: string,
  hours: number = 24
): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_intelligence_summary", {
    p_tenant_id: tenantId,
    p_hours: hours,
  });

  if (error) throw new Error(`Failed to get intelligence summary: ${error.message}`);
  return data || {};
}
