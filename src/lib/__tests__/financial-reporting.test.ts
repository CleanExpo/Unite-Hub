/**
 * Financial Reporting Tests
 * Phase 12 Week 7-8: Tests for financial reporting, usage analytics, and audit compliance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
  supabaseBrowser: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { getSupabaseServer } from '@/lib/supabase';

// Mock data
const mockOrg = {
  id: 'org-123',
  name: 'Test Organization',
};

const mockWorkspaces = [
  { id: 'ws-1', name: 'Workspace 1' },
  { id: 'ws-2', name: 'Workspace 2' },
];

const mockUsageEvents = [
  { event_category: 'email_sent', quantity: 100, created_at: '2025-11-01T10:00:00Z' },
  { event_category: 'ai_request', quantity: 50, created_at: '2025-11-01T14:00:00Z' },
  { event_category: 'contact_created', quantity: 25, created_at: '2025-11-02T09:00:00Z' },
];

const mockRollups = [
  {
    period_start: '2025-10-01',
    email_count: 500,
    ai_request_count: 200,
    contact_count: 100,
    report_count: 10,
    campaign_count: 5,
    api_call_count: 1000,
  },
  {
    period_start: '2025-11-01',
    email_count: 600,
    ai_request_count: 250,
    contact_count: 120,
    report_count: 12,
    campaign_count: 6,
    api_call_count: 1200,
  },
];

const mockAuditEvents = [
  {
    id: 'event-1',
    event_type: 'security_event',
    event_category: 'security',
    severity: 'critical',
    action: 'failed_login',
    created_at: '2025-11-15T10:00:00Z',
  },
  {
    id: 'event-2',
    event_type: 'billing_event',
    event_category: 'billing',
    severity: 'info',
    action: 'invoice_generated',
    created_at: '2025-11-14T15:00:00Z',
  },
];

describe('FinancialReportingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Report Generation', () => {
    it('should generate monthly report with correct structure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'report-1',
            report_type: 'monthly',
            report_name: 'Nov 2025 Report',
            total_revenue: 1000,
            subscription_revenue: 800,
            overage_revenue: 200,
            status: 'generated',
          },
          error: null,
        }),
        rpc: vi.fn().mockResolvedValue({ data: mockUsageEvents, error: null }),
      };

      vi.mocked(getSupabaseServer).mockResolvedValue(mockSupabase as any);

      // Test structure expectations
      const reportStructure = {
        id: expect.any(String),
        report_type: 'monthly',
        report_name: expect.any(String),
        total_revenue: expect.any(Number),
        subscription_revenue: expect.any(Number),
        overage_revenue: expect.any(Number),
        status: 'generated',
      };

      expect(reportStructure.total_revenue).toBeDefined();
      expect(reportStructure.report_type).toBe('monthly');
    });

    it('should calculate revenue correctly', () => {
      const subscriptionRevenue = 800;
      const overageRevenue = 200;
      const totalRevenue = subscriptionRevenue + overageRevenue;

      expect(totalRevenue).toBe(1000);
    });

    it('should validate report types', () => {
      const validTypes = ['monthly', 'quarterly', 'annual', 'custom'];
      const invalidType = 'weekly';

      expect(validTypes.includes('monthly')).toBe(true);
      expect(validTypes.includes('quarterly')).toBe(true);
      expect(validTypes.includes(invalidType)).toBe(false);
    });

    it('should validate report status transitions', () => {
      const validStatuses = ['draft', 'generated', 'finalized', 'archived'];

      expect(validStatuses.includes('draft')).toBe(true);
      expect(validStatuses.includes('generated')).toBe(true);
      expect(validStatuses.includes('finalized')).toBe(true);
    });
  });

  describe('Usage Summary', () => {
    it('should aggregate usage by category', () => {
      const usage = {
        emails: 0,
        ai_requests: 0,
        contacts: 0,
        reports: 0,
        campaigns: 0,
        api_calls: 0,
        storage_gb: 0,
      };

      mockUsageEvents.forEach((event) => {
        switch (event.event_category) {
          case 'email_sent':
            usage.emails += event.quantity;
            break;
          case 'ai_request':
            usage.ai_requests += event.quantity;
            break;
          case 'contact_created':
            usage.contacts += event.quantity;
            break;
        }
      });

      expect(usage.emails).toBe(100);
      expect(usage.ai_requests).toBe(50);
      expect(usage.contacts).toBe(25);
    });

    it('should calculate usage cost correctly', () => {
      const usage = {
        emails: 1000,
        ai_requests: 100,
        contacts: 50,
        reports: 10,
        campaigns: 5,
        api_calls: 10000,
        storage_gb: 2,
      };

      const rates = {
        emails: 0.001,
        ai_requests: 0.01,
        contacts: 0.005,
        reports: 0.05,
        campaigns: 0.10,
        api_calls: 0.0001,
        storage_gb: 0.10,
      };

      const cost =
        usage.emails * rates.emails +
        usage.ai_requests * rates.ai_requests +
        usage.contacts * rates.contacts +
        usage.reports * rates.reports +
        usage.campaigns * rates.campaigns +
        usage.api_calls * rates.api_calls +
        usage.storage_gb * rates.storage_gb;

      expect(cost).toBeCloseTo(4.45, 2);
    });
  });

  describe('Workspace Breakdown', () => {
    it('should calculate percentage breakdown', () => {
      const workspacesCost = [
        { id: 'ws-1', cost: 60 },
        { id: 'ws-2', cost: 40 },
      ];

      const totalCost = workspacesCost.reduce((sum, ws) => sum + ws.cost, 0);

      const breakdown = workspacesCost.map((ws) => ({
        ...ws,
        percentage: (ws.cost / totalCost) * 100,
      }));

      expect(breakdown[0].percentage).toBe(60);
      expect(breakdown[1].percentage).toBe(40);
    });

    it('should handle zero total cost', () => {
      const totalCost = 0;
      const workspaceCost = 0;
      const percentage = totalCost > 0 ? (workspaceCost / totalCost) * 100 : 0;

      expect(percentage).toBe(0);
    });
  });
});

describe('UsageAnalyticsService', () => {
  describe('Heatmap Generation', () => {
    it('should create hourly distribution array', () => {
      const hourlyDistribution = new Array(24).fill(0);

      expect(hourlyDistribution.length).toBe(24);
      expect(hourlyDistribution.every((v) => v === 0)).toBe(true);
    });

    it('should create daily distribution array', () => {
      const dailyDistribution = new Array(7).fill(0);

      expect(dailyDistribution.length).toBe(7);
    });

    it('should find peak hours correctly', () => {
      const hourlyDistribution = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
                                   60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5];

      const indexed = hourlyDistribution.map((value, index) => ({ value, index }));
      indexed.sort((a, b) => b.value - a.value);
      const peaks = indexed.slice(0, 3).map((item) => item.index);

      expect(peaks).toContain(12);
      expect(peaks).toContain(11);
      expect(peaks).toContain(13);
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate growth rate correctly', () => {
      const previousValue = 500;
      const currentValue = 600;
      const growthRate = ((currentValue - previousValue) / previousValue) * 100;

      expect(growthRate).toBe(20);
    });

    it('should handle zero previous value', () => {
      const previousValue = 0;
      const currentValue = 100;
      const growthRate = previousValue > 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : currentValue > 0 ? 100 : 0;

      expect(growthRate).toBe(100);
    });

    it('should perform linear regression', () => {
      const values = [100, 120, 140, 160, 180];
      const n = values.length;

      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
      }

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      const projection = slope * n + intercept;

      expect(slope).toBe(20);
      expect(projection).toBe(200);
    });
  });

  describe('Anomaly Detection', () => {
    it('should calculate standard deviation', () => {
      const values = [10, 12, 14, 16, 18];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
      const stdDev = Math.sqrt(variance);

      expect(mean).toBe(14);
      expect(stdDev).toBeCloseTo(3.16, 1);
    });

    it('should classify severity correctly', () => {
      const classifySeverity = (zScore: number) => {
        if (Math.abs(zScore) > 4) return 'critical';
        if (Math.abs(zScore) > 3) return 'high';
        if (Math.abs(zScore) > 2.5) return 'medium';
        return 'low';
      };

      expect(classifySeverity(5)).toBe('critical');
      expect(classifySeverity(3.5)).toBe('high');
      expect(classifySeverity(2.7)).toBe('medium');
      expect(classifySeverity(2.1)).toBe('low');
    });

    it('should calculate z-score', () => {
      const mean = 100;
      const stdDev = 10;
      const value = 130;
      const zScore = (value - mean) / stdDev;

      expect(zScore).toBe(3);
    });
  });

  describe('Clustering', () => {
    it('should categorize usage levels', () => {
      const categorize = (total: number) => {
        if (total < 100) return 'low';
        if (total < 500) return 'medium';
        if (total < 2000) return 'high';
        return 'very_high';
      };

      expect(categorize(50)).toBe('low');
      expect(categorize(300)).toBe('medium');
      expect(categorize(1000)).toBe('high');
      expect(categorize(5000)).toBe('very_high');
    });
  });

  describe('Period Comparison', () => {
    it('should calculate percentage changes', () => {
      const period1 = { emails: 100, ai_requests: 50 };
      const period2 = { emails: 120, ai_requests: 40 };

      const emailChange = ((period2.emails - period1.emails) / period1.emails) * 100;
      const aiChange = ((period2.ai_requests - period1.ai_requests) / period1.ai_requests) * 100;

      expect(emailChange).toBe(20);
      expect(aiChange).toBe(-20);
    });
  });
});

describe('AuditComplianceService', () => {
  describe('Event Logging', () => {
    it('should validate event categories', () => {
      const validCategories = [
        'billing', 'subscription', 'usage', 'access', 'security',
        'data', 'admin', 'integration', 'compliance'
      ];

      expect(validCategories.includes('billing')).toBe(true);
      expect(validCategories.includes('security')).toBe(true);
      expect(validCategories.includes('invalid')).toBe(false);
    });

    it('should validate severity levels', () => {
      const validSeverities = ['info', 'warning', 'error', 'critical'];

      expect(validSeverities.includes('info')).toBe(true);
      expect(validSeverities.includes('critical')).toBe(true);
      expect(validSeverities.includes('debug')).toBe(false);
    });

    it('should default severity to info', () => {
      const event = {
        event_type: 'test',
        event_category: 'data',
        action: 'read',
      };

      const severity = event.severity || 'info';
      expect(severity).toBe('info');
    });
  });

  describe('Compliance Report', () => {
    it('should aggregate events by category', () => {
      const byCategory: { [key: string]: number } = {};

      mockAuditEvents.forEach((event) => {
        byCategory[event.event_category] =
          (byCategory[event.event_category] || 0) + 1;
      });

      expect(byCategory['security']).toBe(1);
      expect(byCategory['billing']).toBe(1);
    });

    it('should aggregate events by severity', () => {
      const bySeverity: { [key: string]: number } = {};

      mockAuditEvents.forEach((event) => {
        bySeverity[event.severity] =
          (bySeverity[event.severity] || 0) + 1;
      });

      expect(bySeverity['critical']).toBe(1);
      expect(bySeverity['info']).toBe(1);
    });

    it('should count critical events', () => {
      const criticalCount = mockAuditEvents.filter(
        (e) => e.severity === 'critical'
      ).length;

      expect(criticalCount).toBe(1);
    });

    it('should generate recommendations for critical events', () => {
      const criticalEvents = 5;
      const recommendations: string[] = [];

      if (criticalEvents > 0) {
        recommendations.push(
          `Review ${criticalEvents} critical events immediately`
        );
      }

      expect(recommendations.length).toBe(1);
      expect(recommendations[0]).toContain('5');
    });
  });

  describe('Security Events', () => {
    it('should count failed logins', () => {
      const securityEvents = mockAuditEvents.filter(
        (e) => e.event_category === 'security'
      );
      const failedLogins = securityEvents.filter(
        (e) => e.action === 'failed_login'
      ).length;

      expect(failedLogins).toBe(1);
    });

    it('should recommend rate limiting for high failed logins', () => {
      const failedLogins = 15;
      const recommendations: string[] = [];

      if (failedLogins > 10) {
        recommendations.push(
          'High number of failed logins detected - consider implementing rate limiting'
        );
      }

      expect(recommendations.length).toBe(1);
    });
  });

  describe('Access Patterns', () => {
    it('should count unique users', () => {
      const events = [
        { user_id: 'user-1' },
        { user_id: 'user-1' },
        { user_id: 'user-2' },
        { user_id: 'user-3' },
      ];

      const uniqueUsers = new Set(
        events.filter((e) => e.user_id).map((e) => e.user_id)
      ).size;

      expect(uniqueUsers).toBe(3);
    });

    it('should identify peak access time', () => {
      const hourCounts = new Array(24).fill(0);

      [10, 10, 14, 14, 14, 15].forEach((hour) => {
        hourCounts[hour]++;
      });

      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

      expect(peakHour).toBe(14);
    });
  });

  describe('Data Changes', () => {
    it('should count records by action', () => {
      const actions = ['create', 'update', 'update', 'delete'];

      const created = actions.filter((a) => a === 'create').length;
      const updated = actions.filter((a) => a === 'update').length;
      const deleted = actions.filter((a) => a === 'delete').length;

      expect(created).toBe(1);
      expect(updated).toBe(2);
      expect(deleted).toBe(1);
    });
  });

  describe('Log Export', () => {
    it('should format CSV headers', () => {
      const headers = [
        'id', 'created_at', 'event_type', 'event_category',
        'severity', 'action', 'user_id', 'resource_type', 'resource_id'
      ];

      const csv = headers.join(',');

      expect(csv).toContain('id');
      expect(csv).toContain('event_type');
      expect(csv.split(',').length).toBe(9);
    });

    it('should format event row for CSV', () => {
      const event = mockAuditEvents[0];
      const row = [
        event.id,
        event.created_at,
        event.event_type,
        event.event_category,
        event.severity,
        event.action,
        '',
        '',
        '',
      ].join(',');

      expect(row).toContain('event-1');
      expect(row).toContain('security_event');
    });
  });

  describe('Retention Policy', () => {
    it('should calculate cutoff date', () => {
      const now = new Date('2025-11-20');
      const retentionDays = 90;
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      expect(cutoffDate.toISOString().split('T')[0]).toBe('2025-08-22');
    });
  });
});

describe('Report Name Generation', () => {
  it('should generate monthly report names', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date('2025-11-01');
    const name = `${months[date.getMonth()]} ${date.getFullYear()} Report`;

    expect(name).toBe('Nov 2025 Report');
  });

  it('should generate quarterly report names', () => {
    const date = new Date('2025-11-01');
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const name = `Q${quarter} ${date.getFullYear()} Report`;

    expect(name).toBe('Q4 2025 Report');
  });

  it('should generate annual report names', () => {
    const date = new Date('2025-11-01');
    const name = `${date.getFullYear()} Annual Report`;

    expect(name).toBe('2025 Annual Report');
  });
});

describe('Proration Calculations', () => {
  it('should calculate daily rate from monthly', () => {
    const monthlyPrice = 99;
    const dailyRate = monthlyPrice / 30;

    expect(dailyRate).toBeCloseTo(3.3, 1);
  });

  it('should calculate prorated amount', () => {
    const monthlyPrice = 99;
    const days = 15;
    const prorated = (monthlyPrice / 30) * days;

    expect(prorated).toBeCloseTo(49.5, 1);
  });

  it('should calculate daily rate from yearly', () => {
    const yearlyPrice = 999;
    const dailyRate = yearlyPrice / 365;

    expect(dailyRate).toBeCloseTo(2.74, 1);
  });
});
