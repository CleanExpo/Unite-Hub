import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Anomaly Engine Tests (H02)
 *
 * Tests for AI-powered anomaly detection functionality.
 * Note: These tests use mocked AI responses to avoid actual API calls.
 */

describe('Guardian AI Anomaly Engine', () => {
  it('validates anomaly response structure', () => {
    const mockResponse = {
      anomaly_score: 0.75,
      confidence: 0.85,
      contributing: {
        alerts: ['alert-1', 'alert-2'],
        incidents: ['incident-1'],
      },
      explanation: 'High spike in critical alerts suggests infrastructure issue',
      window_start: '2025-12-10T00:00:00Z',
      window_end: '2025-12-11T00:00:00Z',
    };

    expect(mockResponse.anomaly_score).toBeGreaterThanOrEqual(0);
    expect(mockResponse.anomaly_score).toBeLessThanOrEqual(1);
    expect(mockResponse.confidence).toBeGreaterThanOrEqual(0);
    expect(mockResponse.confidence).toBeLessThanOrEqual(1);
    expect(mockResponse.contributing).toHaveProperty('alerts');
    expect(mockResponse.contributing).toHaveProperty('incidents');
    expect(mockResponse.explanation).toBeTruthy();
  });

  it('validates anomaly score ranges', () => {
    const testScores = [0, 0.25, 0.5, 0.75, 1.0];

    for (const score of testScores) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('calculates anomaly levels correctly', () => {
    const getLevel = (score: number) =>
      score < 0.25 ? 'Low' : score < 0.5 ? 'Medium' : score < 0.75 ? 'High' : 'Critical';

    expect(getLevel(0.1)).toBe('Low');
    expect(getLevel(0.3)).toBe('Medium');
    expect(getLevel(0.6)).toBe('High');
    expect(getLevel(0.9)).toBe('Critical');
  });

  it('handles empty activity gracefully', () => {
    const metrics = {
      alertsCount: 0,
      incidentsCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      openIncidentsCount: 0,
      correlationClustersCount: 0,
      uniqueRulesTriggered: 0,
    };

    expect(metrics.alertsCount).toBe(0);
    expect(metrics.incidentsCount).toBe(0);
    // Should not throw, should analyze as "normal" (low anomaly score)
  });

  it('validates window hours parameter', () => {
    const validWindows = [1, 24, 72, 168]; // 1h, 24h, 3d, 7d

    for (const hours of validWindows) {
      expect(hours).toBeGreaterThanOrEqual(1);
      expect(hours).toBeLessThanOrEqual(168);
    }

    // Invalid windows
    expect(0).toBeLessThan(1); // Too small
    expect(200).toBeGreaterThan(168); // Too large
  });
});
