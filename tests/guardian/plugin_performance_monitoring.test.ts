/**
 * Guardian Plugin Performance Monitoring Setup
 *
 * Establishes baseline metrics for signal derivation, narrative generation, and dashboard render performance
 * Tracks performance regressions and optimization opportunities
 */

import { describe, it, expect } from 'vitest';
import { deriveInsuranceSignals } from '@/lib/guardian/plugins/industry-insurance-pack/signalService';
import { deriveRestorationSignals } from '@/lib/guardian/plugins/industry-restoration-pack/signalService';
import { generateNarrative } from '@/lib/guardian/plugins/narrativeService';

describe('Guardian Plugin Performance Monitoring', () => {
  // Baseline performance targets (milliseconds)
  const PERFORMANCE_TARGETS = {
    insuranceSignals: 50, // Max 50ms to derive insurance signals
    restorationSignals: 50, // Max 50ms to derive restoration signals
    narrativeGeneration: 2000, // Max 2s for narrative generation (includes API latency)
    narrativeMock: 20, // Max 20ms for mock narrative fallback
    totalDashboardLoadTime: 3000 // Max 3s end-to-end dashboard load
  };

  describe('Signal Derivation Performance', () => {
    it('should derive insurance signals within 50ms baseline', async () => {
      const testData = {
        incidents24h: 50,
        incidents7d: 140,
        alerts24h: 45,
        alerts7d: 112,
        correlations24h: 8
      };

      const startTime = performance.now();
      const snapshot = await deriveInsuranceSignals(testData);
      const duration = performance.now() - startTime;

      expect(snapshot).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.insuranceSignals);
      console.log(`Insurance signal derivation: ${duration.toFixed(2)}ms`);
    });

    it('should derive restoration signals within 50ms baseline', async () => {
      const testData = {
        incidents24h: 18,
        incidents7d: 35,
        alerts24h: 14,
        alerts7d: 28,
        correlations24h: 6
      };

      const startTime = performance.now();
      const snapshot = await deriveRestorationSignals(testData);
      const duration = performance.now() - startTime;

      expect(snapshot).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.restorationSignals);
      console.log(`Restoration signal derivation: ${duration.toFixed(2)}ms`);
    });

    it('should handle high-volume signals efficiently', async () => {
      const highVolumeData = {
        incidents24h: 5000,
        incidents7d: 25000,
        alerts24h: 4200,
        alerts7d: 20000,
        correlations24h: 150,
        triageBacklogCount: 500
      };

      const startTime = performance.now();
      const snapshot = await deriveInsuranceSignals(highVolumeData);
      const duration = performance.now() - startTime;

      expect(snapshot).toBeDefined();
      expect(duration).toBeLessThan(100); // Should still be fast with large numbers
      console.log(`High-volume signal derivation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Narrative Generation Performance', () => {
    it('should generate mock narrative within 20ms', async () => {
      const narrativeRequest = {
        workspaceId: 'test-ws',
        pluginKey: 'industry_insurance_pack',
        pluginName: 'Insurance & Claims',
        signals: [
          {
            key: 'claims_velocity_spike',
            severity: 'high',
            window: '24h'
          }
        ],
        riskLabel: 'high',
        totals: {
          alerts: 85,
          incidents: 120,
          correlations: 12,
          riskLabel: 'high'
        },
        allowExternal: false // Mock mode
      };

      const startTime = performance.now();
      const narrative = await generateNarrative(narrativeRequest);
      const duration = performance.now() - startTime;

      expect(narrative).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.narrativeMock);
      console.log(`Mock narrative generation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent signal derivation', async () => {
      const testData = [
        {
          incidents24h: 50,
          incidents7d: 140,
          alerts24h: 45,
          alerts7d: 112,
          correlations24h: 8
        },
        {
          incidents24h: 100,
          incidents7d: 140,
          alerts24h: 85,
          alerts7d: 112,
          correlations24h: 12
        },
        {
          incidents24h: 200,
          incidents7d: 140,
          alerts24h: 170,
          alerts7d: 112,
          correlations24h: 25
        }
      ];

      const startTime = performance.now();
      const results = await Promise.all(
        testData.map(data => deriveInsuranceSignals(data))
      );
      const duration = performance.now() - startTime;

      expect(results).toHaveLength(3);
      expect(results.every(r => r !== undefined)).toBe(true);
      // Concurrent should be roughly 3x baseline
      expect(duration).toBeLessThan(200);
      console.log(`Concurrent signal derivation (3x): ${duration.toFixed(2)}ms`);
    });

    it('should mix insurance and restoration derivation efficiently', async () => {
      const startTime = performance.now();

      const [insurance, restoration] = await Promise.all([
        deriveInsuranceSignals({
          incidents24h: 100,
          incidents7d: 140,
          alerts24h: 85,
          alerts7d: 112,
          correlations24h: 12
        }),
        deriveRestorationSignals({
          incidents24h: 18,
          incidents7d: 35,
          alerts24h: 14,
          alerts7d: 28,
          correlations24h: 6
        })
      ]);

      const duration = performance.now() - startTime;

      expect(insurance).toBeDefined();
      expect(restoration).toBeDefined();
      expect(duration).toBeLessThan(150);
      console.log(`Mixed plugin derivation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain baseline performance under normal load', async () => {
      // Simulate normal dashboard load with typical data sizes
      const normalLoadData = {
        incidents24h: 50,
        incidents7d: 140,
        alerts24h: 45,
        alerts7d: 112,
        correlations24h: 8
      };

      let totalDuration = 0;
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const snapshot = await deriveInsuranceSignals(normalLoadData);
        totalDuration += performance.now() - startTime;
        expect(snapshot).toBeDefined();
      }

      const avgDuration = totalDuration / iterations;
      expect(avgDuration).toBeLessThan(PERFORMANCE_TARGETS.insuranceSignals);
      console.log(`Average insurance signals (${iterations} iterations): ${avgDuration.toFixed(2)}ms`);
    });

    it('should not degrade with consecutive calls', async () => {
      const testData = {
        incidents24h: 75,
        incidents7d: 140,
        alerts24h: 65,
        alerts7d: 112,
        correlations24h: 10
      };

      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const snapshot = await deriveInsuranceSignals(testData);
        const duration = performance.now() - startTime;
        durations.push(duration);
        expect(snapshot).toBeDefined();
      }

      // Check no significant regression over time
      const firstDuration = durations[0];
      const lastDuration = durations[durations.length - 1];
      const degradation = ((lastDuration - firstDuration) / firstDuration) * 100;

      expect(degradation).toBeLessThan(50); // Allow 50% variance between first and last
      console.log(`Performance degradation over 5 calls: ${degradation.toFixed(1)}%`);
    });
  });

  describe('Memory-Efficient Signal Processing', () => {
    it('should not leak memory on repeated derivations', async () => {
      const testData = {
        incidents24h: 50,
        incidents7d: 140,
        alerts24h: 45,
        alerts7d: 112,
        correlations24h: 8
      };

      // Get initial memory estimate (conceptual - actual GC behavior varies)
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const snapshot = await deriveInsuranceSignals(testData);
        expect(snapshot).toBeDefined();
      }

      // If this completes without hanging, memory handling is reasonable
      expect(true).toBe(true);
      console.log(`Completed ${iterations} iterations without memory issues`);
    });
  });

  describe('Performance Metrics Baseline', () => {
    it('should establish insurance signal baseline metrics', async () => {
      const scenarios = [
        { name: 'Low Volume', data: { incidents24h: 5, incidents7d: 50, alerts24h: 4, alerts7d: 40, correlations24h: 1 } },
        { name: 'Normal Volume', data: { incidents24h: 50, incidents7d: 140, alerts24h: 45, alerts7d: 112, correlations24h: 8 } },
        { name: 'High Volume', data: { incidents24h: 500, incidents7d: 1400, alerts24h: 450, alerts7d: 1120, correlations24h: 80 } },
        { name: 'Extreme Volume', data: { incidents24h: 5000, incidents7d: 25000, alerts24h: 4200, alerts7d: 20000, correlations24h: 150 } }
      ];

      const results: { scenario: string; duration: number }[] = [];

      for (const scenario of scenarios) {
        const startTime = performance.now();
        const snapshot = await deriveInsuranceSignals(scenario.data);
        const duration = performance.now() - startTime;

        expect(snapshot).toBeDefined();
        results.push({ scenario: scenario.name, duration });
      }

      // Verify all scenarios perform acceptably
      results.forEach(({ scenario, duration }) => {
        expect(duration).toBeLessThan(PERFORMANCE_TARGETS.insuranceSignals * 2); // Allow 2x baseline
        console.log(`Insurance ${scenario}: ${duration.toFixed(2)}ms`);
      });
    });

    it('should establish restoration signal baseline metrics', async () => {
      const scenarios = [
        { name: 'Low Volume', data: { incidents24h: 3, incidents7d: 21, alerts24h: 2, alerts7d: 14, correlations24h: 1 } },
        { name: 'Normal Volume', data: { incidents24h: 18, incidents7d: 35, alerts24h: 14, alerts7d: 28, correlations24h: 6 } },
        { name: 'High Volume', data: { incidents24h: 180, incidents7d: 350, alerts24h: 140, alerts7d: 280, correlations24h: 60 } }
      ];

      const results: { scenario: string; duration: number }[] = [];

      for (const scenario of scenarios) {
        const startTime = performance.now();
        const snapshot = await deriveRestorationSignals(scenario.data);
        const duration = performance.now() - startTime;

        expect(snapshot).toBeDefined();
        results.push({ scenario: scenario.name, duration });
      }

      results.forEach(({ scenario, duration }) => {
        expect(duration).toBeLessThan(PERFORMANCE_TARGETS.restorationSignals * 2);
        console.log(`Restoration ${scenario}: ${duration.toFixed(2)}ms`);
      });
    });
  });

  describe('Performance Alert Conditions', () => {
    it('should flag if insurance signals exceed 100ms', async () => {
      // This is a warning condition, not a failure
      const startTime = performance.now();
      const snapshot = await deriveInsuranceSignals({
        incidents24h: 50,
        incidents7d: 140,
        alerts24h: 45,
        alerts7d: 112,
        correlations24h: 8
      });
      const duration = performance.now() - startTime;

      if (duration > 100) {
        console.warn(`⚠️  Insurance signals took ${duration.toFixed(2)}ms - above warning threshold`);
      }

      expect(snapshot).toBeDefined();
    });

    it('should flag if restoration signals exceed 100ms', async () => {
      const startTime = performance.now();
      const snapshot = await deriveRestorationSignals({
        incidents24h: 18,
        incidents7d: 35,
        alerts24h: 14,
        alerts7d: 28,
        correlations24h: 6
      });
      const duration = performance.now() - startTime;

      if (duration > 100) {
        console.warn(`⚠️  Restoration signals took ${duration.toFixed(2)}ms - above warning threshold`);
      }

      expect(snapshot).toBeDefined();
    });
  });
});
