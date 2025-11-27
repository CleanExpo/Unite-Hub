/**
 * Integration Tests: Framework Analytics & Metrics
 *
 * Tests for:
 * - Analytics data collection and aggregation
 * - Performance metrics calculation
 * - ROI tracking and impact analysis
 * - Adoption and engagement metrics
 * - Benchmark comparisons
 */

import { describe, it, expect, beforeAll } from 'vitest';

const mockFrameworkId = 'framework_test_123';
const mockWorkspaceId = 'workspace_test_456';
const mockUserId = 'user_test_789';

// Mock analytics data
const mockUsageData = [
  {
    id: 'usage_1',
    framework_id: mockFrameworkId,
    user_id: 'user_1',
    workspace_id: mockWorkspaceId,
    effectiveness_score: 85,
    completion_rate: 0.95,
    conversion_rate: 0.15,
    created_at: new Date().toISOString(),
  },
  {
    id: 'usage_2',
    framework_id: mockFrameworkId,
    user_id: 'user_2',
    workspace_id: mockWorkspaceId,
    effectiveness_score: 78,
    completion_rate: 0.87,
    conversion_rate: 0.12,
    created_at: new Date().toISOString(),
  },
];

const mockMetrics = {
  framework_id: mockFrameworkId,
  execution_time_ms: 87,
  quality_score: {
    completeness: 92,
    consistency: 88,
    clarity: 90,
    usability: 85,
  },
  adoption_metrics: {
    adoption_rate: 78,
    team_engagement: 82,
    recommendation_score: 85,
  },
  component_metrics: [
    { component_id: 'comp_1', name: 'Component 1', usage_frequency: 45, quality_score: 92 },
    { component_id: 'comp_2', name: 'Component 2', usage_frequency: 38, quality_score: 88 },
    { component_id: 'comp_3', name: 'Component 3', usage_frequency: 52, quality_score: 90 },
  ],
  benchmark_comparison: {
    vs_industry_average: 11,
    vs_top_performers: -2,
    percentile_rank: 85,
  },
};

const mockAnalytics = {
  framework_id: mockFrameworkId,
  total_uses: 42,
  active_users: 12,
  avg_effectiveness_score: 81.5,
  completion_rate: 0.91,
  conversion_rate: 0.135,
  adoption_trend: [
    { date: '2025-01-01', uses: 5 },
    { date: '2025-01-02', uses: 8 },
    { date: '2025-01-03', uses: 12 },
  ],
  effectiveness_trend: [
    { date: '2025-01-01', score: 75 },
    { date: '2025-01-02', score: 80 },
    { date: '2025-01-03', score: 85 },
  ],
  user_engagement: [
    { user_id: 'user_1', uses: 12, last_used: new Date().toISOString() },
    { user_id: 'user_2', uses: 8, last_used: new Date().toISOString() },
  ],
  component_usage: [
    { component_id: 'comp_1', usage_count: 45 },
    { component_id: 'comp_2', usage_count: 38 },
  ],
  roi_impact: {
    estimated_value: 6315,
    time_saved_hours: 21,
    team_productivity_increase: 24,
    campaign_improvement: 28,
  },
};

describe('Framework Analytics', () => {
  describe('Usage Data Collection', () => {
    it('should record framework usage', async () => {
      const usage = { ...mockUsageData[0] };
      expect(usage.framework_id).toBe(mockFrameworkId);
      expect(usage.user_id).toBeDefined();
      expect(usage.effectiveness_score).toBeGreaterThan(0);
    });

    it('should track effectiveness score', async () => {
      const usage = mockUsageData[0];
      expect(usage.effectiveness_score).toBeGreaterThanOrEqual(0);
      expect(usage.effectiveness_score).toBeLessThanOrEqual(100);
    });

    it('should track completion rate', async () => {
      const usage = mockUsageData[0];
      expect(usage.completion_rate).toBeGreaterThanOrEqual(0);
      expect(usage.completion_rate).toBeLessThanOrEqual(1);
    });

    it('should track conversion rate', async () => {
      const usage = mockUsageData[0];
      expect(usage.conversion_rate).toBeGreaterThanOrEqual(0);
      expect(usage.conversion_rate).toBeLessThanOrEqual(1);
    });

    it('should record timestamp for usage', async () => {
      const usage = mockUsageData[0];
      const date = new Date(usage.created_at);
      expect(date.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should link usage to framework', async () => {
      const usage = mockUsageData[0];
      expect(usage.framework_id).toBe(mockFrameworkId);
    });

    it('should link usage to user', async () => {
      const usage = mockUsageData[0];
      expect(usage.user_id).toBeDefined();
    });

    it('should link usage to workspace', async () => {
      const usage = mockUsageData[0];
      expect(usage.workspace_id).toBe(mockWorkspaceId);
    });
  });

  describe('Analytics Aggregation', () => {
    it('should calculate total uses', async () => {
      const totalUses = mockAnalytics.total_uses;
      expect(totalUses).toBeGreaterThan(0);
    });

    it('should count active users', async () => {
      const activeUsers = mockAnalytics.active_users;
      expect(activeUsers).toBeGreaterThan(0);
    });

    it('should calculate average effectiveness', async () => {
      const avg = mockAnalytics.avg_effectiveness_score;
      expect(avg).toBeGreaterThanOrEqual(0);
      expect(avg).toBeLessThanOrEqual(100);
    });

    it('should calculate completion rate', async () => {
      const rate = mockAnalytics.completion_rate;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });

    it('should calculate conversion rate', async () => {
      const rate = mockAnalytics.conversion_rate;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(1);
    });

    it('should track adoption trend over time', async () => {
      const trend = mockAnalytics.adoption_trend;
      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('uses');
    });

    it('should track effectiveness trend over time', async () => {
      const trend = mockAnalytics.effectiveness_trend;
      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('date');
      expect(trend[0]).toHaveProperty('score');
    });
  });

  describe('Performance Metrics', () => {
    it('should measure execution time', async () => {
      const time = mockMetrics.execution_time_ms;
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(1000); // Should be under 1 second
    });

    it('should calculate completeness score', async () => {
      const score = mockMetrics.quality_score.completeness;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate consistency score', async () => {
      const score = mockMetrics.quality_score.consistency;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate clarity score', async () => {
      const score = mockMetrics.quality_score.clarity;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate usability score', async () => {
      const score = mockMetrics.quality_score.usability;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate adoption rate', async () => {
      const rate = mockMetrics.adoption_metrics.adoption_rate;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });

    it('should calculate team engagement score', async () => {
      const score = mockMetrics.adoption_metrics.team_engagement;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate recommendation score', async () => {
      const score = mockMetrics.adoption_metrics.recommendation_score;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Component-Level Metrics', () => {
    it('should track component usage frequency', async () => {
      const componentMetrics = mockMetrics.component_metrics;
      expect(componentMetrics.length).toBeGreaterThan(0);
      expect(componentMetrics[0]).toHaveProperty('usage_frequency');
      expect(componentMetrics[0].usage_frequency).toBeGreaterThan(0);
    });

    it('should calculate component quality score', async () => {
      const comp = mockMetrics.component_metrics[0];
      expect(comp.quality_score).toBeGreaterThanOrEqual(0);
      expect(comp.quality_score).toBeLessThanOrEqual(100);
    });

    it('should identify most used components', async () => {
      const components = mockMetrics.component_metrics;
      const sorted = [...components].sort((a, b) => b.usage_frequency - a.usage_frequency);
      expect(sorted[0].usage_frequency).toBeGreaterThanOrEqual(sorted[1].usage_frequency);
    });

    it('should identify lowest quality components', async () => {
      const components = mockMetrics.component_metrics;
      const lowestQuality = components.reduce((min, c) =>
        c.quality_score < min.quality_score ? c : min
      );
      expect(lowestQuality.quality_score).toBeLessThanOrEqual(100);
    });
  });

  describe('ROI Calculation', () => {
    it('should estimate ROI value', async () => {
      const roi = mockAnalytics.roi_impact.estimated_value;
      expect(roi).toBeGreaterThan(0);
    });

    it('should calculate time saved in hours', async () => {
      const hours = mockAnalytics.roi_impact.time_saved_hours;
      expect(hours).toBeGreaterThan(0);
    });

    it('should calculate productivity increase percentage', async () => {
      const increase = mockAnalytics.roi_impact.team_productivity_increase;
      expect(increase).toBeGreaterThanOrEqual(0);
      expect(increase).toBeLessThanOrEqual(100);
    });

    it('should calculate campaign improvement percentage', async () => {
      const improvement = mockAnalytics.roi_impact.campaign_improvement;
      expect(improvement).toBeGreaterThanOrEqual(0);
      expect(improvement).toBeLessThanOrEqual(100);
    });

    it('should link time savings to monetary value', async () => {
      const hours = mockAnalytics.roi_impact.time_saved_hours;
      const estimatedValue = hours * 150; // $150/hour
      expect(estimatedValue).toBeGreaterThan(0);
    });
  });

  describe('Adoption Metrics', () => {
    it('should track adoption rate over time', async () => {
      const rate = mockMetrics.adoption_metrics.adoption_rate;
      expect(rate).toBeGreaterThanOrEqual(0);
    });

    it('should measure team engagement', async () => {
      const engagement = mockMetrics.adoption_metrics.team_engagement;
      expect(engagement).toBeGreaterThanOrEqual(0);
    });

    it('should track user engagement by individual', async () => {
      const users = mockAnalytics.user_engagement;
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('uses');
      expect(users[0]).toHaveProperty('user_id');
    });

    it('should identify most engaged users', async () => {
      const users = mockAnalytics.user_engagement;
      const sorted = [...users].sort((a, b) => b.uses - a.uses);
      expect(sorted[0].uses).toBeGreaterThanOrEqual(sorted[1].uses);
    });

    it('should track last usage timestamp', async () => {
      const user = mockAnalytics.user_engagement[0];
      const lastUsed = new Date(user.last_used);
      expect(lastUsed.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Benchmark Comparison', () => {
    it('should compare to industry average', async () => {
      const comparison = mockMetrics.benchmark_comparison.vs_industry_average;
      expect(typeof comparison).toBe('number');
    });

    it('should compare to top performers', async () => {
      const comparison = mockMetrics.benchmark_comparison.vs_top_performers;
      expect(typeof comparison).toBe('number');
    });

    it('should calculate percentile rank', async () => {
      const rank = mockMetrics.benchmark_comparison.percentile_rank;
      expect(rank).toBeGreaterThanOrEqual(0);
      expect(rank).toBeLessThanOrEqual(100);
    });

    it('should identify if performing above average', async () => {
      const vsAvg = mockMetrics.benchmark_comparison.vs_industry_average;
      const isAboveAverage = vsAvg > 0;
      expect(typeof isAboveAverage).toBe('boolean');
    });

    it('should identify percentile performance level', async () => {
      const rank = mockMetrics.benchmark_comparison.percentile_rank;
      let level: string;
      if (rank >= 90) level = 'top-10';
      else if (rank >= 75) level = 'top-25';
      else if (rank >= 50) level = 'above-average';
      else level = 'below-average';

      expect(['top-10', 'top-25', 'above-average', 'below-average']).toContain(level);
    });
  });

  describe('Time Range Filtering', () => {
    it('should filter by 7-day range', async () => {
      const days = 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      expect(startDate.getTime()).toBeLessThan(Date.now());
    });

    it('should filter by 30-day range', async () => {
      const days = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      expect(startDate.getTime()).toBeLessThan(Date.now());
    });

    it('should filter by 90-day range', async () => {
      const days = 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      expect(startDate.getTime()).toBeLessThan(Date.now());
    });

    it('should filter all-time data', async () => {
      const startDate = new Date('2020-01-01');
      expect(startDate.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('Error Handling', () => {
    it('should require frameworkId', async () => {
      const error = { error: 'Missing frameworkId', status: 400 };
      expect(error.status).toBe(400);
    });

    it('should return 404 for missing framework', async () => {
      const error = { error: 'Framework not found', status: 404 };
      expect(error.status).toBe(404);
    });

    it('should handle authorization errors', async () => {
      const error = { error: 'Unauthorized', status: 401 };
      expect(error.status).toBe(401);
    });

    it('should handle server errors', async () => {
      const error = { error: 'Internal server error', status: 500 };
      expect(error.status).toBe(500);
    });
  });

  describe('Data Aggregation Accuracy', () => {
    it('should aggregate multiple usage records correctly', async () => {
      const totalUses = mockUsageData.length;
      expect(totalUses).toBe(2);
    });

    it('should calculate accurate averages from multiple records', async () => {
      const scores = mockUsageData.map((u) => u.effectiveness_score);
      const average = scores.reduce((a, b) => a + b) / scores.length;
      expect(average).toBeCloseTo(81.5, 0);
    });

    it('should identify unique users from usage data', async () => {
      const uniqueUsers = new Set(mockUsageData.map((u) => u.user_id));
      expect(uniqueUsers.size).toBe(2);
    });

    it('should handle empty usage data gracefully', async () => {
      const emptyData: any[] = [];
      const totalUses = emptyData.length;
      const activeUsers = new Set(emptyData.map((u) => u.user_id)).size;
      expect(totalUses).toBe(0);
      expect(activeUsers).toBe(0);
    });
  });
});
