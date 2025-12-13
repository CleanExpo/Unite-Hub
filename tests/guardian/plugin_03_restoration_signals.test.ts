/**
 * Tests for Guardian Plugin-03: Restoration Operations Industry Pack
 *
 * Coverage:
 * - Signal derivation (water spike, mould risk, fire event, SLA drift)
 * - Graceful degradation when features unavailable
 * - Risk label computation
 * - Threshold enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deriveRestorationSignals,
  collectAggregateData
} from '@/lib/guardian/plugins/industry-restoration-pack/signalService';
import {
  RestorationOpsSnapshot,
  DEFAULT_SIGNAL_THRESHOLDS,
  createSignal,
  calculateTrend
} from '@/lib/guardian/plugins/industry-restoration-pack/types';
import { validatePluginManifest } from '@/lib/guardian/plugins/pluginManifest';
import { manifest as industryRestorationPackManifest } from '@/lib/guardian/plugins/industry-restoration-pack/manifest';

describe('PLUGIN-03: Restoration Operations Industry Pack', () => {
  describe('Signal Derivation', () => {
    it('should detect water spike at 1.5x baseline', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 45,
        incidents24h: 8,
        alerts7d: 70,
        incidents7d: 12,
        currentRiskLabel: 'medium'
      });

      const waterSignal = snapshot.signals.find((s) => s.key === 'water_spike');
      expect(waterSignal).toBeDefined();
      expect(waterSignal?.severity).toBe('high');
      expect(waterSignal?.count).toBe(8);
      expect(waterSignal?.rationale).toContain('above 7-day baseline');
    });

    it('should not trigger water spike below threshold', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 10,
        incidents24h: 2,
        alerts7d: 70,
        incidents7d: 12,
        currentRiskLabel: 'low'
      });

      const waterSignal = snapshot.signals.find((s) => s.key === 'water_spike');
      expect(waterSignal).toBeUndefined();
    });

    it('should scale water spike severity (low/medium/high)', async () => {
      // Low severity (1.5x - 2x)
      const lowSnapshot = await deriveRestorationSignals({
        alerts24h: 20,
        incidents24h: 3,
        alerts7d: 70,
        incidents7d: 12
      });
      const lowSignal = lowSnapshot.signals.find((s) => s.key === 'water_spike');
      expect(lowSignal?.severity).toBe('low');

      // Medium severity (2x - 3x)
      const medSnapshot = await deriveRestorationSignals({
        alerts24h: 30,
        incidents24h: 4,
        alerts7d: 70,
        incidents7d: 12
      });
      const medSignal = medSnapshot.signals.find((s) => s.key === 'water_spike');
      expect(medSignal?.severity).toBe('medium');

      // High severity (3x+)
      const highSnapshot = await deriveRestorationSignals({
        alerts24h: 50,
        incidents24h: 10,
        alerts7d: 70,
        incidents7d: 12
      });
      const highSignal = highSnapshot.signals.find((s) => s.key === 'water_spike');
      expect(highSignal?.severity).toBe('high');
    });

    it('should detect mould risk spike with anomalies + risk elevation', async () => {
      const snapshot = await deriveRestorationSignals({
        anomalyCountHigh: 8,
        currentRiskLabel: 'high',
        hasH02Anomalies: true
      });

      const mouldSignal = snapshot.signals.find((s) => s.key === 'mould_risk_spike');
      expect(mouldSignal).toBeDefined();
      expect(mouldSignal?.severity).toBe('high');
      expect(mouldSignal?.count).toBe(8);
      expect(mouldSignal?.rationale).toContain('anomalies detected');
    });

    it('should skip mould risk signal if H02 unavailable', async () => {
      const snapshot = await deriveRestorationSignals({
        anomalyCountHigh: 10,
        hasH02Anomalies: false
      });

      const mouldSignal = snapshot.signals.find((s) => s.key === 'mould_risk_spike');
      expect(mouldSignal).toBeUndefined();
      expect(snapshot.warnings).toContain(
        'Anomaly detection (H02) not available; mould risk signal limited'
      );
    });

    it('should detect fire event spike (2x incident baseline)', async () => {
      const snapshot = await deriveRestorationSignals({
        incidents24h: 10,
        incidents7d: 12
      });

      const fireSignal = snapshot.signals.find((s) => s.key === 'fire_event_spike');
      expect(fireSignal).toBeDefined();
      expect(fireSignal?.severity).toBe('medium');
      expect(fireSignal?.rationale).toContain('doubled');
    });

    it('should scale fire event severity based on multiplier', async () => {
      // Medium (2x - 3x)
      const medSnapshot = await deriveRestorationSignals({
        incidents24h: 4,
        incidents7d: 12
      });
      const medSignal = medSnapshot.signals.find((s) => s.key === 'fire_event_spike');
      expect(medSignal?.severity).toBe('medium');

      // High (3x+)
      const highSnapshot = await deriveRestorationSignals({
        incidents24h: 6,
        incidents7d: 12
      });
      const highSignal = highSnapshot.signals.find((s) => s.key === 'fire_event_spike');
      expect(highSignal?.severity).toBe('high');
    });

    it('should detect SLA drift (triage backlog >= 3)', async () => {
      const snapshot = await deriveRestorationSignals({
        triageBacklogCount: 5,
        hasH04Triage: true
      });

      const slaSignal = snapshot.signals.find((s) => s.key === 'sla_drift');
      expect(slaSignal).toBeDefined();
      expect(slaSignal?.severity).toBe('medium');
      expect(slaSignal?.count).toBe(5);
      expect(slaSignal?.rationale).toContain('triage');
    });

    it('should skip SLA drift signal if H04 unavailable', async () => {
      const snapshot = await deriveRestorationSignals({
        triageBacklogCount: 10,
        hasH04Triage: false
      });

      const slaSignal = snapshot.signals.find((s) => s.key === 'sla_drift');
      expect(slaSignal).toBeUndefined();
      expect(snapshot.warnings).toContain(
        'Triage queue (H04) not available; SLA drift signal not computed'
      );
    });

    it('should scale SLA drift severity (low/medium/high)', async () => {
      const lowSnapshot = await deriveRestorationSignals({
        triageBacklogCount: 3,
        hasH04Triage: true
      });
      const lowSignal = lowSnapshot.signals.find((s) => s.key === 'sla_drift');
      expect(lowSignal?.severity).toBe('low');

      const medSnapshot = await deriveRestorationSignals({
        triageBacklogCount: 6,
        hasH04Triage: true
      });
      const medSignal = medSnapshot.signals.find((s) => s.key === 'sla_drift');
      expect(medSignal?.severity).toBe('medium');

      const highSnapshot = await deriveRestorationSignals({
        triageBacklogCount: 12,
        hasH04Triage: true
      });
      const highSignal = highSnapshot.signals.find((s) => s.key === 'sla_drift');
      expect(highSignal?.severity).toBe('high');
    });
  });

  describe('Risk Label Computation', () => {
    it('should use Guardian risk label if provided', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 5,
        incidents24h: 1,
        alerts7d: 70,
        incidents7d: 12,
        currentRiskLabel: 'high'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should infer risk label from high-severity signals', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 50, // water spike at 4.7x -> high
        incidents24h: 10,
        alerts7d: 70,
        incidents7d: 12
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should infer medium risk from 2+ medium signals', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 30, // water spike at ~2.8x -> medium
        incidents24h: 4,
        alerts7d: 70,
        incidents7d: 12,
        triageBacklogCount: 6, // SLA drift -> medium
        hasH04Triage: true
      });

      // Should have 2 medium signals -> inferred as medium risk
      const mediumSignals = snapshot.signals.filter((s) => s.severity === 'medium');
      expect(mediumSignals.length).toBeGreaterThanOrEqual(2);
      expect(snapshot.totals.riskLabel).toBe('medium');
    });

    it('should default to unknown risk if no label and no signals', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 5,
        incidents24h: 1,
        alerts7d: 70,
        incidents7d: 12
      });

      expect(snapshot.totals.riskLabel).toBe('unknown');
    });
  });

  describe('Snapshot Structure', () => {
    it('should include all required fields', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 15,
        incidents24h: 3,
        correlations24h: 2,
        alerts7d: 70,
        incidents7d: 12,
        currentRiskLabel: 'medium'
      });

      expect(snapshot).toHaveProperty('generatedAt');
      expect(snapshot).toHaveProperty('signals');
      expect(snapshot).toHaveProperty('totals');
      expect(snapshot).toHaveProperty('disclaimer');

      expect(snapshot.totals).toHaveProperty('alerts', 15);
      expect(snapshot.totals).toHaveProperty('incidents', 3);
      expect(snapshot.totals).toHaveProperty('correlations', 2);
      expect(snapshot.totals).toHaveProperty('riskLabel', 'medium');

      expect(typeof snapshot.generatedAt).toBe('string');
      expect(Array.isArray(snapshot.signals)).toBe(true);
      expect(typeof snapshot.disclaimer).toBe('string');
    });

    it('should include warnings array for unavailable features', async () => {
      const snapshot = await deriveRestorationSignals({
        anomalyCountHigh: 10,
        hasH02Anomalies: false,
        triageBacklogCount: 5,
        hasH04Triage: false
      });

      expect(Array.isArray(snapshot.warnings)).toBe(true);
      expect(snapshot.warnings).toContain(
        'Anomaly detection (H02) not available; mould risk signal limited'
      );
      expect(snapshot.warnings).toContain(
        'Triage queue (H04) not available; SLA drift signal not computed'
      );
    });

    it('should include disclaimer in every snapshot', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 5,
        incidents24h: 1,
        alerts7d: 70,
        incidents7d: 12
      });

      expect(snapshot.disclaimer).toContain('heuristic');
      expect(snapshot.disclaimer).toContain('not compliance');
    });
  });

  describe('Helper Functions', () => {
    it('should create signal with defaults', () => {
      const signal = createSignal(
        'water_spike',
        'high',
        '24h',
        8,
        'Test rationale',
        1.7,
        'Test action'
      );

      expect(signal.key).toBe('water_spike');
      expect(signal.severity).toBe('high');
      expect(signal.window).toBe('24h');
      expect(signal.count).toBe(8);
      expect(signal.previousCount).toBe(1.7);
      expect(signal.trend).toBe('up');
      expect(signal.metadata?.isHeuristic).toBe(true);
    });

    it('should calculate trend up/down/flat', () => {
      expect(calculateTrend(10, 8)).toBe('up');
      expect(calculateTrend(8, 10)).toBe('down');
      expect(calculateTrend(10, 10)).toBe('flat');
      expect(calculateTrend(10.5, 10)).toBe('flat');
    });
  });

  describe('Thresholds', () => {
    it('should use default thresholds', () => {
      expect(DEFAULT_SIGNAL_THRESHOLDS.waterSpikeRatio).toBe(1.5);
      expect(DEFAULT_SIGNAL_THRESHOLDS.mouldRiskMinCount).toBe(5);
      expect(DEFAULT_SIGNAL_THRESHOLDS.slaBacklogThreshold).toBe(3);
    });

    it('should respect water spike ratio threshold exactly', async () => {
      // Just below threshold (1.49x)
      const belowSnapshot = await deriveRestorationSignals({
        alerts24h: 10,
        incidents24h: 2.09, // 1.49x of 1.4 baseline
        alerts7d: 70,
        incidents7d: 12
      });
      expect(belowSnapshot.signals.find((s) => s.key === 'water_spike')).toBeUndefined();

      // At/above threshold (1.5x)
      const atSnapshot = await deriveRestorationSignals({
        alerts24h: 10,
        incidents24h: 2.1, // 1.5x of 1.4 baseline
        alerts7d: 70,
        incidents7d: 12
      });
      expect(atSnapshot.signals.find((s) => s.key === 'water_spike')).toBeDefined();
    });

    it('should respect mould risk count threshold', async () => {
      // Below (4 anomalies)
      const belowSnapshot = await deriveRestorationSignals({
        anomalyCountHigh: 4,
        hasH02Anomalies: true
      });
      expect(belowSnapshot.signals.find((s) => s.key === 'mould_risk_spike')).toBeUndefined();

      // At (5 anomalies)
      const atSnapshot = await deriveRestorationSignals({
        anomalyCountHigh: 5,
        hasH02Anomalies: true
      });
      expect(atSnapshot.signals.find((s) => s.key === 'mould_risk_spike')).toBeDefined();
    });

    it('should respect SLA backlog threshold', async () => {
      // Below (2 items)
      const belowSnapshot = await deriveRestorationSignals({
        triageBacklogCount: 2,
        hasH04Triage: true
      });
      expect(belowSnapshot.signals.find((s) => s.key === 'sla_drift')).toBeUndefined();

      // At (3 items)
      const atSnapshot = await deriveRestorationSignals({
        triageBacklogCount: 3,
        hasH04Triage: true
      });
      expect(atSnapshot.signals.find((s) => s.key === 'sla_drift')).toBeDefined();
    });
  });

  describe('Data Collection', () => {
    it('should return mock aggregate data structure', async () => {
      const data = await collectAggregateData();

      expect(data).toHaveProperty('alerts24h');
      expect(data).toHaveProperty('incidents24h');
      expect(data).toHaveProperty('correlations24h');
      expect(data).toHaveProperty('alerts7d');
      expect(data).toHaveProperty('incidents7d');
      expect(data).toHaveProperty('currentRiskLabel');
      expect(data).toHaveProperty('triageBacklogCount');
      expect(data).toHaveProperty('anomalyCountHigh');
      expect(data).toHaveProperty('hasH02Anomalies');
      expect(data).toHaveProperty('hasH04Triage');
    });
  });

  describe('Plugin Manifest', () => {
    it('should have valid manifest', () => {
      expect(validatePluginManifest(industryRestorationPackManifest)).toBe(true);
    });

    it('should declare industry_restoration_pack key', () => {
      expect(industryRestorationPackManifest.key).toBe('industry_restoration_pack');
    });

    it('should require PROFESSIONAL or ENTERPRISE tier', () => {
      expect(industryRestorationPackManifest.requiredTiers).toContain('PROFESSIONAL');
      expect(industryRestorationPackManifest.requiredTiers).toContain('ENTERPRISE');
      expect(industryRestorationPackManifest.requiredTiers).not.toContain('STARTER');
    });

    it('should require h06_intelligence_dashboard feature', () => {
      expect(industryRestorationPackManifest.requiredFeatures).toContain('h06_intelligence_dashboard');
    });

    it('should be PII-safe', () => {
      expect(industryRestorationPackManifest.governance.piiSafe).toBe(true);
    });

    it('should not require external sharing', () => {
      expect(industryRestorationPackManifest.governance.requiresExternalSharing).toBe(false);
    });

    it('should declare ui_panel capability', () => {
      expect(industryRestorationPackManifest.capabilities).toContain('ui_panel');
    });

    it('should declare restoration route', () => {
      const route = industryRestorationPackManifest.routes?.[0];
      expect(route?.path).toBe('/guardian/plugins/industry/restoration');
      expect(route?.role).toBe('admin');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero baseline', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 5,
        incidents24h: 5,
        alerts7d: 0,
        incidents7d: 0
      });

      // Should not crash; ratios default to 1 when baseline is 0
      expect(snapshot.signals).toBeDefined();
    });

    it('should handle null/undefined optional fields', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 5,
        incidents24h: 1,
        alerts7d: 70,
        incidents7d: 12
        // all optional fields omitted
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.totals.riskLabel).toBe('unknown');
    });

    it('should handle mixed feature availability', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 30,
        incidents24h: 4,
        alerts7d: 70,
        incidents7d: 12,
        anomalyCountHigh: 10,
        hasH02Anomalies: true, // available
        hasH04Triage: false // unavailable
      });

      const mouldSignal = snapshot.signals.find((s) => s.key === 'mould_risk_spike');
      const slaSignal = snapshot.signals.find((s) => s.key === 'sla_drift');

      expect(mouldSignal).toBeDefined();
      expect(slaSignal).toBeUndefined();
      expect(snapshot.warnings).toContain('H04');
    });
  });

  describe('Integration with Guardian', () => {
    it('should accept aggregate data only', async () => {
      // Input has NO raw records, identifiers, or PII
      const snapshot = await deriveRestorationSignals({
        alerts24h: 15, // aggregate count
        incidents24h: 3, // aggregate count
        correlations24h: 2, // aggregate count
        alerts7d: 70,
        incidents7d: 12,
        currentRiskLabel: 'medium', // classification, not PII
        anomalyCountHigh: 3 // aggregate count
      });

      // Verify no PII in output
      expect(JSON.stringify(snapshot)).not.toMatch(/user|email|name|id|@/i);
    });

    it('should include governance-safe disclaimer', async () => {
      const snapshot = await deriveRestorationSignals({
        alerts24h: 5,
        incidents24h: 1,
        alerts7d: 70,
        incidents7d: 12
      });

      expect(snapshot.disclaimer).toContain('heuristic');
      expect(snapshot.disclaimer).toContain('not compliance');
      expect(snapshot.disclaimer).toContain('verify');
    });
  });
});
