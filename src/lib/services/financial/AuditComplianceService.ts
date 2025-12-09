/**
 * AuditComplianceService
 * Phase 12 Week 7-8: Audit trail, compliance logging, security events
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type EventCategory =
  | 'billing'
  | 'subscription'
  | 'usage'
  | 'access'
  | 'security'
  | 'data'
  | 'admin'
  | 'integration'
  | 'compliance';

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id: string;
  org_id: string;
  workspace_id?: string;
  user_id?: string;
  event_type: string;
  event_category: EventCategory;
  severity: Severity;
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata?: any;
  created_at: string;
}

export interface AuditEventInput {
  org_id: string;
  workspace_id?: string;
  user_id?: string;
  event_type: string;
  event_category: EventCategory;
  severity?: Severity;
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata?: any;
}

export interface AuditQueryOptions {
  start_date?: Date;
  end_date?: Date;
  category?: EventCategory;
  severity?: Severity;
  user_id?: string;
  workspace_id?: string;
  event_type?: string;
  resource_type?: string;
  limit?: number;
  offset?: number;
}

export interface ComplianceReport {
  org_id: string;
  report_period: {
    start: Date;
    end: Date;
  };
  summary: ComplianceSummary;
  security_events: SecurityEventSummary;
  access_patterns: AccessPatternSummary;
  data_changes: DataChangeSummary;
  recommendations: string[];
}

export interface ComplianceSummary {
  total_events: number;
  by_category: { [key: string]: number };
  by_severity: { [key: string]: number };
  critical_events: number;
  warning_events: number;
}

export interface SecurityEventSummary {
  failed_logins: number;
  permission_changes: number;
  suspicious_activities: number;
  data_exports: number;
}

export interface AccessPatternSummary {
  unique_users: number;
  total_sessions: number;
  peak_access_time: string;
  unusual_access_patterns: number;
}

export interface DataChangeSummary {
  records_created: number;
  records_updated: number;
  records_deleted: number;
  sensitive_data_access: number;
}

export class AuditComplianceService {
  /**
   * Log an audit event
   */
  async logEvent(event: AuditEventInput): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('audit_events')
      .insert({
        ...event,
        severity: event.severity || 'info',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging audit event:', error);
      throw new Error('Failed to log audit event');
    }

    return data.id;
  }

  /**
   * Log billing-related event
   */
  async logBillingEvent(
    orgId: string,
    action: string,
    details: {
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      oldValue?: any;
      newValue?: any;
      metadata?: any;
    }
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: details.userId,
      event_type: 'billing_event',
      event_category: 'billing',
      severity: 'info',
      action,
      resource_type: details.resourceType,
      resource_id: details.resourceId,
      old_value: details.oldValue,
      new_value: details.newValue,
      metadata: details.metadata,
    });
  }

  /**
   * Log subscription change
   */
  async logSubscriptionChange(
    orgId: string,
    userId: string,
    action: string,
    oldPlan?: string,
    newPlan?: string,
    metadata?: any
  ): Promise<string> {
    const severity: Severity =
      action === 'subscription_cancelled' ? 'warning' : 'info';

    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      event_type: 'subscription_change',
      event_category: 'subscription',
      severity,
      action,
      resource_type: 'subscription',
      old_value: oldPlan ? { plan: oldPlan } : undefined,
      new_value: newPlan ? { plan: newPlan } : undefined,
      metadata,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    orgId: string,
    action: string,
    details: {
      userId?: string;
      workspaceId?: string;
      severity?: Severity;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: details.userId,
      workspace_id: details.workspaceId,
      event_type: 'security_event',
      event_category: 'security',
      severity: details.severity || 'warning',
      action,
      ip_address: details.ipAddress,
      user_agent: details.userAgent,
      metadata: details.metadata,
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    orgId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: any
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      event_type: 'data_access',
      event_category: 'data',
      severity: 'info',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    orgId: string,
    userId: string,
    action: string,
    details: {
      workspaceId?: string;
      resourceType?: string;
      resourceId?: string;
      oldValue?: any;
      newValue?: any;
      metadata?: any;
    }
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      workspace_id: details.workspaceId,
      event_type: 'admin_action',
      event_category: 'admin',
      severity: 'info',
      action,
      resource_type: details.resourceType,
      resource_id: details.resourceId,
      old_value: details.oldValue,
      new_value: details.newValue,
      metadata: details.metadata,
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(
    orgId: string,
    options: AuditQueryOptions = {}
  ): Promise<AuditEvent[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('audit_events')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options.start_date) {
      query = query.gte('created_at', options.start_date.toISOString());
    }

    if (options.end_date) {
      query = query.lte('created_at', options.end_date.toISOString());
    }

    if (options.category) {
      query = query.eq('event_category', options.category);
    }

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.user_id) {
      query = query.eq('user_id', options.user_id);
    }

    if (options.workspace_id) {
      query = query.eq('workspace_id', options.workspace_id);
    }

    if (options.event_type) {
      query = query.eq('event_type', options.event_type);
    }

    if (options.resource_type) {
      query = query.eq('resource_type', options.resource_type);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 100) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying audit events:', error);
      throw new Error('Failed to query audit events');
    }

    return data || [];
  }

  /**
   * Get event count by category
   */
  async getEventCounts(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ [key: string]: number }> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('audit_events')
      .select('event_category')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error getting event counts:', error);
      throw new Error('Failed to get event counts');
    }

    const counts: { [key: string]: number } = {};
    (data || []).forEach((event: any) => {
      counts[event.event_category] = (counts[event.event_category] || 0) + 1;
    });

    return counts;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const supabase = await getSupabaseServer();

    // Get all events for period
    const { data: events } = await supabase
      .from('audit_events')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const allEvents = events || [];

    // Calculate summary
    const byCategory: { [key: string]: number } = {};
    const bySeverity: { [key: string]: number } = {};
    let criticalEvents = 0;
    let warningEvents = 0;

    allEvents.forEach((event: AuditEvent) => {
      byCategory[event.event_category] =
        (byCategory[event.event_category] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;

      if (event.severity === 'critical') {
criticalEvents++;
}
      if (event.severity === 'warning') {
warningEvents++;
}
    });

    // Security events
    const securityEvents = allEvents.filter(
      (e: AuditEvent) => e.event_category === 'security'
    );
    const failedLogins = securityEvents.filter(
      (e: AuditEvent) => e.action === 'failed_login'
    ).length;
    const permissionChanges = securityEvents.filter((e: AuditEvent) =>
      e.action.includes('permission')
    ).length;
    const suspiciousActivities = securityEvents.filter(
      (e: AuditEvent) => e.severity === 'critical' || e.severity === 'error'
    ).length;
    const dataExports = allEvents.filter(
      (e: AuditEvent) => e.action === 'data_export'
    ).length;

    // Access patterns
    const uniqueUsers = new Set(
      allEvents.filter((e: AuditEvent) => e.user_id).map((e: AuditEvent) => e.user_id)
    ).size;
    const uniqueSessions = new Set(
      allEvents.filter((e: AuditEvent) => e.session_id).map((e: AuditEvent) => e.session_id)
    ).size;

    // Peak access time
    const hourCounts = new Array(24).fill(0);
    allEvents.forEach((event: AuditEvent) => {
      const hour = new Date(event.created_at).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakAccessTime = `${peakHour}:00 - ${peakHour + 1}:00`;

    // Data changes
    const dataEvents = allEvents.filter(
      (e: AuditEvent) => e.event_category === 'data'
    );
    const recordsCreated = dataEvents.filter(
      (e: AuditEvent) => e.action === 'create' || e.action.includes('created')
    ).length;
    const recordsUpdated = dataEvents.filter(
      (e: AuditEvent) => e.action === 'update' || e.action.includes('updated')
    ).length;
    const recordsDeleted = dataEvents.filter(
      (e: AuditEvent) => e.action === 'delete' || e.action.includes('deleted')
    ).length;
    const sensitiveDataAccess = dataEvents.filter((e: AuditEvent) =>
      ['contact', 'email', 'payment'].includes(e.resource_type || '')
    ).length;

    // Generate recommendations
    const recommendations: string[] = [];

    if (criticalEvents > 0) {
      recommendations.push(
        `Review ${criticalEvents} critical events immediately`
      );
    }

    if (failedLogins > 10) {
      recommendations.push(
        'High number of failed logins detected - consider implementing rate limiting'
      );
    }

    if (suspiciousActivities > 0) {
      recommendations.push(
        `Investigate ${suspiciousActivities} suspicious activities`
      );
    }

    if (dataExports > 5) {
      recommendations.push(
        'Multiple data exports detected - ensure data handling policies are followed'
      );
    }

    if (uniqueUsers === 0) {
      recommendations.push(
        'No user activity detected - verify tracking is working correctly'
      );
    }

    return {
      org_id: orgId,
      report_period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        total_events: allEvents.length,
        by_category: byCategory,
        by_severity: bySeverity,
        critical_events: criticalEvents,
        warning_events: warningEvents,
      },
      security_events: {
        failed_logins: failedLogins,
        permission_changes: permissionChanges,
        suspicious_activities: suspiciousActivities,
        data_exports: dataExports,
      },
      access_patterns: {
        unique_users: uniqueUsers,
        total_sessions: uniqueSessions,
        peak_access_time: peakAccessTime,
        unusual_access_patterns: 0, // Would require ML analysis
      },
      data_changes: {
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_deleted: recordsDeleted,
        sensitive_data_access: sensitiveDataAccess,
      },
      recommendations,
    };
  }

  /**
   * Get recent critical events
   */
  async getCriticalEvents(orgId: string, limit: number = 10): Promise<AuditEvent[]> {
    return this.queryEvents(orgId, {
      severity: 'critical',
      limit,
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    orgId: string,
    userId: string,
    days: number = 30
  ): Promise<AuditEvent[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryEvents(orgId, {
      user_id: userId,
      start_date: startDate,
      limit: 100,
    });
  }

  /**
   * Export audit logs
   */
  async exportLogs(
    orgId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const events = await this.queryEvents(orgId, {
      start_date: startDate,
      end_date: endDate,
      limit: 10000,
    });

    // Log the export
    await this.logDataAccess(
      orgId,
      'system',
      'data_export',
      'audit_logs',
      undefined,
      {
        format,
        event_count: events.length,
        period: { start: startDate, end: endDate },
      }
    );

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'id',
        'created_at',
        'event_type',
        'event_category',
        'severity',
        'action',
        'user_id',
        'resource_type',
        'resource_id',
      ];
      const rows = events.map((e) =>
        [
          e.id,
          e.created_at,
          e.event_type,
          e.event_category,
          e.severity,
          e.action,
          e.user_id || '',
          e.resource_type || '',
          e.resource_id || '',
        ].join(',')
      );

      return [headers.join(','), ...rows].join('\n');
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Purge old events (retention policy)
   */
  async purgeOldEvents(orgId: string, retentionDays: number): Promise<number> {
    const supabase = await getSupabaseServer();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { data, error } = await supabase
      .from('audit_events')
      .delete()
      .eq('org_id', orgId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error purging old events:', error);
      throw new Error('Failed to purge old events');
    }

    const deletedCount = (data || []).length;

    // Log the purge
    await this.logAdminAction(orgId, 'system', 'audit_log_purge', {
      metadata: {
        retention_days: retentionDays,
        events_deleted: deletedCount,
        cutoff_date: cutoffDate,
      },
    });

    return deletedCount;
  }
}

// Export singleton
export const auditComplianceService = new AuditComplianceService();
