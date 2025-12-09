/**
 * Policy Engine Service (Phase E24)
 *
 * Tenant-scoped policy rules and triggers for automation
 * Server-side only - never expose to client
 *
 * @module policyEngine
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type PolicyStatus = "active" | "inactive" | "draft";

export type PolicyTriggerType =
  | "rate_limit_exceeded"
  | "security_event"
  | "compliance_violation"
  | "incident_created"
  | "audit_event"
  | "threshold_exceeded"
  | "schedule"
  | "webhook"
  | "manual"
  | "other";

export type PolicyActionType =
  | "send_notification"
  | "create_incident"
  | "trigger_webhook"
  | "block_request"
  | "update_rate_limit"
  | "send_email"
  | "log_audit_event"
  | "execute_workflow"
  | "other";

export interface Policy {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: PolicyStatus;
  trigger_type: PolicyTriggerType;
  trigger_conditions: Record<string, any>;
  action_type: PolicyActionType;
  action_config: Record<string, any>;
  priority: number;
  cooldown_seconds: number;
  last_triggered_at: string | null;
  execution_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PolicyTrigger {
  id: string;
  policy_id: string;
  tenant_id: string;
  triggered_by: string | null;
  trigger_data: Record<string, any>;
  action_result: string | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PolicyStatistics {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  by_trigger_type: Record<string, number>;
  recent_triggers: Array<{
    policy_id: string;
    triggered_by: string;
    success: boolean;
    created_at: string;
  }>;
}

/**
 * Create policy
 */
export async function createPolicy(args: {
  tenantId: string;
  name: string;
  description?: string;
  status?: PolicyStatus;
  triggerType: PolicyTriggerType;
  triggerConditions?: Record<string, any>;
  actionType: PolicyActionType;
  actionConfig?: Record<string, any>;
  priority?: number;
  cooldownSeconds?: number;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_policy", {
      p_tenant_id: args.tenantId,
      p_name: args.name,
      p_description: args.description || null,
      p_status: args.status || "draft",
      p_trigger_type: args.triggerType,
      p_trigger_conditions: args.triggerConditions || {},
      p_action_type: args.actionType,
      p_action_config: args.actionConfig || {},
      p_priority: args.priority || 0,
      p_cooldown_seconds: args.cooldownSeconds || 0,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to create policy: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List policies
 */
export async function listPolicies(
  tenantId: string,
  status?: PolicyStatus,
  triggerType?: PolicyTriggerType
): Promise<Policy[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    let query = supabaseAdmin
      .from("policies")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (triggerType) {
      query = query.eq("trigger_type", triggerType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Policy] Error listing policies:", error);
      return [];
    }

    return (data || []) as Policy[];
  } catch (err) {
    console.error("[Policy] Exception in listPolicies:", err);
    return [];
  }
}

/**
 * Get single policy
 */
export async function getPolicy(
  policyId: string,
  tenantId: string
): Promise<Policy | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("policies")
      .select("*")
      .eq("id", policyId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Policy] Error fetching policy:", error);
      return null;
    }

    return data as Policy;
  } catch (err) {
    console.error("[Policy] Exception in getPolicy:", err);
    return null;
  }
}

/**
 * Update policy
 */
export async function updatePolicy(
  policyId: string,
  tenantId: string,
  updates: {
    name?: string;
    description?: string;
    status?: PolicyStatus;
    triggerConditions?: Record<string, any>;
    actionConfig?: Record<string, any>;
    priority?: number;
    cooldownSeconds?: number;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.triggerConditions !== undefined) updateData.trigger_conditions = updates.triggerConditions;
    if (updates.actionConfig !== undefined) updateData.action_config = updates.actionConfig;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.cooldownSeconds !== undefined) updateData.cooldown_seconds = updates.cooldownSeconds;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { error } = await supabaseAdmin
      .from("policies")
      .update(updateData)
      .eq("id", policyId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Delete policy
 */
export async function deletePolicy(
  policyId: string,
  tenantId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const { error } = await supabaseAdmin
      .from("policies")
      .delete()
      .eq("id", policyId)
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Trigger policy
 */
export async function triggerPolicy(
  policyId: string,
  tenantId: string,
  triggeredBy?: string,
  triggerData?: Record<string, any>
): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("trigger_policy", {
      p_policy_id: policyId,
      p_tenant_id: tenantId,
      p_triggered_by: triggeredBy || null,
      p_trigger_data: triggerData || {},
    });

    if (error) {
      throw new Error(`Failed to trigger policy: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * Check policy cooldown
 */
export async function checkPolicyCooldown(policyId: string): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("check_policy_cooldown", {
      p_policy_id: policyId,
    });

    if (error) {
      console.error("[Policy] Error checking cooldown:", error);
      return false;
    }

    return data as boolean;
  } catch (err) {
    console.error("[Policy] Exception in checkPolicyCooldown:", err);
    return false;
  }
}

/**
 * List policy triggers
 */
export async function listPolicyTriggers(
  tenantId: string,
  policyId?: string,
  success?: boolean,
  limit: number = 100
): Promise<PolicyTrigger[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    let query = supabaseAdmin
      .from("policy_triggers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (policyId) {
      query = query.eq("policy_id", policyId);
    }

    if (success !== undefined) {
      query = query.eq("success", success);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Policy] Error listing policy triggers:", error);
      return [];
    }

    return (data || []) as PolicyTrigger[];
  } catch (err) {
    console.error("[Policy] Exception in listPolicyTriggers:", err);
    return [];
  }
}

/**
 * Get policy statistics
 */
export async function getPolicyStatistics(tenantId: string): Promise<PolicyStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_policy_statistics", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[Policy] Error getting statistics:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        draft: 0,
        by_trigger_type: {},
        recent_triggers: [],
      };
    }

    return data as PolicyStatistics;
  } catch (err) {
    console.error("[Policy] Exception in getPolicyStatistics:", err);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      draft: 0,
      by_trigger_type: {},
      recent_triggers: [],
    };
  }
}

/**
 * Evaluate and trigger matching policies
 * (Helper function for automated policy execution)
 */
export async function evaluateAndTriggerPolicies(
  tenantId: string,
  triggerType: PolicyTriggerType,
  triggerData: Record<string, any>,
  triggeredBy?: string
): Promise<string[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("policyEngine must only run on server");
    }

    // Get active policies for this trigger type
    const policies = await listPolicies(tenantId, "active", triggerType);

    const triggeredPolicyIds: string[]= [];

    for (const policy of policies) {
      // Check cooldown
      const cooldownOk = await checkPolicyCooldown(policy.id);
      if (!cooldownOk) {
        continue;
      }

      // TODO: Evaluate trigger_conditions against triggerData
      // For v1, we'll trigger all active policies (no condition evaluation)

      try {
        const triggerId = await triggerPolicy(policy.id, tenantId, triggeredBy, triggerData);
        triggeredPolicyIds.push(policy.id);
      } catch (err) {
        console.error(`[Policy] Failed to trigger policy ${policy.id}:`, err);
      }
    }

    return triggeredPolicyIds;
  } catch (err) {
    console.error("[Policy] Exception in evaluateAndTriggerPolicies:", err);
    return [];
  }
}
