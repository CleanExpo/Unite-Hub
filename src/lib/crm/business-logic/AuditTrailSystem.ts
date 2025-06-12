/**
 * AUDIT TRAIL SYSTEM - COMPREHENSIVE ACTIVITY LOGGING
 * 
 * Implements comprehensive activity logging for compliance, debugging,
 * and system observability with real database integration.
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Audit system types
export type EntityType = 'deal' | 'task' | 'client' | 'invoice' | 'activity' | 'user' | 'business_rule';
export type ActionType = 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout' | 'execute';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Validation schemas
export const AuditEntrySchema = z.object({
  entityType: z.enum(['deal', 'task', 'client', 'invoice', 'activity', 'user', 'business_rule']),
  entityId: z.string(),
  actionType: z.enum(['create', 'update', 'delete', 'view', 'export', 'login', 'logout', 'execute']),
  description: z.string(),
  userId: z.string().uuid(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  beforeData: z.record(z.any()).optional(),
  afterData: z.record(z.any()).optional(),
});

export const AuditQuerySchema = z.object({
  entityType: z.enum(['deal', 'task', 'client', 'invoice', 'activity', 'user', 'business_rule']).optional(),
  entityId: z.string().optional(),
  actionType: z.enum(['create', 'update', 'delete', 'view', 'export', 'login', 'logout', 'execute']).optional(),
  userId: z.string().uuid().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type AuditQuery = z.infer<typeof AuditQuerySchema>;

// Audit trail entry interface
export interface AuditTrailEntry {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  action_type: ActionType;
  description: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: SeverityLevel;
  before_data?: Record<string, any>;
  after_data?: Record<string, any>;
  timestamp: string;
  created_at: string;
}

// Audit Trail System
export class AuditTrailSystem {
  
  /**
   * Log an audit event
   */
  static async logEvent(input: AuditEntry): Promise<{ success: boolean; auditId?: string; error?: string }> {
    try {
      // Validate input
      const validated = AuditEntrySchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Create audit trail entry
      const { data: auditEntry, error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          entity_type: validated.entityType,
          entity_id: validated.entityId,
          action_type: validated.actionType,
          description: validated.description,
          user_id: validated.userId,
          ip_address: validated.ipAddress,
          user_agent: validated.userAgent,
          metadata: validated.metadata,
          severity: validated.severity,
          before_data: validated.beforeData,
          after_data: validated.afterData,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (auditError) {
        console.error('Failed to log audit event:', auditError);
        return { success: false, error: auditError.message };
      }
      
      // For critical events, also log to security audit table
      if (validated.severity === 'critical') {
        await this.logSecurityEvent(auditEntry);
      }
      
      return { success: true, auditId: auditEntry.id };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      console.error('Audit logging error:', error);
      return { success: false, error: 'Failed to log audit event' };
    }
  }
  
  /**
   * Query audit trail with filtering and pagination
   */
  static async queryAuditTrail(query: AuditQuery): Promise<{
    success: boolean;
    entries?: AuditTrailEntry[];
    totalCount?: number;
    analytics?: {
      actionBreakdown: Record<ActionType, number>;
      entityBreakdown: Record<EntityType, number>;
      severityBreakdown: Record<SeverityLevel, number>;
      userActivity: Array<{ userId: string; count: number }>;
      timelineActivity: Array<{ hour: string; count: number }>;
    };
    error?: string;
  }> {
    try {
      // Validate query
      const validated = AuditQuerySchema.parse(query);
      
      // Get server client
      const supabase = await createClient();
      
      // Build base query
      let auditQuery = supabase
        .from('audit_trail')
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            email
          )
        `)
        .order('timestamp', { ascending: false });
      
      // Apply filters
      if (validated.entityType) {
        auditQuery = auditQuery.eq('entity_type', validated.entityType);
      }
      if (validated.entityId) {
        auditQuery = auditQuery.eq('entity_id', validated.entityId);
      }
      if (validated.actionType) {
        auditQuery = auditQuery.eq('action_type', validated.actionType);
      }
      if (validated.userId) {
        auditQuery = auditQuery.eq('user_id', validated.userId);
      }
      if (validated.severity) {
        auditQuery = auditQuery.eq('severity', validated.severity);
      }
      if (validated.startDate) {
        auditQuery = auditQuery.gte('timestamp', validated.startDate);
      }
      if (validated.endDate) {
        auditQuery = auditQuery.lte('timestamp', validated.endDate);
      }
      
      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('audit_trail')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        return { success: false, error: countError.message };
      }
      
      // Apply pagination
      auditQuery = auditQuery
        .range(validated.offset, validated.offset + validated.limit - 1);
      
      const { data: entries, error: queryError } = await auditQuery;
      
      if (queryError) {
        return { success: false, error: queryError.message };
      }
      
      // Calculate analytics
      const analytics = await this.calculateAuditAnalytics(entries || []);
      
      return {
        success: true,
        entries: entries || [],
        totalCount: totalCount || 0,
        analytics
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to query audit trail' };
    }
  }
  
  /**
   * Get audit trail for specific entity
   */
  static async getEntityAuditTrail(
    entityType: EntityType,
    entityId: string,
    limit: number = 50
  ): Promise<{ success: boolean; trail?: AuditTrailEntry[]; error?: string }> {
    try {
      const result = await this.queryAuditTrail({
        entityType,
        entityId,
        limit,
        offset: 0
      });
      
      if (result.success) {
        return { success: true, trail: result.entries };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      return { success: false, error: 'Failed to get entity audit trail' };
    }
  }
  
  /**
   * Get user activity summary
   */
  static async getUserActivity(
    userId: string,
    days: number = 30
  ): Promise<{
    success: boolean;
    activity?: {
      totalActions: number;
      recentActions: AuditTrailEntry[];
      actionBreakdown: Record<ActionType, number>;
      entityBreakdown: Record<EntityType, number>;
      dailyActivity: Array<{ date: string; count: number }>;
    };
    error?: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const result = await this.queryAuditTrail({
        userId,
        startDate: startDate.toISOString(),
        limit: 100,
        offset: 0
      });
      
      if (!result.success || !result.entries) {
        return { success: false, error: result.error || 'Failed to get user activity' };
      }
      
      const entries = result.entries;
      const totalActions = entries.length;
      const recentActions = entries.slice(0, 10);
      
      // Calculate breakdowns
      const actionBreakdown = this.calculateActionBreakdown(entries);
      const entityBreakdown = this.calculateEntityBreakdown(entries);
      const dailyActivity = this.calculateDailyActivity(entries);
      
      return {
        success: true,
        activity: {
          totalActions,
          recentActions,
          actionBreakdown,
          entityBreakdown,
          dailyActivity
        }
      };
      
    } catch (error) {
      return { success: false, error: 'Failed to get user activity' };
    }
  }
  
  /**
   * Generate compliance report
   */
  static async generateComplianceReport(
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    report?: {
      period: { start: string; end: string };
      summary: {
        totalEvents: number;
        criticalEvents: number;
        securityEvents: number;
        dataAccess: number;
        dataModification: number;
      };
      breakdown: {
        byAction: Record<ActionType, number>;
        byEntity: Record<EntityType, number>;
        bySeverity: Record<SeverityLevel, number>;
        byUser: Array<{ userId: string; userName: string; eventCount: number }>;
      };
      criticalEvents: AuditTrailEntry[];
      securityEvents: AuditTrailEntry[];
    };
    error?: string;
  }> {
    try {
      // Get all events in the period
      const result = await this.queryAuditTrail({
        startDate,
        endDate,
        limit: 10000,
        offset: 0
      });
      
      if (!result.success || !result.entries) {
        return { success: false, error: result.error || 'Failed to generate compliance report' };
      }
      
      const entries = result.entries;
      
      // Calculate summary metrics
      const totalEvents = entries.length;
      const criticalEvents = entries.filter(e => e.severity === 'critical');
      const securityEvents = entries.filter(e => 
        ['login', 'logout', 'delete'].includes(e.action_type) || 
        e.severity === 'critical'
      );
      const dataAccess = entries.filter(e => e.action_type === 'view').length;
      const dataModification = entries.filter(e => 
        ['create', 'update', 'delete'].includes(e.action_type)
      ).length;
      
      // Calculate breakdowns
      const byAction = this.calculateActionBreakdown(entries);
      const byEntity = this.calculateEntityBreakdown(entries);
      const bySeverity = this.calculateSeverityBreakdown(entries);
      const byUser = this.calculateUserBreakdown(entries);
      
      return {
        success: true,
        report: {
          period: { start: startDate, end: endDate },
          summary: {
            totalEvents,
            criticalEvents: criticalEvents.length,
            securityEvents: securityEvents.length,
            dataAccess,
            dataModification
          },
          breakdown: {
            byAction,
            byEntity,
            bySeverity,
            byUser
          },
          criticalEvents: criticalEvents.slice(0, 100),
          securityEvents: securityEvents.slice(0, 100)
        }
      };
      
    } catch (error) {
      return { success: false, error: 'Failed to generate compliance report' };
    }
  }
  
  /**
   * Archive old audit entries
   */
  static async archiveOldEntries(
    daysToKeep: number = 365
  ): Promise<{ success: boolean; archivedCount?: number; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const supabase = await createClient();
      
      // Get entries to archive
      const { data: entriesToArchive, error: selectError } = await supabase
        .from('audit_trail')
        .select('*')
        .lt('created_at', cutoffDate.toISOString());
      
      if (selectError) {
        return { success: false, error: selectError.message };
      }
      
      if (!entriesToArchive || entriesToArchive.length === 0) {
        return { success: true, archivedCount: 0 };
      }
      
      // Move to archive table
      const { error: archiveError } = await supabase
        .from('audit_trail_archive')
        .insert(entriesToArchive);
      
      if (archiveError) {
        return { success: false, error: archiveError.message };
      }
      
      // Delete from main table
      const { error: deleteError } = await supabase
        .from('audit_trail')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
      
      return { success: true, archivedCount: entriesToArchive.length };
      
    } catch (error) {
      return { success: false, error: 'Failed to archive old entries' };
    }
  }
  
  /**
   * Log critical security events
   */
  private static async logSecurityEvent(auditEntry: any): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('security_audit')
        .insert({
          audit_trail_id: auditEntry.id,
          event_type: auditEntry.action_type,
          entity_type: auditEntry.entity_type,
          user_id: auditEntry.user_id,
          ip_address: auditEntry.ip_address,
          details: {
            description: auditEntry.description,
            metadata: auditEntry.metadata,
            before_data: auditEntry.before_data,
            after_data: auditEntry.after_data
          },
          severity: auditEntry.severity,
          timestamp: auditEntry.timestamp,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Calculate audit analytics
   */
  private static async calculateAuditAnalytics(entries: any[]): Promise<{
    actionBreakdown: Record<ActionType, number>;
    entityBreakdown: Record<EntityType, number>;
    severityBreakdown: Record<SeverityLevel, number>;
    userActivity: Array<{ userId: string; count: number }>;
    timelineActivity: Array<{ hour: string; count: number }>;
  }> {
    const actionBreakdown = this.calculateActionBreakdown(entries);
    const entityBreakdown = this.calculateEntityBreakdown(entries);
    const severityBreakdown = this.calculateSeverityBreakdown(entries);
    const userActivity = this.calculateUserActivity(entries);
    const timelineActivity = this.calculateTimelineActivity(entries);
    
    return {
      actionBreakdown,
      entityBreakdown,
      severityBreakdown,
      userActivity,
      timelineActivity
    };
  }
  
  /**
   * Calculate action breakdown
   */
  private static calculateActionBreakdown(entries: any[]): Record<ActionType, number> {
    return entries.reduce((acc, entry) => {
      const action = entry.action_type as ActionType;
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<ActionType, number>);
  }
  
  /**
   * Calculate entity breakdown
   */
  private static calculateEntityBreakdown(entries: any[]): Record<EntityType, number> {
    return entries.reduce((acc, entry) => {
      const entity = entry.entity_type as EntityType;
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {} as Record<EntityType, number>);
  }
  
  /**
   * Calculate severity breakdown
   */
  private static calculateSeverityBreakdown(entries: any[]): Record<SeverityLevel, number> {
    return entries.reduce((acc, entry) => {
      const severity = entry.severity as SeverityLevel;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<SeverityLevel, number>);
  }
  
  /**
   * Calculate user activity
   */
  private static calculateUserActivity(entries: any[]): Array<{ userId: string; count: number }> {
    const userCounts = entries.reduce((acc, entry) => {
      acc[entry.user_id] = (acc[entry.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  /**
   * Calculate user breakdown with names
   */
  private static calculateUserBreakdown(entries: any[]): Array<{ userId: string; userName: string; eventCount: number }> {
    const userCounts = entries.reduce((acc, entry) => {
      const userId = entry.user_id;
      const userName = entry.users?.full_name || entry.users?.email || 'Unknown User';
      
      if (!acc[userId]) {
        acc[userId] = { userId, userName, eventCount: 0 };
      }
      acc[userId].eventCount++;
      
      return acc;
    }, {} as Record<string, { userId: string; userName: string; eventCount: number }>);
    
    return Object.values(userCounts)
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 20);
  }
  
  /**
   * Calculate timeline activity
   */
  private static calculateTimelineActivity(entries: any[]): Array<{ hour: string; count: number }> {
    const hourlyCounts = entries.reduce((acc, entry) => {
      const hour = new Date(entry.timestamp).getHours().toString().padStart(2, '0') + ':00';
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(hourlyCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }
  
  /**
   * Calculate daily activity
   */
  private static calculateDailyActivity(entries: any[]): Array<{ date: string; count: number }> {
    const dailyCounts = entries.reduce((acc, entry) => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Export audit trail functions for API routes
export const auditTrailSystem = {
  logEvent: AuditTrailSystem.logEvent.bind(AuditTrailSystem),
  queryAuditTrail: AuditTrailSystem.queryAuditTrail.bind(AuditTrailSystem),
  getEntityAuditTrail: AuditTrailSystem.getEntityAuditTrail.bind(AuditTrailSystem),
  getUserActivity: AuditTrailSystem.getUserActivity.bind(AuditTrailSystem),
  generateComplianceReport: AuditTrailSystem.generateComplianceReport.bind(AuditTrailSystem),
  archiveOldEntries: AuditTrailSystem.archiveOldEntries.bind(AuditTrailSystem),
};

// Convenience function for common audit logging
export const auditLog = {
  create: (entityType: EntityType, entityId: string, description: string, userId: string, metadata?: any) =>
    AuditTrailSystem.logEvent({
      entityType,
      entityId,
      actionType: 'create',
      description,
      userId,
      metadata,
      severity: 'medium'
    }),
    
  update: (entityType: EntityType, entityId: string, description: string, userId: string, beforeData?: any, afterData?: any) =>
    AuditTrailSystem.logEvent({
      entityType,
      entityId,
      actionType: 'update',
      description,
      userId,
      beforeData,
      afterData,
      severity: 'medium'
    }),
    
  delete: (entityType: EntityType, entityId: string, description: string, userId: string, beforeData?: any) =>
    AuditTrailSystem.logEvent({
      entityType,
      entityId,
      actionType: 'delete',
      description,
      userId,
      beforeData,
      severity: 'high'
    }),
    
  view: (entityType: EntityType, entityId: string, description: string, userId: string) =>
    AuditTrailSystem.logEvent({
      entityType,
      entityId,
      actionType: 'view',
      description,
      userId,
      severity: 'low'
    }),
    
  critical: (entityType: EntityType, entityId: string, description: string, userId: string, metadata?: any) =>
    AuditTrailSystem.logEvent({
      entityType,
      entityId,
      actionType: 'execute',
      description,
      userId,
      metadata,
      severity: 'critical'
    })
};
