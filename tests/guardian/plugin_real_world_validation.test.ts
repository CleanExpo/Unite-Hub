/**
 * Real-World Signal Validation Tests
 *
 * Validates insurance and restoration signals work correctly with realistic data
 */

import { describe, it, expect } from 'vitest';
import { deriveInsuranceSignals } from '@/lib/guardian/plugins/industry-insurance-pack/signalService';
import { deriveRestorationSignals } from '@/lib/guardian/plugins/industry-restoration-pack/signalService';

describe('Real-World Signal Validation', () => {
  describe('Insurance Pack: Signal Detection', () => {
    it('should detect claims velocity spike on high incident volume', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 120, // 4x baseline
        incidents7d: 210,
        alerts24h: 85,
        alerts7d: 140,
        correlations24h: 12
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.signals.length).toBeGreaterThan(0);
      const velocitySignal = snapshot.signals.find(s => s.key === 'claims_velocity_spike');
      expect(velocitySignal).toBeDefined();
      expect(velocitySignal?.severity).toBe('high');
    });

    it('should not alert on normal operational data', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 8,
        incidents7d: 70,
        alerts24h: 6,
        alerts7d: 56,
        correlations24h: 1,
        triageBacklogCount: 2
      });

      // Snapshot should be valid
      expect(snapshot.signals).toBeDefined();
      expect(snapshot.totals).toBeDefined();
      // Normally no alerts on this data
      expect(snapshot.signals.length).toBeLessThanOrEqual(2);
    });

    it('should infer HIGH risk from multiple signals', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 100, // Velocity spike
        incidents7d: 140,
        alerts24h: 85,
        alerts7d: 112,
        correlations24h: 12,
        triageBacklogCount: 20 // Load overload
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should prefer explicit Guardian risk label', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 8,
        incidents7d: 70,
        alerts24h: 6,
        alerts7d: 56,
        correlations24h: 1,
        currentRiskLabel: 'high'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });
  });

  describe('Restoration Pack: Signal Detection', () => {
    it('should detect water damage spike on high incident volume', async () => {
      const snapshot = await deriveRestorationSignals({
        incidents24h: 18, // 3.6x baseline
        incidents7d: 35,
        alerts24h: 14,
        alerts7d: 28,
        correlations24h: 6
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.signals.length).toBeGreaterThan(0);
      const waterSignal = snapshot.signals.find(s => s.key === 'water_spike');
      expect(waterSignal).toBeDefined();
      expect(waterSignal?.severity).toBe('high');
    });

    it('should not alert on normal water damage operations', async () => {
      const snapshot = await deriveRestorationSignals({
        incidents24h: 6,
        incidents7d: 35,
        alerts24h: 5,
        alerts7d: 28,
        correlations24h: 1
      });

      expect(snapshot.signals).toBeDefined();
      const waterSignal = snapshot.signals.find(s => s.key === 'water_spike');
      expect(waterSignal).toBeUndefined();
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('should handle zero incident baseline gracefully', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 5,
        incidents7d: 0,
        alerts24h: 4,
        alerts7d: 0,
        correlations24h: 1
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.warnings).toBeDefined();
    });

    it('should handle extremely high volumes without error', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 5000,
        incidents7d: 25000,
        alerts24h: 4200,
        alerts7d: 20000,
        correlations24h: 150,
        triageBacklogCount: 500
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.totals.alerts).toBeGreaterThan(0);
    });

    it('should maintain consistent signal structure across plugins', async () => {
      const insuranceSnapshot = await deriveInsuranceSignals({
        incidents24h: 100,
        incidents7d: 140,
        alerts24h: 85,
        alerts7d: 112,
        correlations24h: 12
      });

      const restorationSnapshot = await deriveRestorationSignals({
        incidents24h: 18,
        incidents7d: 35,
        alerts24h: 14,
        alerts7d: 28,
        correlations24h: 6
      });

      // Both should have same structure
      expect(insuranceSnapshot.signals).toBeDefined();
      expect(insuranceSnapshot.totals).toBeDefined();
      expect(insuranceSnapshot.warnings).toBeDefined();
      expect(insuranceSnapshot.disclaimer).toBeDefined();

      expect(restorationSnapshot.signals).toBeDefined();
      expect(restorationSnapshot.totals).toBeDefined();
      expect(restorationSnapshot.warnings).toBeDefined();
      expect(restorationSnapshot.disclaimer).toBeDefined();
    });
  });

  describe('Feature Availability & Warnings', () => {
    it('should warn when H02 anomalies unavailable', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 10,
        incidents7d: 80,
        alerts24h: 8,
        alerts7d: 64,
        correlations24h: 3,
        hasH02Anomalies: false
      });

      expect(snapshot.warnings.length).toBeGreaterThan(0);
      expect(snapshot.warnings.some(w => w.includes('Anomaly'))).toBe(true);
    });

    it('should warn when H04 triage unavailable', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 10,
        incidents7d: 80,
        alerts24h: 8,
        alerts7d: 64,
        correlations24h: 3,
        hasH04Triage: false
      });

      expect(snapshot.warnings.length).toBeGreaterThan(0);
      expect(snapshot.warnings.some(w => w.includes('Triage'))).toBe(true);
    });

    it('should continue processing despite feature gaps', async () => {
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 100,
        incidents7d: 140,
        alerts24h: 85,
        alerts7d: 112,
        correlations24h: 12,
        hasH02Anomalies: false,
        hasH04Triage: false
      });

      // Should still produce signals even with feature gaps
      expect(snapshot.signals.length).toBeGreaterThan(0);
      expect(snapshot.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Signal Accuracy Baseline', () => {
    it('should consistently detect velocity spikes above 1.5x threshold', async () => {
      // Baseline 20/day
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 40, // 2x = 40/140per7d
        incidents7d: 140,
        alerts24h: 35,
        alerts7d: 112,
        correlations24h: 5
      });

      const velocitySignal = snapshot.signals.find(s => s.key === 'claims_velocity_spike');
      expect(velocitySignal).toBeDefined();
    });

    it('should skip alerts below 1.5x threshold', async () => {
      // Baseline 25/day
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 26, // 1.04x
        incidents7d: 175,
        alerts24h: 22,
        alerts7d: 140,
        correlations24h: 3
      });

      const velocitySignal = snapshot.signals.find(s => s.key === 'claims_velocity_spike');
      expect(velocitySignal).toBeUndefined();
    });

    it('should detect water spikes above 1.5x threshold', async () => {
      // Baseline 5/day
      const snapshot = await deriveRestorationSignals({
        incidents24h: 15, // 3x
        incidents7d: 35,
        alerts24h: 12,
        alerts7d: 28,
        correlations24h: 4
      });

      const waterSignal = snapshot.signals.find(s => s.key === 'water_spike');
      expect(waterSignal).toBeDefined();
    });

    it('should skip water alerts below 1.5x threshold', async () => {
      // Baseline 7/day
      const snapshot = await deriveRestorationSignals({
        incidents24h: 7, // 1x
        incidents7d: 49,
        alerts24h: 6,
        alerts7d: 39,
        correlations24h: 1
      });

      const waterSignal = snapshot.signals.find(s => s.key === 'water_spike');
      expect(waterSignal).toBeUndefined();
    });
  });
});
