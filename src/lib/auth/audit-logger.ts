/**
 * Audit Logger for Auth Events
 *
 * Source: docs/abacus/auth-map.json
 * Purpose: Track authentication and authorization events
 */

import { getSupabaseServer } from "@/lib/supabase";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.token_refresh"
  | "auth.failed_login"
  | "access.granted"
  | "access.denied"
  | "workspace.switch"
  | "workspace.create"
  | "admin.action"
  | "api.request";

export interface AuditEntry {
  action: AuditAction;
  userId?: string;
  email?: string;
  workspaceId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await getSupabaseServer();

    await supabase.from("audit_logs").insert({
      action: entry.action,
      user_id: entry.userId,
      email: entry.email,
      workspace_id: entry.workspaceId,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      metadata: entry.metadata,
      ip_address: entry.ip,
      user_agent: entry.userAgent,
      success: entry.success,
      error_message: entry.errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log to console but don't throw - audit logging shouldn't break the app
    console.error("Audit logging failed:", error);
  }
}

/**
 * Log successful authentication
 */
export async function logAuthSuccess(
  userId: string,
  email: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action: "auth.login",
    userId,
    email,
    metadata,
    success: true,
  });
}

/**
 * Log failed authentication
 */
export async function logAuthFailure(
  email?: string,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action: "auth.failed_login",
    email,
    metadata: { ...metadata, reason },
    success: false,
    errorMessage: reason,
  });
}

/**
 * Log access granted
 */
export async function logAccessGranted(
  userId: string,
  resourceType: string,
  resourceId?: string,
  workspaceId?: string
): Promise<void> {
  await logAuditEvent({
    action: "access.granted",
    userId,
    resourceType,
    resourceId,
    workspaceId,
    success: true,
  });
}

/**
 * Log access denied
 */
export async function logAccessDenied(
  userId: string | undefined,
  resourceType: string,
  resourceId?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action: "access.denied",
    userId,
    resourceType,
    resourceId,
    success: false,
    errorMessage: reason,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  userId: string,
  action: string,
  targetUserId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action: "admin.action",
    userId,
    resourceType: "admin",
    metadata: { action, targetUserId, ...metadata },
    success: true,
  });
}

/**
 * Log workspace switch
 */
export async function logWorkspaceSwitch(
  userId: string,
  fromWorkspaceId: string | undefined,
  toWorkspaceId: string
): Promise<void> {
  await logAuditEvent({
    action: "workspace.switch",
    userId,
    workspaceId: toWorkspaceId,
    metadata: { fromWorkspaceId },
    success: true,
  });
}

/**
 * Log API request (for high-value endpoints)
 */
export async function logApiRequest(
  userId: string | undefined,
  endpoint: string,
  method: string,
  workspaceId?: string,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    action: "api.request",
    userId,
    workspaceId,
    resourceType: "api",
    resourceId: endpoint,
    metadata: { method },
    success,
    errorMessage,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
  }
): Promise<unknown[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.action) {
    query = query.eq("action", options.action);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs for a workspace
 */
export async function getWorkspaceAuditLogs(
  workspaceId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
  }
): Promise<unknown[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (options?.action) {
    query = query.eq("action", options.action);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }

  return data || [];
}
