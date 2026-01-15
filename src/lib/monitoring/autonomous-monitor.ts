/**
 * Autonomous Monitoring System
 *
 * Self-contained monitoring using database storage and email alerts.
 * No external dependencies (Sentry, Datadog, etc.)
 */

import * as Sentry from '@sentry/nextjs';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email/email-service';
import { log } from '@/lib/logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  FATAL = 'FATAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

/**
 * Error priority levels
 */
export enum ErrorPriority {
  P0_CRITICAL = 'P0_CRITICAL', // System down, data loss, security breach
  P1_HIGH = 'P1_HIGH',         // Major feature broken, significant revenue impact
  P2_MEDIUM = 'P2_MEDIUM',     // Minor feature broken, workaround exists
  P3_LOW = 'P3_LOW',           // Cosmetic issue, low impact
  P4_TRIVIAL = 'P4_TRIVIAL',   // Nice to have, minimal impact
}

/**
 * Performance metric types
 */
export enum MetricType {
  API_REQUEST = 'API_REQUEST',
  DATABASE_QUERY = 'DATABASE_QUERY',
  AI_REQUEST = 'AI_REQUEST',
  PAGE_LOAD = 'PAGE_LOAD',
}

/**
 * Alert types
 */
export enum AlertType {
  ERROR = 'ERROR',
  PERFORMANCE = 'PERFORMANCE',
  HEALTH = 'HEALTH',
  SECURITY = 'SECURITY',
  BUSINESS = 'BUSINESS',
}

/**
 * Log an error to the database
 */
export async function logError(params: {
  severity: ErrorSeverity;
  priority: ErrorPriority;
  errorType: string;
  message: string;
  stackTrace?: string;
  context?: Record<string, any>;
  userId?: string;
  workspaceId?: string;
  route?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('log_system_error', {
        p_severity: params.severity,
        p_priority: params.priority,
        p_error_type: params.errorType,
        p_message: params.message,
        p_stack_trace: params.stackTrace || null,
        p_context: params.context || {},
        p_user_id: params.userId || null,
        p_workspace_id: params.workspaceId || null,
        p_route: params.route || null,
      });

    if (error) {
      log.error('Failed to log error to database', { error, params });
      return null;
    }

    // Trigger alert for critical/high priority errors
    if (params.priority === ErrorPriority.P0_CRITICAL || params.priority === ErrorPriority.P1_HIGH) {
      // Send to Sentry for tracking
      Sentry.captureException(new Error(params.message), {
        level: params.priority === ErrorPriority.P0_CRITICAL ? 'fatal' : 'error',
        tags: {
          priority: params.priority,
          severity: params.severity,
          source: 'autonomous-monitor',
          route: params.route || 'unknown',
        },
        extra: {
          errorType: params.errorType,
          stackTrace: params.stackTrace,
          context: params.context,
          workspaceId: params.workspaceId,
          userId: params.userId,
        },
      });

      // Send email alert
      await sendCriticalErrorAlert({
        errorId: data,
        severity: params.severity,
        priority: params.priority,
        message: params.message,
        route: params.route,
      });
    }

    return data;
  } catch (error) {
    log.error('Exception in logError', { error, params });
    return null;
  }
}

/**
 * Log performance metrics to the database
 */
export async function logPerformance(params: {
  metricType: MetricType;
  operation: string;
  durationMs: number;
  route?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('log_performance', {
        p_metric_type: params.metricType,
        p_operation: params.operation,
        p_duration_ms: params.durationMs,
        p_route: params.route || null,
        p_method: params.method || null,
        p_status_code: params.statusCode || null,
        p_metadata: params.metadata || {},
      });

    if (error) {
      log.error('Failed to log performance metric', { error, params });
      return null;
    }

    return data;
  } catch (error) {
    log.error('Exception in logPerformance', { error, params });
    return null;
  }
}

/**
 * Log health check results
 */
export async function logHealthCheck(params: {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  checks: Record<string, any>;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  criticalIssues: string[];
  warningsList: string[];
  executionTimeMs?: number;
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_health_checks')
      .insert({
        overall_status: params.overallStatus,
        checks: params.checks,
        total_checks: params.totalChecks,
        passed_checks: params.passedChecks,
        failed_checks: params.failedChecks,
        warnings: params.warnings,
        critical_issues: params.criticalIssues,
        warnings_list: params.warningsList,
        execution_time_ms: params.executionTimeMs,
      })
      .select('id')
      .single();

    if (error) {
      log.error('Failed to log health check', { error, params });
      return null;
    }

    // Send alert if status is degraded or critical
    if (params.overallStatus !== 'healthy') {
      await sendHealthAlert({
        healthCheckId: data.id,
        status: params.overallStatus,
        criticalIssues: params.criticalIssues,
        warnings: params.warningsList,
      });
    }

    return data.id;
  } catch (error) {
    log.error('Exception in logHealthCheck', { error, params });
    return null;
  }
}

/**
 * Log uptime check
 */
export async function logUptimeCheck(params: {
  endpoint: string;
  method?: string;
  expectedStatus?: number;
  actualStatus: number;
  responseTimeMs: number;
  errorMessage?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('uptime_checks')
      .insert({
        endpoint: params.endpoint,
        method: params.method || 'GET',
        expected_status: params.expectedStatus || 200,
        actual_status: params.actualStatus,
        response_time_ms: params.responseTimeMs,
        error_message: params.errorMessage,
      })
      .select('id')
      .single();

    if (error) {
      log.error('Failed to log uptime check', { error, params });
      return null;
    }

    return data.id;
  } catch (error) {
    log.error('Exception in logUptimeCheck', { error, params });
    return null;
  }
}

/**
 * Send critical error alert via email
 */
async function sendCriticalErrorAlert(params: {
  errorId: string;
  severity: ErrorSeverity;
  priority: ErrorPriority;
  message: string;
  route?: string;
}): Promise<void> {
  try {
    const alertEmails = process.env.ALERT_EMAILS?.split(',') || [];

    if (alertEmails.length === 0) {
      log.warn('No ALERT_EMAILS configured - skipping error alert');
      return;
    }

    const subject = `🚨 ${params.priority} Error: ${params.message.substring(0, 50)}`;
    const html = `
      <h1 style="color: #dc2626;">Critical Error Detected</h1>
      <p><strong>Priority:</strong> ${params.priority}</p>
      <p><strong>Severity:</strong> ${params.severity}</p>
      <p><strong>Route:</strong> ${params.route || 'N/A'}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <hr>
      <h2>Error Message:</h2>
      <p>${params.message}</p>
      <hr>
      <p><small>Error ID: ${params.errorId}</small></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/monitoring/errors/${params.errorId}">View Error Details</a></p>
    `;

    for (const email of alertEmails) {
      await sendEmail({
        to: email.trim(),
        subject,
        html,
        text: `${params.priority} Error: ${params.message}`,
      });

      // Log the alert
      await supabaseAdmin.from('alert_notifications').insert({
        alert_type: AlertType.ERROR,
        severity: params.priority === ErrorPriority.P0_CRITICAL ? 'CRITICAL' : 'HIGH',
        title: subject,
        message: params.message,
        sent_to: [email.trim()],
        send_method: 'EMAIL',
        sent: true,
        sent_at: new Date().toISOString(),
        related_error_id: params.errorId,
      });
    }

    log.info('Critical error alert sent', { errorId: params.errorId, recipients: alertEmails.length });
  } catch (error) {
    log.error('Failed to send critical error alert', { error, params });
  }
}

/**
 * Send health alert via email
 */
async function sendHealthAlert(params: {
  healthCheckId: string;
  status: 'degraded' | 'critical';
  criticalIssues: string[];
  warnings: string[];
}): Promise<void> {
  try {
    const alertEmails = process.env.ALERT_EMAILS?.split(',') || [];

    if (alertEmails.length === 0) {
      log.warn('No ALERT_EMAILS configured - skipping health alert');
      return;
    }

    const subject = `${params.status === 'critical' ? '🚨' : '⚠️'} System Health: ${params.status.toUpperCase()}`;
    const html = `
      <h1 style="color: ${params.status === 'critical' ? '#dc2626' : '#f59e0b'};">System Health Alert</h1>
      <p><strong>Status:</strong> ${params.status.toUpperCase()}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <hr>
      ${params.criticalIssues.length > 0 ? `
        <h2>Critical Issues:</h2>
        <ul>
          ${params.criticalIssues.map(issue => `<li style="color: #dc2626;">${issue}</li>`).join('')}
        </ul>
      ` : ''}
      ${params.warnings.length > 0 ? `
        <h2>Warnings:</h2>
        <ul>
          ${params.warnings.map(warning => `<li style="color: #f59e0b;">${warning}</li>`).join('')}
        </ul>
      ` : ''}
      <hr>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/monitoring/health/${params.healthCheckId}">View Health Report</a></p>
    `;

    for (const email of alertEmails) {
      await sendEmail({
        to: email.trim(),
        subject,
        html,
        text: `System health is ${params.status}. Critical issues: ${params.criticalIssues.length}, Warnings: ${params.warnings.length}`,
      });

      // Log the alert
      await supabaseAdmin.from('alert_notifications').insert({
        alert_type: AlertType.HEALTH,
        severity: params.status === 'critical' ? 'CRITICAL' : 'MEDIUM',
        title: subject,
        message: `Critical issues: ${params.criticalIssues.length}, Warnings: ${params.warnings.length}`,
        sent_to: [email.trim()],
        send_method: 'EMAIL',
        sent: true,
        sent_at: new Date().toISOString(),
        related_health_check_id: params.healthCheckId,
      });
    }

    log.info('Health alert sent', { healthCheckId: params.healthCheckId, recipients: alertEmails.length });
  } catch (error) {
    log.error('Failed to send health alert', { error, params });
  }
}

/**
 * Get error statistics
 */
export async function getErrorStats(hours: number = 24): Promise<any> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_error_stats', { p_hours: hours });

    if (error) {
      log.error('Failed to get error stats', { error });
      return null;
    }

    return data;
  } catch (error) {
    log.error('Exception in getErrorStats', { error });
    return null;
  }
}

/**
 * Check system health (using database function)
 */
export async function checkSystemHealth(): Promise<any> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('check_system_health');

    if (error) {
      log.error('Failed to check system health', { error });
      return null;
    }

    return data;
  } catch (error) {
    log.error('Exception in checkSystemHealth', { error });
    return null;
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrors(limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      log.error('Failed to get recent errors', { error });
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Exception in getRecentErrors', { error });
    return [];
  }
}

/**
 * Get slow queries/requests
 */
export async function getSlowRequests(hours: number = 1, limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('performance_logs')
      .select('*')
      .eq('is_slow', true)
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('duration_ms', { ascending: false })
      .limit(limit);

    if (error) {
      log.error('Failed to get slow requests', { error });
      return [];
    }

    return data || [];
  } catch (error) {
    log.error('Exception in getSlowRequests', { error });
    return [];
  }
}

/**
 * Cleanup old logs (called via cron job)
 */
export async function cleanupOldLogs(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('cleanup_monitoring_logs');

    if (error) {
      log.error('Failed to cleanup old logs', { error });
      return 0;
    }

    log.info('Old monitoring logs cleaned up', { deletedCount: data });
    return data || 0;
  } catch (error) {
    log.error('Exception in cleanupOldLogs', { error });
    return 0;
  }
}
