/**
 * Audit & Observability Service (Phase E16)
 *
 * Comprehensive audit logging for security and compliance
 * Server-side only - never expose to client
 *
 * @module auditService
 */

import { supabaseAdmin } from "@/lib/supabase";

export type AuditEventType =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.logout"
  | "auth.password.changed"
  | "auth.mfa.enabled"
  | "auth.mfa.disabled"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "campaign.created"
  | "campaign.updated"
  | "campaign.deleted"
  | "campaign.sent"
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "content.published"
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "settings.updated"
  | "rbac.role.assigned"
  | "rbac.role.removed"
  | "rbac.permission.changed"
  | "export.requested"
  | "export.downloaded"
  | "feature_flag.changed"
  | "system.config.changed";

export interface AuditEvent {
  id: string;
  tenant_id: string;
  user_id: string | null;
  event_type: AuditEventType;
  resource: string | null;
  resource_id: string | null;
  action: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ApiRequestLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  route: string;
  method: string;
  status_code: number;
  latency_ms: number;
  request_size_bytes: number | null;
  response_size_bytes: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditSummary {
  total_events: number;
  auth_events: number;
  campaign_events: number;
  content_events: number;
  settings_events: number;
  time_window_hours: number;
}

/**
 * Record audit event
 *
 * @param event - Audit event data
 * @returns Event ID
 */
export async function recordAuditEvent(event: {
  tenantId: string;
  userId?: string;
  eventType: AuditEventType;
  resource?: string;
  resourceId?: string;
  action?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_audit_event", {
      p_tenant_id: event.tenantId,
      p_user_id: event.userId || null,
      p_event_type: event.eventType,
      p_resource: event.resource || null,
      p_resource_id: event.resourceId || null,
      p_action: event.action || null,
      p_metadata: event.metadata || {},
      p_ip_address: event.ipAddress || null,
      p_user_agent: event.userAgent || null,
    });

    if (error) {
      console.error("[Audit] Error recording event:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[Audit] Exception in recordAuditEvent:", err);
    return null;
  }
}

/**
 * Record API request log
 *
 * @param request - API request data
 * @returns Log ID
 */
export async function recordApiRequest(request: {
  tenantId?: string;
  userId?: string;
  route: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_api_request", {
      p_tenant_id: request.tenantId || null,
      p_user_id: request.userId || null,
      p_route: request.route,
      p_method: request.method,
      p_status_code: request.statusCode,
      p_latency_ms: request.latencyMs,
      p_request_size_bytes: request.requestSizeBytes || null,
      p_response_size_bytes: request.responseSizeBytes || null,
      p_ip_address: request.ipAddress || null,
      p_user_agent: request.userAgent || null,
    });

    if (error) {
      console.error("[Audit] Error recording API request:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[Audit] Exception in recordApiRequest:", err);
    return null;
  }
}

/**
 * List audit events for tenant
 *
 * @param tenantId - Tenant UUID
 * @param eventType - Optional event type filter
 * @param limit - Max results
 * @returns Array of audit events
 */
export async function listAuditEvents(
  tenantId: string,
  eventType?: AuditEventType,
  limit: number = 100
): Promise<AuditEvent[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    let query = supabaseAdmin
      .from("audit_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Audit] Error listing events:", error);
      return [];
    }

    return (data || []) as AuditEvent[];
  } catch (err) {
    console.error("[Audit] Exception in listAuditEvents:", err);
    return [];
  }
}

/**
 * List API request logs for tenant
 *
 * @param tenantId - Tenant UUID
 * @param route - Optional route filter
 * @param limit - Max results
 * @returns Array of request logs
 */
export async function listApiRequests(
  tenantId: string,
  route?: string,
  limit: number = 100
): Promise<ApiRequestLog[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    let query = supabaseAdmin
      .from("api_request_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (route) {
      query = query.eq("route", route);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Audit] Error listing API requests:", error);
      return [];
    }

    return (data || []) as ApiRequestLog[];
  } catch (err) {
    console.error("[Audit] Exception in listApiRequests:", err);
    return [];
  }
}

/**
 * Get audit summary for tenant
 *
 * @param tenantId - Tenant UUID
 * @param hours - Time window in hours
 * @returns Audit summary
 */
export async function getAuditSummary(
  tenantId: string,
  hours: number = 24
): Promise<AuditSummary | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_audit_summary", {
      p_tenant_id: tenantId,
      p_hours: hours,
    });

    if (error) {
      console.error("[Audit] Error getting summary:", error);
      return null;
    }

    return data as AuditSummary;
  } catch (err) {
    console.error("[Audit] Exception in getAuditSummary:", err);
    return null;
  }
}

/**
 * Get API performance metrics
 *
 * @param tenantId - Tenant UUID
 * @param route - Optional route filter
 * @param hours - Time window in hours
 * @returns Performance metrics
 */
export async function getApiMetrics(
  tenantId: string,
  route?: string,
  hours: number = 24
): Promise<{
  total_requests: number;
  avg_latency_ms: number;
  max_latency_ms: number;
  error_rate: number;
}> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("auditService must only run on server");
    }

    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - hours);

    let query = supabaseAdmin
      .from("api_request_logs")
      .select("latency_ms, status_code")
      .eq("tenant_id", tenantId)
      .gte("created_at", windowStart.toISOString());

    if (route) {
      query = query.eq("route", route);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Audit] Error fetching metrics:", error);
      return {
        total_requests: 0,
        avg_latency_ms: 0,
        max_latency_ms: 0,
        error_rate: 0,
      };
    }

    const totalRequests = data?.length || 0;
    const avgLatency =
      data && data.length > 0
        ? data.reduce((sum, r) => sum + r.latency_ms, 0) / data.length
        : 0;
    const maxLatency =
      data && data.length > 0
        ? Math.max(...data.map((r) => r.latency_ms))
        : 0;
    const errorCount =
      data?.filter((r) => r.status_code >= 400).length || 0;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    return {
      total_requests: totalRequests,
      avg_latency_ms: Math.round(avgLatency),
      max_latency_ms: maxLatency,
      error_rate: Math.round(errorRate * 100) / 100,
    };
  } catch (err) {
    console.error("[Audit] Exception in getApiMetrics:", err);
    return {
      total_requests: 0,
      avg_latency_ms: 0,
      max_latency_ms: 0,
      error_rate: 0,
    };
  }
}

/**
 * Helper: Extract IP and User-Agent from request
 *
 * @param req - Next.js request
 * @returns IP address and user agent
 */
export function extractRequestMetadata(req: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    null;

  const userAgent = req.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}
