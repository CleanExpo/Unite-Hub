/**
 * Founder Audit Service (Phase E22)
 *
 * Unified audit logging for governance and founder actions
 * Server-side only - never expose to client
 *
 * @module auditService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type AuditCategory =
  | "authentication"
  | "authorization"
  | "data_access"
  | "data_modification"
  | "configuration"
  | "compliance"
  | "security"
  | "billing"
  | "incident"
  | "policy"
  | "notification"
  | "rate_limit"
  | "integration"
  | "export"
  | "import"
  | "other";

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor: string | null;
  category: AuditCategory;
  action: string;
  resource: string | null;
  resource_id: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AuditStatistics {
  total: number;
  by_category: Record<string, number>;
  by_actor: Array<{ actor: string; count: number }>;
  recent_actions: Array<{
    action: string;
    category: AuditCategory;
    created_at: string;
  }>;
}

/**
 * Record audit event
 */
export async function recordAuditEvent(args: {
  tenantId: string;
  actor?: string;
  category: AuditCategory;
  action: string;
  resource?: string;
  resourceId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_audit_event", {
      p_tenant_id: args.tenantId,
      p_actor: args.actor || null,
      p_category: args.category,
      p_action: args.action,
      p_resource: args.resource || null,
      p_resource_id: args.resourceId || null,
      p_description: args.description || null,
      p_ip_address: args.ipAddress || null,
      p_user_agent: args.userAgent || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to record audit event: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List audit logs
 */
export async function listAuditLogs(
  tenantId: string,
  category?: AuditCategory,
  actor?: string,
  resource?: string,
  limit: number = 100
): Promise<AuditLog[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }

    if (actor) {
      query = query.eq("actor", actor);
    }

    if (resource) {
      query = query.eq("resource", resource);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Audit] Error listing audit logs:", error);
      return [];
    }

    return (data || []) as AuditLog[];
  } catch (err) {
    console.error("[Audit] Exception in listAuditLogs:", err);
    return [];
  }
}

/**
 * Get single audit log
 */
export async function getAuditLog(
  logId: string,
  tenantId: string
): Promise<AuditLog | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("id", logId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Audit] Error fetching audit log:", error);
      return null;
    }

    return data as AuditLog;
  } catch (err) {
    console.error("[Audit] Exception in getAuditLog:", err);
    return null;
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(
  tenantId: string,
  days: number = 30
): Promise<AuditStatistics> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_audit_statistics", {
      p_tenant_id: tenantId,
      p_days: days,
    });

    if (error) {
      console.error("[Audit] Error getting statistics:", error);
      return {
        total: 0,
        by_category: {},
        by_actor: [],
        recent_actions: [],
      };
    }

    return data as AuditStatistics;
  } catch (err) {
    console.error("[Audit] Exception in getAuditStatistics:", err);
    return {
      total: 0,
      by_category: {},
      by_actor: [],
      recent_actions: [],
    };
  }
}

/**
 * Search audit logs by date range
 */
export async function searchAuditLogs(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  category?: AuditCategory,
  actor?: string
): Promise<AuditLog[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (actor) {
      query = query.eq("actor", actor);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Audit] Error searching audit logs:", error);
      return [];
    }

    return (data || []) as AuditLog[];
  } catch (err) {
    console.error("[Audit] Exception in searchAuditLogs:", err);
    return [];
  }
}
