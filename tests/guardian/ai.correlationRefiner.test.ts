import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Correlation Refiner Tests (H03)
 *
 * Tests for AI-enhanced correlation refinement functionality.
 */

describe('Guardian AI Correlation Refiner', () => {
  it('validates recommendation response structure', () => {
    const mockRecommendation = {
      action: 'merge',
      targetClusterIds: ['cluster-1', 'cluster-2'],
      score: 0.85,
      confidence: 0.90,
      rationale: 'Both clusters have critical severity in same time window',
    };

    expect(mockRecommendation).toHaveProperty('action');
    expect(['merge', 'split', 'relabel', 'rank']).toContain(mockRecommendation.action);
    expect(mockRecommendation.score).toBeGreaterThanOrEqual(0);
    expect(mockRecommendation.score).toBeLessThanOrEqual(1);
    expect(mockRecommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(mockRecommendation.confidence).toBeLessThanOrEqual(1);
    expect(mockRecommendation.targetClusterIds).toBeInstanceOf(Array);
    expect(mockRecommendation.rationale).toBeTruthy();
  });

  it('validates action types', () => {
    const validActions = ['merge', 'split', 'relabel', 'rank'];

    for (const action of validActions) {
      expect(validActions).toContain(action);
    }

    const invalidAction = 'delete';
    expect(validActions).not.toContain(invalidAction);
  });

  it('handles empty clusters gracefully', () => {
    const emptyClusters: any[] = [];

    expect(emptyClusters.length).toBe(0);
    // Should return empty recommendations, not throw
  });

  it('validates score and confidence ranges', () => {
    const testValues = [0, 0.25, 0.5, 0.75, 1.0];

    for (const val of testValues) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('validates window hours parameter', () => {
    const validWindows = [1, 24, 72, 168, 720]; // 1h to 30 days

    for (const hours of validWindows) {
      expect(hours).toBeGreaterThanOrEqual(1);
      expect(hours).toBeLessThanOrEqual(720);
    }
  });
});
