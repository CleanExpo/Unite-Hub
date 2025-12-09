/**
 * @fileoverview E43 AI Oversight Loop Service
 * Server-side only service for AI oversight policy and event management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("aiOversightService must only run on server");
}

export type OversightPolicyStatus = "active" | "paused" | "archived";
export type OversightEventLevel = "info" | "warning" | "risk" | "block";

/**
 * List oversight policies
 */
export async function listOversightPolicies(
  tenantId: string,
  filters?: { status?: OversightPolicyStatus }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_oversight_policies", {
    p_tenant_id: tenantId,
    p_status: filters?.status || null,
  });

  if (error) throw new Error(`Failed to list oversight policies: ${error.message}`);
  return data || [];
}

/**
 * List oversight events
 */
export async function listOversightEvents(
  tenantId: string,
  filters?: {
    policyCode?: string;
    level?: OversightEventLevel;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_oversight_events", {
    p_tenant_id: tenantId,
    p_policy_code: filters?.policyCode || null,
    p_level: filters?.level || null,
    p_limit: filters?.limit || 200,
  });

  if (error) throw new Error(`Failed to list oversight events: ${error.message}`);
  return data || [];
}

/**
 * Record oversight policy (upsert)
 */
export async function recordOversightPolicy(args: {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  threshold?: number;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_oversight_policy", {
    p_tenant_id: args.tenantId,
    p_code: args.code,
    p_name: args.name,
    p_description: args.description || null,
    p_threshold: args.threshold ?? null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record oversight policy: ${error.message}`);
  return data;
}

/**
 * Record oversight event
 */
export async function recordOversightEvent(args: {
  tenantId: string;
  policyCode: string;
  level: OversightEventLevel;
  summary?: string;
  details?: string;
  impactScore?: number;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_oversight_event", {
    p_tenant_id: args.tenantId,
    p_policy_code: args.policyCode,
    p_level: args.level,
    p_summary: args.summary || null,
    p_details: args.details || null,
    p_impact_score: args.impactScore ?? null,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record oversight event: ${error.message}`);
  return data;
}

/**
 * Get oversight summary
 */
export async function getOversightSummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_oversight_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get oversight summary: ${error.message}`);
  return data || {};
}
