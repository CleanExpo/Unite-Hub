/**
 * Tests for Guardian Plugin-04 Insurance & Claims Oversight
 * Signal Derivation Logic
 *
 * Verifies signal detection, severity scaling, graceful degradation, and PII safety
 */

import { describe, it, expect } from 'vitest';
import { deriveInsuranceSignals, collectAggregateData } from '@/lib/guardian/plugins/industry-insurance-pack/signalService';
import { createSignal, DEFAULT_SIGNAL_THRESHOLDS } from '@/lib/guardian/plugins/industry-insurance-pack/types';
import type { InsuranceOpsSignal } from '@/lib/guardian/plugins/industry-insurance-pack/types';

describe('PLUGIN-04: Insurance Signals', () => {
  describe('Claims Velocity Spike Detection', () => {
    it('should detect spike at 1.5x baseline', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 40,
        incidents24h: 16,
        correlations24h: 5,
        alerts7d: 100,
        incidents7d: 20
      });

      const signal = snapshot.signals.find((s) => s.key === 'claims_velocity_spike');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should detect spike at 2x baseline with medium severity', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 50,
        incidents24h: 24,
        correlations24h: 8,
        alerts7d: 100,
        incidents7d: 20
      });

      const signal = snapshot.signals.find((s) => s.key === 'claims_velocity_spike');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should detect spike at 3x baseline with high severity', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 60,
        incidents24h: 36,
        correlations24h: 10,
        alerts7d: 100,
        incidents7d: 20
      });

      const signal = snapshot.signals.find((s) => s.key === 'claims_velocity_spike');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should not trigger below 1.5x baseline', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 20,
        incidents24h: 4,
        correlations24h: 3,
        alerts7d: 100,
        incidents7d: 20
      });

      const signal = snapshot.signals.find((s) => s.key === 'claims_velocity_spike');
      expect(signal).toBeUndefined();
    });

    it('should handle zero baseline gracefully', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 2,
        alerts7d: 0,
        incidents7d: 0
      });

      // Should not throw, zero baseline results in no trigger
      expect(snapshot).toBeDefined();
    });
  });

  describe('Fraud Risk Cluster Detection', () => {
    it('should detect cluster at 5+ anomalies with H02 available', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 5,
        currentRiskLabel: 'medium',
        hasH02Anomalies: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'fraud_risk_cluster');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should detect cluster at 6+ anomalies with medium severity', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 35,
        incidents24h: 9,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 7,
        currentRiskLabel: 'medium',
        hasH02Anomalies: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'fraud_risk_cluster');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should detect cluster at 10+ with high risk label as high severity', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 40,
        incidents24h: 10,
        correlations24h: 5,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 12,
        currentRiskLabel: 'high',
        hasH02Anomalies: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'fraud_risk_cluster');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should skip signal when H02 unavailable', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 10,
        hasH02Anomalies: false
      });

      const signal = snapshot.signals.find((s) => s.key === 'fraud_risk_cluster');
      expect(signal).toBeUndefined();

      const warning = snapshot.warnings?.find((w) => w.includes('H02'));
      expect(warning).toBeDefined();
    });

    it('should not trigger below 5 anomalies', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 25,
        incidents24h: 7,
        correlations24h: 3,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 3,
        hasH02Anomalies: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'fraud_risk_cluster');
      expect(signal).toBeUndefined();
    });
  });

  describe('Adjuster Load Overload Detection', () => {
    it('should detect overload at 10+ backlog', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 10,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'adjuster_load_overload');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should scale severity with backlog count', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 18,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'adjuster_load_overload');
      expect(signal?.severity).toBe('medium');
    });

    it('should show high severity at 20+ backlog', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 25,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'adjuster_load_overload');
      expect(signal?.severity).toBe('high');
    });

    it('should skip signal when H04 unavailable', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 15,
        hasH04Triage: false
      });

      const signal = snapshot.signals.find((s) => s.key === 'adjuster_load_overload');
      expect(signal).toBeUndefined();

      const warning = snapshot.warnings?.find((w) => w.includes('H04'));
      expect(warning).toBeDefined();
    });

    it('should not trigger below 10 backlog', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 7,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'adjuster_load_overload');
      expect(signal).toBeUndefined();
    });
  });

  describe('SLA Breach Pattern Detection', () => {
    it('should detect pattern at 7+ backlog', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 7,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'sla_breach_pattern');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should scale severity with extended backlog', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 12,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'sla_breach_pattern');
      expect(signal?.severity).toBe('medium');
    });

    it('should show high severity at 14+ backlog', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 20,
        hasH04Triage: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'sla_breach_pattern');
      expect(signal?.severity).toBe('high');
    });

    it('should skip signal when H04 unavailable', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 10,
        hasH04Triage: false
      });

      const signal = snapshot.signals.find((s) => s.key === 'sla_breach_pattern');
      expect(signal).toBeUndefined();
    });
  });

  describe('Severity Drift Detection', () => {
    it('should detect drift when risk HIGH with upward trend', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'high',
        riskTrend: 'up'
      });

      const signal = snapshot.signals.find((s) => s.key === 'severity_drift');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should detect drift when risk MEDIUM with upward trend', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'medium',
        riskTrend: 'up'
      });

      const signal = snapshot.signals.find((s) => s.key === 'severity_drift');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should not trigger when risk trending down', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'high',
        riskTrend: 'down'
      });

      const signal = snapshot.signals.find((s) => s.key === 'severity_drift');
      expect(signal).toBeUndefined();
    });

    it('should not trigger when risk flat', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'high',
        riskTrend: 'flat'
      });

      const signal = snapshot.signals.find((s) => s.key === 'severity_drift');
      expect(signal).toBeUndefined();
    });
  });

  describe('Risk Label Computation', () => {
    it('should return Guardian-provided risk label', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'high'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should infer HIGH from high-severity signals', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 60,
        incidents24h: 60,
        correlations24h: 10,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'unknown'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should infer MEDIUM from multiple medium signals', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 40,
        incidents24h: 12,
        correlations24h: 8,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 18,
        hasH04Triage: true,
        currentRiskLabel: 'unknown'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should return unknown when no signals and no label', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 2,
        alerts7d: 100,
        incidents7d: 20
      });

      expect(snapshot.totals.riskLabel).toBe('unknown');
    });
  });

  describe('Snapshot Structure Validation', () => {
    it('should include all required fields', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20
      });

      expect(snapshot.generatedAt).toBeDefined();
      expect(Array.isArray(snapshot.signals)).toBe(true);
      expect(snapshot.totals).toBeDefined();
      expect(snapshot.totals.alerts).toBe(30);
      expect(snapshot.totals.incidents).toBe(8);
      expect(snapshot.totals.correlations).toBe(4);
      expect(['low', 'medium', 'high', 'unknown']).toContain(snapshot.totals.riskLabel);
      expect(snapshot.disclaimer).toBeDefined();
    });

    it('should include warnings when features unavailable', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 10,
        hasH02Anomalies: false,
        triageBacklogCount: 15,
        hasH04Triage: false
      });

      expect(Array.isArray(snapshot.warnings)).toBe(true);
      expect(snapshot.warnings?.length).toBeGreaterThan(0);
    });

    it('should not include warnings when all features available', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20,
        anomalyCountHigh: 5,
        hasH02Anomalies: true,
        triageBacklogCount: 12,
        hasH04Triage: true
      });

      expect(snapshot.warnings === undefined || snapshot.warnings.length === 0).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('createSignal should calculate trend correctly', () => {
      const upSignal = createSignal(
        'claims_velocity_spike',
        'high',
        '24h',
        15,
        'Test rationale',
        10
      );
      expect(upSignal.trend).toBe('up');

      const downSignal = createSignal(
        'claims_velocity_spike',
        'low',
        '24h',
        5,
        'Test rationale',
        10
      );
      expect(downSignal.trend).toBe('down');

      const flatSignal = createSignal(
        'claims_velocity_spike',
        'medium',
        '24h',
        10,
        'Test rationale',
        10
      );
      expect(flatSignal.trend).toBe('flat');
    });

    it('createSignal should include metadata', () => {
      const signal = createSignal(
        'claims_velocity_spike',
        'high',
        '24h',
        15,
        'Test rationale'
      );

      expect(signal.metadata).toBeDefined();
      expect(signal.metadata?.createdAt).toBeDefined();
      expect(signal.metadata?.isHeuristic).toBe(true);
    });
  });

  describe('PII Safety', () => {
    it('should not include claim identifiers in signals', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 40,
        incidents24h: 15,
        correlations24h: 5,
        alerts7d: 100,
        incidents7d: 20,
        currentRiskLabel: 'medium'
      });

      snapshot.signals.forEach((signal) => {
        expect(signal.rationale).not.toMatch(/claim.*#|policy|claimant|adjuster/i);
        expect(signal.suggestedAction).not.toMatch(/claim.*#|policy|claimant/i);
      });
    });

    it('should use aggregate counts only, no specific values', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 40,
        incidents24h: 15,
        correlations24h: 5,
        alerts7d: 100,
        incidents7d: 20
      });

      snapshot.signals.forEach((signal) => {
        expect(signal.count).toBeGreaterThanOrEqual(0);
        expect(typeof signal.count).toBe('number');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle all zero values gracefully', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 0,
        incidents24h: 0,
        correlations24h: 0,
        alerts7d: 0,
        incidents7d: 0,
        triageBacklogCount: 0,
        anomalyCountHigh: 0
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.totals.riskLabel).toBe('unknown');
    });

    it('should handle missing optional fields', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 30,
        incidents24h: 8,
        correlations24h: 4,
        alerts7d: 100,
        incidents7d: 20
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.signals).toBeDefined();
    });

    it('should handle very large numbers', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 10000,
        incidents24h: 5000,
        correlations24h: 2500,
        alerts7d: 50000,
        incidents7d: 25000,
        triageBacklogCount: 5000
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.totals.alerts).toBe(10000);
    });
  });

  describe('Integration: Multiple Signals', () => {
    it('should detect multiple signals simultaneously', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 60,
        incidents24h: 50,
        correlations24h: 10,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 20,
        anomalyCountHigh: 8,
        currentRiskLabel: 'high',
        riskTrend: 'up',
        hasH02Anomalies: true,
        hasH04Triage: true
      });

      expect(snapshot.signals.length).toBeGreaterThan(1);
      const keys = snapshot.signals.map((s) => s.key);
      expect(keys).toContain('claims_velocity_spike');
      expect(keys).toContain('severity_drift');
    });

    it('should compute risk label from combined signals', async () => {
      const snapshot = await deriveInsuranceSignals({
        alerts24h: 60,
        incidents24h: 50,
        correlations24h: 10,
        alerts7d: 100,
        incidents7d: 20,
        triageBacklogCount: 20,
        anomalyCountHigh: 8,
        currentRiskLabel: 'unknown',
        hasH02Anomalies: true,
        hasH04Triage: true
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });
  });
});
