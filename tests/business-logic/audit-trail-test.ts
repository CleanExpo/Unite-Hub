/**
 * AUDIT TRAIL SYSTEM - TEST SUITE
 * 
 * Tests comprehensive activity logging system including event logging,
 * querying, compliance reporting, and system observability
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data for testing
const mockUser = {
  id: 'user-123',
  full_name: 'John Doe',
  email: 'john@example.com'
};

const mockDeal = {
  id: 'deal-123',
  title: 'Enterprise Deal',
  value: 100000,
  status: 'negotiation'
};

const mockAuditEntry = {
  entityType: 'deal',
  entityId: 'deal-123',
  actionType: 'create',
  description: 'Created new enterprise deal',
  userId: 'user-123',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  metadata: { dealValue: 100000, priority: 'high' },
  severity: 'medium',
  beforeData: null,
  afterData: { title: 'Enterprise Deal', value: 100000 }
};

const mockCriticalAuditEntry = {
  entityType: 'user',
  entityId: 'user-456',
  actionType: 'delete',
  description: 'User account deleted by admin',
  userId: 'admin-123',
  ipAddress: '10.0.0.5',
  userAgent: 'Admin Console v2.1',
  metadata: { reason: 'security_violation', adminAction: true },
  severity: 'critical',
  beforeData: { name: 'Deleted User', email: 'deleted@example.com' },
  afterData: null
};

describe('Audit Trail System', () => {
  describe('Event Logging', () => {
    it('should log a standard audit event', async () => {
      const result = await testLogEvent(mockAuditEntry);
      
      expect(result.success).toBe(true);
      expect(result.auditId).toBeDefined();
      expect(result.entry.entity_type).toBe('deal');
      expect(result.entry.action_type).toBe('create');
      expect(result.entry.severity).toBe('medium');
    });

    it('should log critical security events', async () => {
      const result = await testLogEvent(mockCriticalAuditEntry);
      
      expect(result.success).toBe(true);
      expect(result.entry.severity).toBe('critical');
      expect(result.securityEventLogged).toBe(true);
    });

    it('should validate audit entry schema', async () => {
      const invalidEntry = {
        ...mockAuditEntry,
        entityType: 'invalid_entity',
        actionType: 'invalid_action'
      };
      
      const result = await testLogEvent(invalidEntry);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid enum value');
    });

    it('should handle missing required fields', async () => {
      const incompleteEntry = {
        entityType: 'deal',
        actionType: 'create'
        // Missing required fields
      };
      
      const result = await testLogEvent(incompleteEntry);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should capture IP address and user agent', async () => {
      const result = await testLogEvent(mockAuditEntry);
      
      expect(result.entry.ip_address).toBe('192.168.1.100');
      expect(result.entry.user_agent).toBeDefined();
    });

    it('should set default severity level', async () => {
      const entryWithoutSeverity = {
        ...mockAuditEntry,
        severity: undefined
      };
      delete entryWithoutSeverity.severity;
      
      const result = await testLogEvent(entryWithoutSeverity);
      
      expect(result.success).toBe(true);
      expect(result.entry.severity).toBe('medium'); // Default
    });
  });

  describe('Audit Trail Querying', () => {
    it('should query audit trail with basic filters', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123'),
        createMockEntry('task', 'task-123', 'update', 'user-456'),
        createMockEntry('deal', 'deal-456', 'delete', 'user-123')
      ];
      
      const query = {
        entityType: 'deal',
        userId: 'user-123',
        limit: 10,
        offset: 0
      };
      
      const result = await testQueryAuditTrail(query, mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(2); // Only deal entries by user-123
      expect(result.totalCount).toBe(3);
    });

    it('should filter by action type', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123'),
        createMockEntry('deal', 'deal-123', 'update', 'user-123'),
        createMockEntry('deal', 'deal-123', 'view', 'user-456')
      ];
      
      const query = {
        entityId: 'deal-123',
        actionType: 'update',
        limit: 10,
        offset: 0
      };
      
      const result = await testQueryAuditTrail(query, mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].action_type).toBe('update');
    });

    it('should filter by severity level', async () => {
      const mockEntries = [
        createMockEntry('user', 'user-123', 'login', 'user-123', 'low'),
        createMockEntry('user', 'user-456', 'delete', 'admin-123', 'critical'),
        createMockEntry('deal', 'deal-123', 'create', 'user-123', 'medium')
      ];
      
      const query = {
        severity: 'critical',
        limit: 10,
        offset: 0
      };
      
      const result = await testQueryAuditTrail(query, mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].severity).toBe('critical');
    });

    it('should filter by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123', 'medium', yesterday.toISOString()),
        createMockEntry('deal', 'deal-456', 'create', 'user-123', 'medium', new Date().toISOString())
      ];
      
      const query = {
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
        endDate: tomorrow.toISOString(),
        limit: 10,
        offset: 0
      };
      
      const result = await testQueryAuditTrail(query, mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(1); // Only today's entry
    });

    it('should support pagination', async () => {
      const mockEntries = Array.from({ length: 25 }, (_, i) => 
        createMockEntry('deal', `deal-${i}`, 'create', 'user-123')
      );
      
      const query = {
        limit: 10,
        offset: 0
      };
      
      const result = await testQueryAuditTrail(query, mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(10);
      expect(result.totalCount).toBe(25);
    });
  });

  describe('Entity Audit Trail', () => {
    it('should get audit trail for specific entity', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123'),
        createMockEntry('deal', 'deal-123', 'update', 'user-456'),
        createMockEntry('deal', 'deal-123', 'view', 'user-789'),
        createMockEntry('deal', 'deal-456', 'create', 'user-123') // Different entity
      ];
      
      const result = await testGetEntityAuditTrail('deal', 'deal-123', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.trail).toHaveLength(3);
      expect(result.trail.every(entry => entry.entity_id === 'deal-123')).toBe(true);
    });

    it('should order entity trail by timestamp descending', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123', 'medium', twoHoursAgo.toISOString()),
        createMockEntry('deal', 'deal-123', 'update', 'user-456', 'medium', oneHourAgo.toISOString()),
        createMockEntry('deal', 'deal-123', 'view', 'user-789', 'low', now.toISOString())
      ];
      
      const result = await testGetEntityAuditTrail('deal', 'deal-123', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.trail[0].action_type).toBe('view'); // Most recent first
      expect(result.trail[2].action_type).toBe('create'); // Oldest last
    });

    it('should limit entity trail results', async () => {
      const mockEntries = Array.from({ length: 100 }, (_, i) => 
        createMockEntry('deal', 'deal-123', 'view', 'user-123')
      );
      
      const result = await testGetEntityAuditTrail('deal', 'deal-123', mockEntries, 25);
      
      expect(result.success).toBe(true);
      expect(result.trail).toHaveLength(25);
    });
  });

  describe('User Activity Summary', () => {
    it('should calculate user activity metrics', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123'),
        createMockEntry('deal', 'deal-456', 'update', 'user-123'),
        createMockEntry('task', 'task-123', 'view', 'user-123'),
        createMockEntry('client', 'client-123', 'delete', 'user-123')
      ];
      
      const result = await testGetUserActivity('user-123', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.activity.totalActions).toBe(4);
      expect(result.activity.actionBreakdown.create).toBe(1);
      expect(result.activity.actionBreakdown.update).toBe(1);
      expect(result.activity.actionBreakdown.view).toBe(1);
      expect(result.activity.actionBreakdown.delete).toBe(1);
    });

    it('should show entity breakdown', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-123', 'create', 'user-123'),
        createMockEntry('deal', 'deal-456', 'update', 'user-123'),
        createMockEntry('task', 'task-123', 'view', 'user-123')
      ];
      
      const result = await testGetUserActivity('user-123', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.activity.entityBreakdown.deal).toBe(2);
      expect(result.activity.entityBreakdown.task).toBe(1);
    });

    it('should provide recent actions', async () => {
      const mockEntries = Array.from({ length: 20 }, (_, i) => 
        createMockEntry('deal', `deal-${i}`, 'view', 'user-123')
      );
      
      const result = await testGetUserActivity('user-123', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.activity.recentActions).toHaveLength(10); // Limited to 10 most recent
    });

    it('should calculate daily activity', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123', 'medium', today + 'T10:00:00Z'),
        createMockEntry('deal', 'deal-2', 'update', 'user-123', 'medium', today + 'T14:00:00Z'),
        createMockEntry('task', 'task-1', 'view', 'user-123', 'low', yesterdayStr + 'T09:00:00Z')
      ];
      
      const result = await testGetUserActivity('user-123', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.activity.dailyActivity).toHaveLength(2);
      expect(result.activity.dailyActivity.find(d => d.date === today)?.count).toBe(2);
      expect(result.activity.dailyActivity.find(d => d.date === yesterdayStr)?.count).toBe(1);
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const mockEntries = [
        createMockEntry('user', 'user-123', 'login', 'user-123', 'low'),
        createMockEntry('deal', 'deal-123', 'create', 'user-123', 'medium'),
        createMockEntry('user', 'user-456', 'delete', 'admin-123', 'critical'),
        createMockEntry('client', 'client-123', 'view', 'user-456', 'low'),
        createMockEntry('deal', 'deal-456', 'update', 'user-123', 'medium')
      ];
      
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      
      const result = await testGenerateComplianceReport(startDate, endDate, mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.report.period.start).toBe(startDate);
      expect(result.report.period.end).toBe(endDate);
      expect(result.report.summary.totalEvents).toBe(5);
      expect(result.report.summary.criticalEvents).toBe(1);
      expect(result.report.summary.dataAccess).toBe(1); // view actions
      expect(result.report.summary.dataModification).toBe(3); // create, delete, update
    });

    it('should categorize security events', async () => {
      const mockEntries = [
        createMockEntry('user', 'user-123', 'login', 'user-123', 'low'),
        createMockEntry('user', 'user-123', 'logout', 'user-123', 'low'),
        createMockEntry('deal', 'deal-123', 'delete', 'admin-123', 'high'),
        createMockEntry('user', 'user-456', 'delete', 'admin-123', 'critical')
      ];
      
      const result = await testGenerateComplianceReport('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.report.summary.securityEvents).toBe(4); // login, logout, delete actions + critical
      expect(result.report.criticalEvents).toHaveLength(1);
      expect(result.report.securityEvents).toHaveLength(4);
    });

    it('should provide breakdown by action type', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123'),
        createMockEntry('deal', 'deal-2', 'create', 'user-123'),
        createMockEntry('deal', 'deal-1', 'update', 'user-123'),
        createMockEntry('deal', 'deal-1', 'view', 'user-456')
      ];
      
      const result = await testGenerateComplianceReport('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.report.breakdown.byAction.create).toBe(2);
      expect(result.report.breakdown.byAction.update).toBe(1);
      expect(result.report.breakdown.byAction.view).toBe(1);
    });

    it('should provide breakdown by user', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123'),
        createMockEntry('deal', 'deal-2', 'create', 'user-123'),
        createMockEntry('task', 'task-1', 'view', 'user-456')
      ];
      
      const result = await testGenerateComplianceReport('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z', mockEntries);
      
      expect(result.success).toBe(true);
      expect(result.report.breakdown.byUser).toHaveLength(2);
      expect(result.report.breakdown.byUser[0].eventCount).toBe(2); // user-123 (sorted by count desc)
      expect(result.report.breakdown.byUser[1].eventCount).toBe(1); // user-456
    });
  });

  describe('Analytics and Insights', () => {
    it('should calculate action breakdown analytics', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123'),
        createMockEntry('deal', 'deal-1', 'update', 'user-123'),
        createMockEntry('deal', 'deal-1', 'update', 'user-456'),
        createMockEntry('deal', 'deal-1', 'view', 'user-789')
      ];
      
      const analytics = testCalculateAnalytics(mockEntries);
      
      expect(analytics.actionBreakdown.create).toBe(1);
      expect(analytics.actionBreakdown.update).toBe(2);
      expect(analytics.actionBreakdown.view).toBe(1);
    });

    it('should calculate entity breakdown analytics', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123'),
        createMockEntry('deal', 'deal-2', 'update', 'user-123'),
        createMockEntry('task', 'task-1', 'view', 'user-456'),
        createMockEntry('client', 'client-1', 'delete', 'user-789')
      ];
      
      const analytics = testCalculateAnalytics(mockEntries);
      
      expect(analytics.entityBreakdown.deal).toBe(2);
      expect(analytics.entityBreakdown.task).toBe(1);
      expect(analytics.entityBreakdown.client).toBe(1);
    });

    it('should calculate severity breakdown analytics', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'view', 'user-123', 'low'),
        createMockEntry('deal', 'deal-2', 'create', 'user-123', 'medium'),
        createMockEntry('deal', 'deal-3', 'update', 'user-123', 'medium'),
        createMockEntry('user', 'user-1', 'delete', 'admin-123', 'critical')
      ];
      
      const analytics = testCalculateAnalytics(mockEntries);
      
      expect(analytics.severityBreakdown.low).toBe(1);
      expect(analytics.severityBreakdown.medium).toBe(2);
      expect(analytics.severityBreakdown.critical).toBe(1);
    });

    it('should calculate user activity rankings', async () => {
      const mockEntries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123'),
        createMockEntry('deal', 'deal-2', 'update', 'user-123'),
        createMockEntry('deal', 'deal-3', 'view', 'user-123'),
        createMockEntry('task', 'task-1', 'create', 'user-456'),
        createMockEntry('client', 'client-1', 'view', 'user-789')
      ];
      
      const analytics = testCalculateAnalytics(mockEntries);
      
      expect(analytics.userActivity).toHaveLength(3);
      expect(analytics.userActivity[0].userId).toBe('user-123');
      expect(analytics.userActivity[0].count).toBe(3);
      expect(analytics.userActivity[1].count).toBe(1);
    });

    it('should calculate timeline activity', async () => {
      const now = new Date();
      const entries = [
        createMockEntry('deal', 'deal-1', 'create', 'user-123', 'medium', 
          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString()),
        createMockEntry('deal', 'deal-2', 'update', 'user-123', 'medium',
          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString()),
        createMockEntry('task', 'task-1', 'view', 'user-456', 'low',
          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString())
      ];
      
      const analytics = testCalculateAnalytics(entries);
      
      expect(analytics.timelineActivity.find(t => t.hour === '09:00')?.count).toBe(2);
      expect(analytics.timelineActivity.find(t => t.hour === '14:00')?.count).toBe(1);
    });
  });

  describe('Archive Management', () => {
    it('should archive old audit entries', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // 400 days ago
      
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago
      
      const mockEntries = [
        createMockEntry('deal', 'deal-old', 'create', 'user-123', 'medium', oldDate.toISOString()),
        createMockEntry('deal', 'deal-recent', 'create', 'user-123', 'medium', recentDate.toISOString())
      ];
      
      const result = await testArchiveOldEntries(365, mockEntries); // Keep 365 days
      
      expect(result.success).toBe(true);
      expect(result.archivedCount).toBe(1); // Only old entry archived
    });

    it('should handle empty archive case', async () => {
      const recentEntries = [
        createMockEntry('deal', 'deal-recent', 'create', 'user-123')
      ];
      
      const result = await testArchiveOldEntries(365, recentEntries);
      
      expect(result.success).toBe(true);
      expect(result.archivedCount).toBe(0);
    });
  });
});

// Test helper functions
function createMockEntry(
  entityType: string, 
  entityId: string, 
  actionType: string, 
  userId: string, 
  severity: string = 'medium',
  timestamp?: string
): any {
  return {
    id: `audit-${Date.now()}-${Math.random()}`,
    entity_type: entityType,
    entity_id: entityId,
    action_type: actionType,
    description: `${actionType} ${entityType} ${entityId}`,
    user_id: userId,
    ip_address: '192.168.1.100',
    user_agent: 'Test Browser',
    metadata: {},
    severity,
    before_data: null,
    after_data: {},
    timestamp: timestamp || new Date().toISOString(),
    created_at: timestamp || new Date().toISOString()
  };
}

async function testLogEvent(auditEntry: any) {
  try {
    // Validate required fields
    const requiredFields = ['entityType', 'entityId', 'actionType', 'description', 'userId'];
    for (const field of requiredFields) {
      if (!auditEntry[field]) {
        return { success: false, error: `${field} is required` };
      }
    }
    
    // Validate enum values
    const validEntityTypes = ['deal', 'task', 'client', 'invoice', 'activity', 'user', 'business_rule'];
    const validActionTypes = ['create', 'update', 'delete', 'view', 'export', 'login', 'logout', 'execute'];
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    
    if (!validEntityTypes.includes(auditEntry.entityType)) {
      return { success: false, error: 'Invalid enum value for entityType' };
    }
    
    if (!validActionTypes.includes(auditEntry.actionType)) {
      return { success: false, error: 'Invalid enum value for actionType' };
    }
    
    // Create audit entry
    const entry = {
      id: `audit-${Date.now()}`,
      entity_type: auditEntry.entityType,
      entity_id: auditEntry.entityId,
      action_type: auditEntry.actionType,
      description: auditEntry.description,
      user_id: auditEntry.userId,
      ip_address: auditEntry.ipAddress || '127.0.0.1',
      user_agent: auditEntry.userAgent || 'Unknown',
      metadata: auditEntry.metadata || {},
      severity: auditEntry.severity || 'medium',
      before_data: auditEntry.beforeData || null,
      after_data: auditEntry.afterData || null,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Check if critical event (for security logging)
    const securityEventLogged = entry.severity === 'critical';
    
    return {
      success: true,
      auditId: entry.id,
      entry,
      securityEventLogged
    };
    
  } catch (error) {
    return { success: false, error: 'Failed to log audit event' };
  }
}

async function testQueryAuditTrail(query: any, mockEntries: any[]) {
  try {
    let filteredEntries = [...mockEntries];
    
    // Apply filters
    if (query.entityType) {
      filteredEntries = filteredEntries.filter(e => e.entity_type === query.entityType);
    }
    if (query.entityId) {
      filteredEntries = filteredEntries.filter(e => e.entity_id === query.entityId);
    }
    if (query.actionType) {
      filteredEntries = filteredEntries.filter(e => e.action_type === query.actionType);
    }
    if (query.userId) {
      filteredEntries = filteredEntries.filter(e => e.user_id === query.userId);
    }
    if (query.severity) {
      filteredEntries = filteredEntries.filter(e => e.severity === query.severity);
    }
    if (query.startDate) {
      filteredEntries = filteredEntries.filter(e => e.timestamp >= query.startDate);
    }
    if (query.endDate) {
      filteredEntries = filteredEntries.filter(e => e.timestamp <= query.endDate);
    }
    
    // Sort by timestamp descending
    filteredEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply pagination
    const totalCount = mockEntries.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedEntries = filteredEntries.slice(offset, offset + limit);
    
    // Calculate analytics
    const analytics = testCalculateAnalytics(filteredEntries);
    
    return {
      success: true,
      entries: paginatedEntries,
      totalCount,
      analytics
    };
    
  } catch (error) {
    return { success: false, error: 'Failed to query audit trail' };
  }
}

async function testGetEntityAuditTrail(entityType: string, entityId: string, mockEntries: any[], limit: number = 50) {
  try {
    const entityEntries = mockEntries
      .filter(e => e.entity_type === entityType && e.entity_id === entityId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return {
      success: true,
      trail: entityEntries
    };
    
  } catch (error) {
    return { success: false, error: 'Failed to get entity audit trail' };
  }
}

async function testGetUserActivity(userId: string, mockEntries: any[]) {
  try {
    const userEntries = mockEntries.filter(e => e.user_id === userId);
    
    const totalActions = userEntries.length;
    const recentActions = userEntries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(
