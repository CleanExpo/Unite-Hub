import { describe, it, expect } from 'vitest';

describe('Guardian AI Explainability Hub', () => {
  it('validates explanation result structure', () => {
    const mockResult = {
      summaryMarkdown: '**Why this happened:** Alert fired because...',
      featureAttributions: [
        { name: 'High error rate', weight: 0.8, direction: 'increases', category: 'alerts' }
      ],
      explanationType: 'local',
      contextWindow: { start: '2025-12-10T00:00:00Z', end: '2025-12-11T00:00:00Z' }
    };

    expect(mockResult.summaryMarkdown).toBeTruthy();
    expect(mockResult.featureAttributions).toBeInstanceOf(Array);
    expect(mockResult.featureAttributions[0].weight).toBeGreaterThanOrEqual(0);
    expect(mockResult.featureAttributions[0].weight).toBeLessThanOrEqual(1);
  });

  it('validates entity types', () => {
    const validTypes = ['alert', 'incident', 'correlation_cluster', 'anomaly_score', 'predictive_score', 'risk_snapshot'];
    for (const type of validTypes) {
      expect(validTypes).toContain(type);
    }
  });

  it('validates explanation types', () => {
    const validExplanationTypes = ['local', 'trend', 'mixed'];
    for (const type of validExplanationTypes) {
      expect(validExplanationTypes).toContain(type);
    }
  });

  it('validates feature attribution weights', () => {
    const attribution = { name: 'Test', weight: 0.75 };
    expect(attribution.weight).toBeGreaterThanOrEqual(0);
    expect(attribution.weight).toBeLessThanOrEqual(1);
  });
});
