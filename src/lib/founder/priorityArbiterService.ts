/**
 * @fileoverview F04 AI-Assisted Priority Arbiter Service
 * Server-side only service for priority decision management
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("priorityArbiterService must only run on server");
}

/**
 * Record priority decision
 */
export async function recordPriorityDecision(args: {
  tenantId: string;
  decisionCode: string;
  context: string;
  recommendation?: string;
  confidence?: number;
  reasoning?: string;
  signalsUsed?: string[];
  finalPriority?: number;
  humanOverride?: boolean;
  metadata?: Record<string, any>;
}): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc("record_priority_decision", {
    p_tenant_id: args.tenantId,
    p_decision_code: args.decisionCode,
    p_context: args.context,
    p_recommendation: args.recommendation || null,
    p_confidence: args.confidence ?? null,
    p_reasoning: args.reasoning || null,
    p_signals_used: args.signalsUsed || [],
    p_final_priority: args.finalPriority ?? null,
    p_human_override: args.humanOverride ?? false,
    p_metadata: args.metadata || {},
  });

  if (error) throw new Error(`Failed to record priority decision: ${error.message}`);
  return data;
}

/**
 * List priority decisions
 */
export async function listPriorityDecisions(
  tenantId: string,
  filters?: {
    humanOverride?: boolean;
    decided?: boolean;
    limit?: number;
  }
): Promise<any[]> {
  const { data, error } = await supabaseAdmin.rpc("list_priority_decisions", {
    p_tenant_id: tenantId,
    p_human_override: filters?.humanOverride ?? null,
    p_decided: filters?.decided ?? null,
    p_limit: filters?.limit || 300,
  });

  if (error) throw new Error(`Failed to list priority decisions: ${error.message}`);
  return data || [];
}

/**
 * Get priority summary
 */
export async function getPrioritySummary(tenantId: string): Promise<any> {
  const { data, error } = await supabaseAdmin.rpc("get_priority_summary", {
    p_tenant_id: tenantId,
  });

  if (error) throw new Error(`Failed to get priority summary: ${error.message}`);
  return data || {};
}
