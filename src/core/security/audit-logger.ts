/**
 * Audit Logger
 *
 * Security-focused audit logging for all significant operations.
 * Logs to database and optionally to external services.
 *
 * @module core/security/audit-logger
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import {
  AuditLogEntry,
  AuditLogFilter,
  AuditSeverity,
  AuditCategory,
} from './types';

/**
 * Create a new audit log entry
 */
export function createAuditEntry(
  category: AuditCategory,
  action: string,
  options: Partial<AuditLogEntry> = {}
): AuditLogEntry {
  return {
    timestamp: new Date(),
    severity: options.severity || 'INFO',
    category,
    action,
    success: options.success ?? true,
    ...options,
  };
}

/**
 * Extract request metadata for audit logs
 */
export function extractRequestMetadata(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
  path: string;
  method: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return {
    ipAddress,
    userAgent,
    path: request.nextUrl.pathname,
    method: request.method,
  };
}

/**
 * Audit logger class
 *
 * Provides structured logging with database persistence.
 */
export class AuditLogger {
  private supabase: SupabaseClient | null = null;
  private buffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly bufferSize = 50;
  private readonly flushIntervalMs = 5000;

  /**
   * Initialize the audit logger with a Supabase client
   */
  initialize(supabase: SupabaseClient): void {
    this.supabase = supabase;
    this.startFlushInterval();
  }

  /**
   * Start periodic flush of buffered logs
   */
  private startFlushInterval(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushIntervalMs);
  }

  /**
   * Stop the flush interval
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Log an audit entry
   *
   * @param entry - Audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry);
    }

    // Buffer for database write
    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: AuditLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.severity.padEnd(8);
    const category = entry.category.padEnd(12);
    const status = entry.success ? 'OK' : 'FAIL';

    const message = `[AUDIT] ${timestamp} ${level} [${category}] ${entry.action} - ${status}`;

    switch (entry.severity) {
      case 'ERROR':
      case 'CRITICAL':
        console.error(message, entry.metadata || '');
        break;
      case 'WARN':
        console.warn(message, entry.metadata || '');
        break;
      default:
        console.log(message, entry.metadata || '');
    }
  }

  /**
   * Flush buffered logs to database
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    if (!this.supabase) {
      console.warn('[AuditLogger] No Supabase client configured, skipping flush');
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(entries.map(e => ({
          timestamp: e.timestamp.toISOString(),
          severity: e.severity,
          category: e.category,
          action: e.action,
          user_id: e.userId,
          workspace_id: e.workspaceId,
          resource_type: e.resourceType,
          resource_id: e.resourceId,
          metadata: e.metadata,
          ip_address: e.ipAddress,
          user_agent: e.userAgent,
          duration_ms: e.duration,
          success: e.success,
          error_message: e.errorMessage,
        })));

      if (error) {
        console.error('[AuditLogger] Failed to write logs:', error.message);
        // Re-add failed entries to buffer (up to limit)
        this.buffer = [...entries.slice(0, this.bufferSize), ...this.buffer].slice(0, this.bufferSize * 2);
      }
    } catch (err) {
      console.error('[AuditLogger] Exception during flush:', err);
    }
  }

  /**
   * Query audit logs
   */
  async query(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    if (!this.supabase) {
      throw new Error('AuditLogger not initialized');
    }

    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.workspaceId) {
      query = query.eq('workspace_id', filter.workspaceId);
    }
    if (filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter.severity) {
      query = query.eq('severity', filter.severity);
    }
    if (filter.action) {
      query = query.ilike('action', `%${filter.action}%`);
    }
    if (filter.startDate) {
      query = query.gte('timestamp', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      query = query.lte('timestamp', filter.endDate.toISOString());
    }
    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      severity: row.severity as AuditSeverity,
      category: row.category as AuditCategory,
      action: row.action,
      userId: row.user_id,
      workspaceId: row.workspace_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      duration: row.duration_ms,
      success: row.success,
      errorMessage: row.error_message,
    }));
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

/**
 * Convenience functions for common audit scenarios
 */

export function logAuth(
  action: string,
  userId: string,
  options: Partial<AuditLogEntry> = {}
): Promise<void> {
  return auditLogger.log(createAuditEntry('AUTH', action, {
    userId,
    ...options,
  }));
}

export function logAccess(
  action: string,
  userId: string,
  workspaceId: string,
  options: Partial<AuditLogEntry> = {}
): Promise<void> {
  return auditLogger.log(createAuditEntry('ACCESS', action, {
    userId,
    workspaceId,
    ...options,
  }));
}

export function logData(
  action: string,
  resourceType: string,
  resourceId: string,
  options: Partial<AuditLogEntry> = {}
): Promise<void> {
  return auditLogger.log(createAuditEntry('DATA', action, {
    resourceType,
    resourceId,
    ...options,
  }));
}

export function logAgent(
  action: string,
  agentName: string,
  options: Partial<AuditLogEntry> = {}
): Promise<void> {
  return auditLogger.log(createAuditEntry('AGENT', action, {
    metadata: { agentName, ...options.metadata },
    ...options,
  }));
}

export function logSecurity(
  action: string,
  severity: AuditSeverity,
  options: Partial<AuditLogEntry> = {}
): Promise<void> {
  return auditLogger.log(createAuditEntry('SECURITY', action, {
    severity,
    ...options,
  }));
}
