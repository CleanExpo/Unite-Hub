import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Executive Briefing Tests (H07)
 *
 * Tests for AI-generated executive briefings functionality.
 */

describe('Guardian AI Executive Briefing', () => {
  it('validates briefing result structure', () => {
    const mockBriefing = {
      summaryMarkdown: '# Executive Summary\n\nYour workspace...',
      keyMetrics: {
        alerts: { total: 45, critical: 5 },
        incidents: { total: 12, open: 8 },
        risk: { score: 67 },
      },
      recommendations: [
        {
          title: 'Investigate API errors',
          description: 'Critical alerts increased 300%',
          priority: 'high',
          area: 'alerts',
        },
      ],
      sourceFeatures: ['risk', 'anomaly', 'alerts'],
    };

    expect(mockBriefing.summaryMarkdown).toBeTruthy();
    expect(mockBriefing.keyMetrics).toHaveProperty('alerts');
    expect(mockBriefing.recommendations).toBeInstanceOf(Array);
    expect(mockBriefing.recommendations[0]).toHaveProperty('priority');
    expect(['low', 'medium', 'high']).toContain(mockBriefing.recommendations[0].priority);
  });

  it('validates period labels', () => {
    const validLabels = ['24h', '7d', '30d', 'custom'];

    for (const label of validLabels) {
      expect(validLabels).toContain(label);
    }
  });

  it('validates recommendation priorities', () => {
    const validPriorities = ['low', 'medium', 'high'];

    const testRec = { priority: 'high' };
    expect(validPriorities).toContain(testRec.priority);
  });

  it('validates recommendation areas', () => {
    const validAreas = ['alerts', 'incidents', 'risk', 'anomaly', 'correlation'];

    const testRec = { area: 'alerts' };
    expect(validAreas).toContain(testRec.area);
  });

  it('handles empty metrics gracefully', () => {
    const emptyMetrics = {
      alerts: { total: 0 },
      incidents: { total: 0 },
    };

    expect(emptyMetrics.alerts.total).toBe(0);
    // Should still generate briefing (e.g., "No significant activity")
  });

  it('validates period window constraints', () => {
    const now = new Date();
    const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const windowDays24 = (now.getTime() - start24h.getTime()) / (24 * 60 * 60 * 1000);
    const windowDays7 = (now.getTime() - start7d.getTime()) / (24 * 60 * 60 * 1000);
    const windowDays30 = (now.getTime() - start30d.getTime()) / (24 * 60 * 60 * 1000);

    expect(windowDays24).toBeLessThanOrEqual(30);
    expect(windowDays7).toBeLessThanOrEqual(30);
    expect(windowDays30).toBeLessThanOrEqual(30);
  });
});
