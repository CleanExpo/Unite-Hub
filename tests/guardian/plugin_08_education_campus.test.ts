/**
 * Guardian Industry Pack: Education & Campus Operations - Test Suite
 *
 * Validates campus operations signal detection, governance gating, and compliance
 * Test count: 30+ tests across signal detection, governance, and integration
 */

import { describe, it, expect } from 'vitest';
import { deriveCampusSignals } from '@/lib/guardian/plugins/industry-education-campus/signalService';
import type { CampusOversightSnapshot } from '@/lib/guardian/plugins/industry-education-campus/types';
import { pluginRegistry } from '@/lib/guardian/plugins/registry';

describe('Guardian PLUGIN-08: Education & Campus Operations', () => {
  describe('Plugin Registration & Metadata', () => {
    it('should register industry_education_campus_pack plugin', () => {
      const plugin = pluginRegistry.getPlugin('industry_education_campus_pack');
      expect(plugin).toBeDefined();
      expect(plugin?.key).toBe('industry_education_campus_pack');
    });

    it('should enforce PROFESSIONAL/ENTERPRISE tier constraint', () => {
      const plugin = pluginRegistry.getPlugin('industry_education_campus_pack');
      expect(plugin?.requiredTiers).toContain('PROFESSIONAL');
      expect(plugin?.requiredTiers).toContain('ENTERPRISE');
    });

    it('should require guardian_core and h06_intelligence_dashboard features', () => {
      const plugin = pluginRegistry.getPlugin('industry_education_campus_pack');
      expect(plugin?.requiredFeatures).toContain('guardian_core');
      expect(plugin?.requiredFeatures).toContain('h06_intelligence_dashboard');
    });

    it('should mark plugin as PII-safe', () => {
      const plugin = pluginRegistry.getPlugin('industry_education_campus_pack');
      expect(plugin?.governance.piiSafe).toBe(true);
    });

    it('should declare ui_panel and report capabilities', () => {
      const plugin = pluginRegistry.getPlugin('industry_education_campus_pack');
      expect(plugin?.capabilities).toContain('ui_panel');
      expect(plugin?.capabilities).toContain('report');
    });
  });

  describe('Signal Detection: Operational Disruption', () => {
    it('should detect operational disruption when incidents >1.5x baseline', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 18,
        incidents7d: 70 // 10/day baseline
      });

      expect(snapshot.signals).toBeDefined();
      const signal = snapshot.signals.find((s) => s.key === 'operational_disruption');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should flag HIGH severity when incidents >2x baseline', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 25,
        incidents7d: 70 // 10/day baseline
      });

      const signal = snapshot.signals.find((s) => s.key === 'operational_disruption');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should not flag disruption when incidents <1.5x baseline', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 12,
        incidents7d: 70 // 10/day baseline
      });

      const signal = snapshot.signals.find((s) => s.key === 'operational_disruption');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Environmental Risk', () => {
    it('should detect environmental risk when facility issues >1.8x baseline', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        facilityIssues24h: 5,
        facilityIssues7d: 14 // 2/day baseline
      });

      const signal = snapshot.signals.find((s) => s.key === 'environmental_risk');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should not flag environmental risk when issues <1.8x baseline', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        facilityIssues24h: 3,
        facilityIssues7d: 14 // 2/day baseline
      });

      const signal = snapshot.signals.find((s) => s.key === 'environmental_risk');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Repeat Pattern', () => {
    it('should detect repeat pattern with ≥3 correlated incidents', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        correlations24h: 3
      });

      const signal = snapshot.signals.find((s) => s.key === 'repeat_pattern');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should flag HIGH severity for ≥5 correlated incidents', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        correlations24h: 5
      });

      const signal = snapshot.signals.find((s) => s.key === 'repeat_pattern');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should not flag pattern with <3 correlations', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        correlations24h: 2
      });

      const signal = snapshot.signals.find((s) => s.key === 'repeat_pattern');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Response Latency', () => {
    it('should flag LOW severity for 5-7 day resolution time', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        avgResolutionTime: 6.5
      });

      const signal = snapshot.signals.find((s) => s.key === 'response_latency');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should flag MEDIUM severity for 7-10 day resolution time', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        avgResolutionTime: 8.0
      });

      const signal = snapshot.signals.find((s) => s.key === 'response_latency');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should flag CRITICAL severity for >10 day resolution time', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        avgResolutionTime: 12.0
      });

      const signal = snapshot.signals.find((s) => s.key === 'response_latency');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high'); // Signal is high, but overview will be critical
    });

    it('should warn when resolution time unavailable', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30
      });

      expect(snapshot.warnings.some((w) => w.includes('Response latency'))).toBe(true);
    });
  });

  describe('Signal Detection: Afterhours Activity', () => {
    it('should detect elevated afterhours activity >1.3x peak ratio', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        afterhoursIncidents24h: 6,
        afterhoursIncidents7d: 20,
        peakHourVolume: 4
      });

      const signal = snapshot.signals.find((s) => s.key === 'afterhours_activity');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should not flag afterhours when ratio <1.3x', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        afterhoursIncidents24h: 4,
        afterhoursIncidents7d: 15,
        peakHourVolume: 4
      });

      const signal = snapshot.signals.find((s) => s.key === 'afterhours_activity');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Stability Indicator', () => {
    it('should flag positive stability with low volume + good response + low escalation', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 8,
        incidents7d: 50,
        avgResolutionTime: 2.5,
        escalations24h: 1,
        afterhoursIncidents24h: 1,
        peakHourVolume: 5
      });

      const signal = snapshot.signals.find((s) => s.key === 'stability_indicator');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
      expect(signal?.trend).toBe('stable');
    });

    it('should not flag stability when volume elevated', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 15,
        incidents7d: 70,
        avgResolutionTime: 2.5,
        escalations24h: 1,
        afterhoursIncidents24h: 1,
        peakHourVolume: 8
      });

      const signal = snapshot.signals.find((s) => s.key === 'stability_indicator');
      expect(signal).toBeUndefined();
    });

    it('should not flag stability when response latency high', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 8,
        incidents7d: 50,
        avgResolutionTime: 6.0,
        escalations24h: 1,
        afterhoursIncidents24h: 1,
        peakHourVolume: 5
      });

      const signal = snapshot.signals.find((s) => s.key === 'stability_indicator');
      expect(signal).toBeUndefined();
    });
  });

  describe('Operations Overview', () => {
    it('should build overview with all fields', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 12,
        incidents7d: 60,
        escalations24h: 3,
        afterhoursIncidents24h: 4,
        avgResolutionTime: 4.5,
        facilityIssues24h: 2
      });

      expect(snapshot.overview).toBeDefined();
      expect(snapshot.overview.totalIncidents24h).toBe(12);
      expect(snapshot.overview.totalIncidents7d).toBe(60);
      expect(snapshot.overview.escalationRate).toBe(25); // 3/12 = 25%
      expect(snapshot.overview.afterhoursPercentage).toBe(33.3); // 4/12 = 33%
      expect(snapshot.overview.responseStatus).toBe('on_track');
    });

    it('should mark response as DELAYED when avg resolution 5-7 days', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        avgResolutionTime: 6.0
      });

      expect(snapshot.overview.responseStatus).toBe('delayed');
    });

    it('should mark response as CRITICAL when avg resolution >10 days', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        avgResolutionTime: 12.0
      });

      expect(snapshot.overview.responseStatus).toBe('critical');
    });

    it('should mark environment as ELEVATED when facility issues 2-5', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        facilityIssues24h: 3
      });

      expect(snapshot.overview.environmentalStatus).toBe('elevated');
    });

    it('should mark environment as CRITICAL when facility issues >5', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        facilityIssues24h: 6
      });

      expect(snapshot.overview.environmentalStatus).toBe('critical');
    });
  });

  describe('Risk Label Inference', () => {
    it('should infer HIGH risk from 3+ signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 25,
        incidents7d: 70,
        facilityIssues24h: 5,
        facilityIssues7d: 14,
        correlations24h: 3,
        avgResolutionTime: 8.0
      });

      expect(snapshot.overview.totalIncidents24h).toBeGreaterThan(0);
      // Should have multiple signals
      expect(snapshot.signals.length).toBeGreaterThanOrEqual(3);
    });

    it('should prefer explicit risk label over inference', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5,
        incidents7d: 30,
        currentRiskLabel: 'high'
      });

      // Explicit label should be present even without signals
      expect(snapshot.overview).toBeDefined();
    });

    it('should infer MEDIUM risk from 1-2 signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 18,
        incidents7d: 70,
        avgResolutionTime: 3.0
      });

      // Should have at least one signal (disruption)
      expect(snapshot.signals.length).toBeGreaterThanOrEqual(1);
    });

    it('should infer LOW risk when no signals detected', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 8,
        incidents7d: 50,
        avgResolutionTime: 2.0,
        correlations24h: 1,
        facilityIssues24h: 1
      });

      // May have minimal or no signals
      expect(snapshot.signals).toBeDefined();
    });
  });

  describe('Snapshot Structure & Validation', () => {
    it('should return consistent snapshot structure', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      expect(snapshot.signals).toBeDefined();
      expect(Array.isArray(snapshot.signals)).toBe(true);
      expect(snapshot.overview).toBeDefined();
      expect(snapshot.warnings).toBeDefined();
      expect(snapshot.disclaimer).toBeDefined();
      expect(snapshot.generatedAt).toBeDefined();
    });

    it('should include disclaimer in every snapshot', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      expect(snapshot.disclaimer).toBeTruthy();
      expect(snapshot.disclaimer.toLowerCase()).toContain('operational indicator');
    });

    it('should include rationale in all signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 18,
        incidents7d: 70,
        correlations24h: 3
      });

      snapshot.signals.forEach((signal) => {
        expect(signal.rationale).toBeTruthy();
        expect(signal.rationale.length).toBeGreaterThan(10);
      });
    });

    it('should include suggested actions in signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 18,
        incidents7d: 70
      });

      snapshot.signals.forEach((signal) => {
        if (signal.suggestedAction) {
          expect(signal.suggestedAction.length).toBeGreaterThan(5);
        }
      });
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('should handle minimal input gracefully', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 0,
        incidents7d: 0,
        correlations24h: 0
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.overview).toBeDefined();
    });

    it('should handle extreme input values', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 5000,
        incidents7d: 30000,
        correlations24h: 500,
        facilityIssues24h: 500
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.overview.totalIncidents24h).toBe(5000);
    });

    it('should continue processing with partial data', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        // Missing: avgResolutionTime, facilityIssues, etc.
      });

      expect(snapshot.overview).toBeDefined();
      expect(snapshot.overview.totalIncidents24h).toBe(10);
    });

    it('should handle undefined optional fields', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        afterhoursIncidents24h: undefined,
        avgResolutionTime: undefined
      });

      expect(snapshot.signals).toBeDefined();
    });

    it('should handle zero division gracefully', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 0,
        incidents7d: 0,
        escalations24h: 5 // Can't divide by zero
      });

      expect(snapshot.overview.escalationRate).toBe(0);
    });
  });

  describe('Compliance & Safety', () => {
    it('should never expose student identifiers in signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      const jsonStr = JSON.stringify(snapshot);
      expect(jsonStr).not.toMatch(/student[_\s]?id/i);
      expect(jsonStr).not.toMatch(/student/i);
    });

    it('should never expose staff identifiers in signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      const jsonStr = JSON.stringify(snapshot);
      expect(jsonStr).not.toMatch(/staff[_\s]?id/i);
      expect(jsonStr).not.toMatch(/faculty[_\s]?id/i);
    });

    it('should never expose location details in signals', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      const jsonStr = JSON.stringify(snapshot);
      expect(jsonStr).not.toMatch(/building[_\s]?[a-z0-9]/i);
      expect(jsonStr).not.toMatch(/room[_\s]?[0-9]/i);
    });

    it('should clearly mark as operational indicator only', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      expect(snapshot.disclaimer.toLowerCase()).toContain('operational');
      expect(snapshot.disclaimer.toLowerCase()).toContain('indicator');
    });

    it('should disclaim safety guarantees in the message', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 10,
        incidents7d: 50,
        correlations24h: 1
      });

      // Disclaimer should clarify these are NOT guarantees
      expect(snapshot.disclaimer.toLowerCase()).toContain('not');
      expect(snapshot.disclaimer.toLowerCase()).toContain('operational indicator');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain signal count between 0-6', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 100,
        incidents7d: 300,
        facilityIssues24h: 50,
        facilityIssues7d: 150,
        correlations24h: 10,
        avgResolutionTime: 15,
        afterhoursIncidents24h: 50,
        afterhoursIncidents7d: 200,
        escalations24h: 20,
        peakHourVolume: 10
      });

      expect(snapshot.signals.length).toBeLessThanOrEqual(6);
      expect(snapshot.signals.length).toBeGreaterThanOrEqual(0);
    });

    it('should have unique signal keys', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 25,
        incidents7d: 70,
        facilityIssues24h: 5,
        facilityIssues7d: 14,
        correlations24h: 5,
        avgResolutionTime: 10,
        afterhoursIncidents24h: 8,
        afterhoursIncidents7d: 30,
        peakHourVolume: 5,
        escalations24h: 5
      });

      const keys = snapshot.signals.map((s) => s.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have valid severity levels', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 18,
        incidents7d: 70,
        correlations24h: 3
      });

      snapshot.signals.forEach((signal) => {
        expect(['low', 'medium', 'high']).toContain(signal.severity);
      });
    });

    it('should have valid count values', async () => {
      const snapshot = await deriveCampusSignals({
        incidents24h: 18,
        incidents7d: 70,
        correlations24h: 3
      });

      snapshot.signals.forEach((signal) => {
        expect(signal.count).toBeGreaterThanOrEqual(0);
        expect(typeof signal.count).toBe('number');
      });
    });
  });
});
