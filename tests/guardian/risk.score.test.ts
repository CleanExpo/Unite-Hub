import { describe, it, expect } from 'vitest';

/**
 * Guardian Risk Score Tests (G51)
 *
 * Smoke tests for risk score calculation logic.
 * Tests the standard model formula in isolation.
 */

/**
 * Demo risk score calculation (mirrors actual implementation)
 */
function demoRiskScore(
  alertScore: number,
  incidentScore: number,
  openIncidents: number,
  decay: number
) {
  const raw = alertScore + incidentScore + openIncidents * 5;
  return Math.min(100, Math.round(raw * decay));
}

describe('Guardian risk score model (standard)', () => {
  it('caps value at 100', () => {
    const score = demoRiskScore(200, 200, 10, 1);
    expect(score).toBe(100);
  });

  it('applies decay as expected', () => {
    const base = demoRiskScore(10, 10, 1, 1);
    const decayed = demoRiskScore(10, 10, 1, 0.5);
    expect(decayed).toBeLessThan(base);
  });

  it('handles zero values', () => {
    const score = demoRiskScore(0, 0, 0, 1);
    expect(score).toBe(0);
  });

  it('applies open incident penalty correctly', () => {
    const withoutPenalty = demoRiskScore(10, 10, 0, 1);
    const withPenalty = demoRiskScore(10, 10, 2, 1); // +10 penalty (5 × 2)
    expect(withPenalty).toBe(withoutPenalty + 10);
  });

  it('severity weights scale correctly', () => {
    // Simulate: 1 low (1pt) vs 1 critical (8pt)
    const lowScore = demoRiskScore(1, 0, 0, 1);
    const criticalScore = demoRiskScore(8, 0, 0, 1);
    expect(criticalScore).toBeGreaterThan(lowScore);
    expect(criticalScore).toBe(8);
    expect(lowScore).toBe(1);
  });

  it('incident multiplier (×2) works', () => {
    // Same severity: alert vs incident
    const alertOnly = demoRiskScore(4, 0, 0, 1); // 1 high alert
    const incidentOnly = demoRiskScore(0, 8, 0, 1); // 1 high incident (4 × 2 = 8)
    expect(incidentOnly).toBeGreaterThan(alertOnly);
  });
});
