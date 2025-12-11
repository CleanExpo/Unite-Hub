/**
 * Admin Security Center Service (Phase E20)
 *
 * User session tracking and security event monitoring
 * Server-side only - never expose to client
 *
 * @module securityCenterService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export type SecurityEventType =
  | "login_success"
  | "login_failure"
  | "logout"
  | "mfa_enabled"
  | "mfa_disabled"
  | "mfa_verified"
  | "mfa_failed"
  | "password_changed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_changed"
  | "permission_granted"
  | "permission_revoked"
  | "session_created"
  | "session_invalidated"
  | "api_key_created"
  | "api_key_revoked"
  | "suspicious_activity"
  | "account_locked"
  | "account_unlocked"
  | "other";

export type SecurityEventSeverity = "info" | "warning" | "critical";

export type SessionStatus = "active" | "expired" | "revoked" | "logged_out";

export interface UserSession {
  id: string;
  tenant_id: string;
  user_id: string;
  session_token: string;
  status: SessionStatus;
  device_info: string | null;
  browser_info: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  last_active_at: string;
  created_at: string;
  expires_at: string;
  invalidated_at: string | null;
  metadata: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  tenant_id: string;
  user_id: string | null;
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  resource: string | null;
  resource_id: string | null;
  success: boolean;
  failure_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SecurityEventSummary {
  total: number;
  critical: number;
  warnings: number;
  failed_logins: number;
  by_type: Record<string, number>;
  period_days: number;
}

/**
 * Create user session
 */
export async function createUserSession(args: {
  tenantId: string;
  userId: string;
  sessionToken: string;
  deviceInfo?: string;
  browserInfo?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("create_user_session", {
      p_tenant_id: args.tenantId,
      p_user_id: args.userId,
      p_session_token: args.sessionToken,
      p_device_info: args.deviceInfo || null,
      p_browser_info: args.browserInfo || null,
      p_ip_address: args.ipAddress || null,
      p_country: args.country || null,
      p_city: args.city || null,
      p_expires_at: args.expiresAt?.toISOString() || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List user sessions for tenant
 */
export async function listUserSessions(
  tenantId: string,
  status?: SessionStatus,
  limit: number = 100
): Promise<UserSession[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    let query = supabaseAdmin
      .from("user_sessions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("last_active_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Security] Error listing sessions:", error);
      return [];
    }

    return (data || []) as UserSession[];
  } catch (err) {
    console.error("[Security] Exception in listUserSessions:", err);
    return [];
  }
}

/**
 * Get active sessions
 */
export async function getActiveSessions(tenantId: string): Promise<UserSession[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_active_sessions", {
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[Security] Error getting active sessions:", error);
      return [];
    }

    return (data || []) as UserSession[];
  } catch (err) {
    console.error("[Security] Exception in getActiveSessions:", err);
    return [];
  }
}

/**
 * Get single session
 */
export async function getUserSession(
  sessionId: string,
  tenantId: string
): Promise<UserSession | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("user_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("tenant_id", tenantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[Security] Error fetching session:", error);
      return null;
    }

    return data as UserSession;
  } catch (err) {
    console.error("[Security] Exception in getUserSession:", err);
    return null;
  }
}

/**
 * Invalidate session
 */
export async function invalidateSession(
  sessionId: string,
  tenantId: string
): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("invalidate_session", {
      p_session_id: sessionId,
      p_tenant_id: tenantId,
    });

    if (error) {
      throw new Error(`Failed to invalidate session: ${error.message}`);
    }
  } catch (err) {
    throw err;
  }
}

/**
 * Record security event
 */
export async function recordSecurityEvent(args: {
  tenantId: string;
  userId?: string;
  eventType: SecurityEventType;
  severity?: SecurityEventSeverity;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  failureReason?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("record_security_event", {
      p_tenant_id: args.tenantId,
      p_user_id: args.userId || null,
      p_event_type: args.eventType,
      p_severity: args.severity || "info",
      p_description: args.description || null,
      p_ip_address: args.ipAddress || null,
      p_user_agent: args.userAgent || null,
      p_session_id: args.sessionId || null,
      p_resource: args.resource || null,
      p_resource_id: args.resourceId || null,
      p_success: args.success ?? true,
      p_failure_reason: args.failureReason || null,
      p_metadata: args.metadata || {},
    });

    if (error) {
      throw new Error(`Failed to record security event: ${error.message}`);
    }

    return data as string;
  } catch (err) {
    throw err;
  }
}

/**
 * List security events
 */
export async function listSecurityEvents(
  tenantId: string,
  eventType?: SecurityEventType,
  severity?: SecurityEventSeverity,
  limit: number = 100
): Promise<SecurityEvent[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    let query = supabaseAdmin
      .from("security_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Security] Error listing events:", error);
      return [];
    }

    return (data || []) as SecurityEvent[];
  } catch (err) {
    console.error("[Security] Exception in listSecurityEvents:", err);
    return [];
  }
}

/**
 * Get security event summary
 */
export async function getSecurityEventSummary(
  tenantId: string,
  days: number = 30
): Promise<SecurityEventSummary> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_security_event_summary", {
      p_tenant_id: tenantId,
      p_days: days,
    });

    if (error) {
      console.error("[Security] Error getting summary:", error);
      return {
        total: 0,
        critical: 0,
        warnings: 0,
        failed_logins: 0,
        by_type: {},
        period_days: days,
      };
    }

    return data as SecurityEventSummary;
  } catch (err) {
    console.error("[Security] Exception in getSecurityEventSummary:", err);
    return {
      total: 0,
      critical: 0,
      warnings: 0,
      failed_logins: 0,
      by_type: {},
      period_days: days,
    };
  }
}

/**
 * Cleanup expired sessions (cron job helper)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { error } = await supabaseAdmin.rpc("cleanup_expired_sessions");

    if (error) {
      throw new Error(`Failed to cleanup sessions: ${error.message}`);
    }
  } catch (err) {
    console.error("[Security] Exception in cleanupExpiredSessions:", err);
    throw err;
  }
}

/**
 * Get user sessions by user ID
 */
export async function getUserSessionsByUser(
  userId: string,
  tenantId: string,
  limit: number = 50
): Promise<UserSession[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .order("last_active_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Security] Error listing user sessions:", error);
      return [];
    }

    return (data || []) as UserSession[];
  } catch (err) {
    console.error("[Security] Exception in getUserSessionsByUser:", err);
    return [];
  }
}

/**
 * Get recent failed login attempts
 */
export async function getFailedLoginAttempts(
  tenantId: string,
  hours: number = 24
): Promise<SecurityEvent[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("securityCenterService must only run on server");
    }

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("security_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("event_type", "login_failure")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Security] Error getting failed logins:", error);
      return [];
    }

    return (data || []) as SecurityEvent[];
  } catch (err) {
    console.error("[Security] Exception in getFailedLoginAttempts:", err);
    return [];
  }
}
