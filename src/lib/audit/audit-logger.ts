/**
 * Centralized Audit Logger
 *
 * P3-2: Expanded Audit Logging System
 *
 * Provides comprehensive audit logging for:
 * - Admin actions
 * - Authentication events
 * - Data access operations
 * - Security events
 *
 * Integrates with both:
 * - src/lib/auth/audit-logger.ts (auth-specific events)
 * - src/core/security/audit-logger.ts (security-focused events)
 *
 * This module serves as the central audit logger for all non-auth
 * and non-security-specific events (admin, data access, etc.)
 *
 * @module lib/audit/audit-logger
 */

import { getSupabaseServer } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Audit event types
 */
export type AuditEventType =
  // Admin actions
  | 'admin.user_created'
  | 'admin.user_deleted'
  | 'admin.user_updated'
  | 'admin.role_changed'
  | 'admin.permissions_changed'
  | 'admin.workspace_created'
  | 'admin.workspace_deleted'
  | 'admin.workspace_settings_changed'
  | 'admin.billing_changed'
  | 'admin.feature_flag_changed'
  | 'admin.system_config_changed'

  // Data access events
  | 'data.contact_viewed'
  | 'data.contact_exported'
  | 'data.bulk_export'
  | 'data.email_viewed'
  | 'data.campaign_viewed'
  | 'data.report_generated'
  | 'data.sensitive_field_accessed'

  // Authentication events (reference - handled by auth/audit-logger)
  | 'auth.login'
  | 'auth.logout'
  | 'auth.token_refresh'
  | 'auth.failed_login'
  | 'auth.password_reset'
  | 'auth.mfa_enabled'
  | 'auth.mfa_disabled'

  // Security events
  | 'security.rate_limit_exceeded'
  | 'security.suspicious_activity'
  | 'security.ip_blocked'
  | 'security.unauthorized_access'
  | 'security.api_key_leaked'
  | 'security.webhook_signature_invalid'

  // Integration events
  | 'integration.connected'
  | 'integration.disconnected'
  | 'integration.sync_started'
  | 'integration.sync_completed'
  | 'integration.sync_failed'

  // Billing events
  | 'billing.subscription_created'
  | 'billing.subscription_updated'
  | 'billing.subscription_cancelled'
  | 'billing.payment_succeeded'
  | 'billing.payment_failed'

  // Agent events
  | 'agent.workflow_started'
  | 'agent.workflow_completed'
  | 'agent.workflow_failed'
  | 'agent.content_generated'
  | 'agent.email_processed';

/**
 * Audit severity levels
 */
export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/**
 * Audit event metadata
 */
export interface AuditMetadata {
  [key: string]: unknown;
  targetUserId?: string;
  targetWorkspaceId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  reason?: string;
  count?: number;
  duration?: number;
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  action: AuditEventType;
  userId?: string;
  email?: string;
  workspaceId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: AuditMetadata;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  success: boolean;
  errorMessage?: string;
}

/**
 * Base audit logging function
 *
 * @param entry - Audit log entry
 * @returns Promise<void>
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await getSupabaseServer();

    await supabase.from('audit_logs').insert({
      action: entry.action,
      user_id: entry.userId,
      email: entry.email,
      workspace_id: entry.workspaceId,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      metadata: entry.metadata,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      severity: entry.severity || 'INFO',
      success: entry.success,
      error_message: entry.errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log to console but don't throw - audit logging shouldn't break the app
    console.error('[AuditLogger] Failed to log audit event:', error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * ADMIN ACTIONS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Log admin action
 *
 * @param userId - Admin user ID
 * @param action - Action type (e.g., 'user_created', 'role_changed')
 * @param target - Target resource type
 * @param metadata - Additional metadata
 */
export async function logAdminAction(
  userId: string,
  action: string,
  target: string,
  metadata?: AuditMetadata
): Promise<void> {
  await logAuditEvent({
    action: `admin.${action}` as AuditEventType,
    userId,
    resourceType: 'admin',
    resourceId: target,
    metadata,
    severity: 'INFO',
    success: true,
  });
}

/**
 * Log user management action
 */
export async function logUserManagement(
  adminUserId: string,
  action: 'created' | 'updated' | 'deleted',
  targetUserId: string,
  changes?: Record<string, { old: unknown; new: unknown }>
): Promise<void> {
  await logAuditEvent({
    action: `admin.user_${action}` as AuditEventType,
    userId: adminUserId,
    resourceType: 'user',
    resourceId: targetUserId,
    metadata: {
      targetUserId,
      changes,
    },
    severity: action === 'deleted' ? 'WARN' : 'INFO',
    success: true,
  });
}

/**
 * Log role or permission change
 */
export async function logRoleChange(
  adminUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  workspaceId?: string
): Promise<void> {
  await logAuditEvent({
    action: 'admin.role_changed',
    userId: adminUserId,
    workspaceId,
    resourceType: 'user_role',
    resourceId: targetUserId,
    metadata: {
      targetUserId,
      changes: {
        role: { old: oldRole, new: newRole },
      },
    },
    severity: 'WARN',
    success: true,
  });
}

/**
 * Log workspace management action
 */
export async function logWorkspaceManagement(
  adminUserId: string,
  action: 'created' | 'deleted' | 'settings_changed',
  workspaceId: string,
  metadata?: AuditMetadata
): Promise<void> {
  await logAuditEvent({
    action: `admin.workspace_${action}` as AuditEventType,
    userId: adminUserId,
    workspaceId,
    resourceType: 'workspace',
    resourceId: workspaceId,
    metadata,
    severity: action === 'deleted' ? 'WARN' : 'INFO',
    success: true,
  });
}

/**
 * Log system configuration change
 */
export async function logSystemConfigChange(
  adminUserId: string,
  configKey: string,
  oldValue: unknown,
  newValue: unknown,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    action: 'admin.system_config_changed',
    userId: adminUserId,
    resourceType: 'system_config',
    resourceId: configKey,
    metadata: {
      changes: {
        [configKey]: { old: oldValue, new: newValue },
      },
      reason,
    },
    severity: 'WARN',
    success: true,
  });
}

/**
 * ═══════════════════════════════════════════════════════════
 * DATA ACCESS EVENTS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Log data access event
 *
 * @param userId - User accessing data
 * @param table - Database table or resource type
 * @param recordId - Record ID being accessed
 * @param action - Action performed (viewed, exported, etc.)
 * @param workspaceId - Workspace context
 */
export async function logDataAccess(
  userId: string,
  table: string,
  recordId: string,
  action: 'viewed' | 'exported' | 'accessed',
  workspaceId?: string
): Promise<void> {
  // Only log sensitive data access (contacts, emails, campaigns)
  const sensitiveResources = ['contacts', 'emails', 'campaigns', 'integrations', 'generated_content'];

  if (!sensitiveResources.includes(table)) {
    return; // Don't log non-sensitive data access
  }

  await logAuditEvent({
    action: `data.${table.replace(/s$/, '')}_${action}` as AuditEventType,
    userId,
    workspaceId,
    resourceType: table,
    resourceId: recordId,
    metadata: {
      action,
    },
    severity: 'DEBUG',
    success: true,
  });
}

/**
 * Log bulk data export
 */
export async function logBulkExport(
  userId: string,
  resourceType: string,
  count: number,
  workspaceId?: string,
  format?: string
): Promise<void> {
  await logAuditEvent({
    action: 'data.bulk_export',
    userId,
    workspaceId,
    resourceType,
    metadata: {
      count,
      format: format || 'csv',
    },
    severity: 'INFO',
    success: true,
  });
}

/**
 * Log sensitive field access
 */
export async function logSensitiveFieldAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  fieldName: string,
  workspaceId?: string
): Promise<void> {
  await logAuditEvent({
    action: 'data.sensitive_field_accessed',
    userId,
    workspaceId,
    resourceType,
    resourceId,
    metadata: {
      fieldName,
    },
    severity: 'WARN',
    success: true,
  });
}

/**
 * Log report generation
 */
export async function logReportGeneration(
  userId: string,
  reportType: string,
  workspaceId?: string,
  parameters?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action: 'data.report_generated',
    userId,
    workspaceId,
    resourceType: 'report',
    resourceId: reportType,
    metadata: {
      reportType,
      parameters,
    },
    severity: 'INFO',
    success: true,
  });
}

/**
 * ═══════════════════════════════════════════════════════════
 * AUTHENTICATION EVENTS (Delegated to auth/audit-logger)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Log authentication event
 *
 * NOTE: This is a pass-through to src/lib/auth/audit-logger.ts
 * Use that module directly for auth events.
 *
 * @deprecated Use logAuthSuccess/logAuthFailure from @/lib/auth/audit-logger
 */
export async function logAuthEvent(
  userId: string,
  event: string,
  metadata?: AuditMetadata
): Promise<void> {
  console.warn('[AuditLogger] logAuthEvent is deprecated. Use @/lib/auth/audit-logger instead.');

  await logAuditEvent({
    action: `auth.${event}` as AuditEventType,
    userId,
    metadata,
    severity: 'INFO',
    success: true,
  });
}

/**
 * ═══════════════════════════════════════════════════════════
 * SECURITY EVENTS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Log security event
 *
 * @param eventType - Security event type
 * @param severity - Event severity
 * @param metadata - Additional context
 */
export async function logSecurityEvent(
  eventType: string,
  severity: AuditSeverity,
  metadata?: AuditMetadata
): Promise<void> {
  await logAuditEvent({
    action: `security.${eventType}` as AuditEventType,
    metadata,
    severity,
    success: false, // Security events are typically failures
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  userId: string | undefined,
  endpoint: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: 'security.rate_limit_exceeded',
    userId,
    resourceType: 'api',
    resourceId: endpoint,
    ipAddress,
    userAgent,
    metadata: {
      endpoint,
    },
    severity: 'WARN',
    success: false,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId: string | undefined,
  activityType: string,
  reason: string,
  metadata?: AuditMetadata
): Promise<void> {
  await logAuditEvent({
    action: 'security.suspicious_activity',
    userId,
    metadata: {
      activityType,
      reason,
      ...metadata,
    },
    severity: 'ERROR',
    success: false,
    errorMessage: reason,
  });
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  userId: string | undefined,
  resourceType: string,
  resourceId: string,
  reason?: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: 'security.unauthorized_access',
    userId,
    resourceType,
    resourceId,
    ipAddress,
    metadata: {
      reason,
    },
    severity: 'ERROR',
    success: false,
    errorMessage: reason,
  });
}

/**
 * ═══════════════════════════════════════════════════════════
 * QUERY FUNCTIONS
 * ═══════════════════════════════════════════════════════════
 */

export interface AuditLogFilter {
  userId?: string;
  workspaceId?: string;
  resourceType?: string;
  action?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query audit logs with filters
 *
 * @param filter - Filter criteria
 * @returns Promise<AuditLogEntry[]>
 */
export async function queryAuditLogs(filter: AuditLogFilter): Promise<unknown[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.userId) {
    query = query.eq('user_id', filter.userId);
  }
  if (filter.workspaceId) {
    query = query.eq('workspace_id', filter.workspaceId);
  }
  if (filter.resourceType) {
    query = query.eq('resource_type', filter.resourceType);
  }
  if (filter.action) {
    query = query.ilike('action', `%${filter.action}%`);
  }
  if (filter.severity) {
    query = query.eq('severity', filter.severity);
  }
  if (filter.startDate) {
    query = query.gte('created_at', filter.startDate.toISOString());
  }
  if (filter.endDate) {
    query = query.lte('created_at', filter.endDate.toISOString());
  }
  if (filter.limit) {
    query = query.limit(filter.limit);
  }
  if (filter.offset) {
    query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AuditLogger] Failed to query audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
  }
): Promise<unknown[]> {
  return queryAuditLogs({
    userId,
    ...options,
  });
}

/**
 * Get audit logs for a workspace
 */
export async function getWorkspaceAuditLogs(
  workspaceId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
  }
): Promise<unknown[]> {
  return queryAuditLogs({
    workspaceId,
    ...options,
  });
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
  limit: number = 50
): Promise<unknown[]> {
  return queryAuditLogs({
    action: 'security.',
    severity: 'ERROR',
    limit,
  });
}

/**
 * Get admin activity log
 */
export async function getAdminActivityLog(
  adminUserId?: string,
  limit: number = 100
): Promise<unknown[]> {
  return queryAuditLogs({
    userId: adminUserId,
    action: 'admin.',
    limit,
  });
}

/**
 * ═══════════════════════════════════════════════════════════
 * UTILITY FUNCTIONS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Extract IP address from request
 */
export function extractIpAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Extract user agent from request
 */
export function extractUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
