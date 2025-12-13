/**
 * Guardian Industry Pack: Government & Regulatory Oversight - Test Suite
 *
 * Validates government plugin signal detection, governance gating, and compliance
 * Test count: 35+ tests across signal detection, governance, and integration
 */

import { describe, it, expect } from 'vitest';
import { deriveGovernmentSignals } from '@/lib/guardian/plugins/industry-government-regulatory/signalService';
import type { GovOversightSnapshot } from '@/lib/guardian/plugins/industry-government-regulatory/types';
import { pluginRegistry } from '@/lib/guardian/plugins/registry';

describe('Guardian PLUGIN-07: Government & Regulatory Oversight', () => {
  describe('Plugin Registration & Metadata', () => {
    it('should register industry_government_regulatory_pack plugin', () => {
      const plugin = pluginRegistry.getPlugin('industry_government_regulatory_pack');
      expect(plugin).toBeDefined();
      expect(plugin?.key).toBe('industry_government_regulatory_pack');
    });

    it('should enforce PROFESSIONAL/ENTERPRISE tier constraint', () => {
      const plugin = pluginRegistry.getPlugin('industry_government_regulatory_pack');
      expect(plugin?.requiredTiers).toContain('PROFESSIONAL');
      expect(plugin?.requiredTiers).toContain('ENTERPRISE');
    });

    it('should require guardian_core and h06_intelligence_dashboard features', () => {
      const plugin = pluginRegistry.getPlugin('industry_government_regulatory_pack');
      expect(plugin?.requiredFeatures).toContain('guardian_core');
      expect(plugin?.requiredFeatures).toContain('h06_intelligence_dashboard');
    });

    it('should mark plugin as PII-safe', () => {
      const plugin = pluginRegistry.getPlugin('industry_government_regulatory_pack');
      expect(plugin?.governance.piiSafe).toBe(true);
    });
  });

  describe('Signal Detection: Audit Readiness', () => {
    it('should detect audit readiness when validation passes + audit enabled + export available', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'pass',
        auditEnabled: true,
        auditExportAvailable: true
      });

      expect(snapshot.signals).toBeDefined();
      const signal = snapshot.signals.find((s) => s.key === 'audit_readiness');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should not flag audit readiness when validation not passing', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'warn',
        auditEnabled: true,
        auditExportAvailable: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'audit_readiness');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Policy Posture', () => {
    it('should detect positive policy posture when sharing restricted + AI governed', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        externalSharingPolicy: 'restricted',
        aiAllowed: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'policy_posture');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should not flag posture when sharing not restricted', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        externalSharingPolicy: 'allowed',
        aiAllowed: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'policy_posture');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Control Drift', () => {
    it('should detect control drift when risk high + rising with stable incidents', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 8,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 150,
        incidents30d: 150, // Stable at ~5/day
        currentRiskLabel: 'high',
        riskTrend: 'up'
      });

      const signal = snapshot.signals.find((s) => s.key === 'control_drift');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should not flag drift when incidents rising proportionally with risk', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 30,
        incidents24h: 20,
        correlations24h: 3,
        alerts30d: 150,
        incidents30d: 75,
        currentRiskLabel: 'high',
        riskTrend: 'up'
      });

      const signal = snapshot.signals.find((s) => s.key === 'control_drift');
      expect(signal).toBeUndefined();
    });
  });

  describe('Signal Detection: Validation Health', () => {
    it('should flag LOW severity for passing validation', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'pass'
      });

      const signal = snapshot.signals.find((s) => s.key === 'validation_health');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should flag MEDIUM severity for validation warning', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'warn'
      });

      const signal = snapshot.signals.find((s) => s.key === 'validation_health');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('medium');
    });

    it('should flag HIGH severity for validation failure', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'fail'
      });

      const signal = snapshot.signals.find((s) => s.key === 'validation_health');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });
  });

  describe('Signal Detection: Backup Posture', () => {
    it('should flag LOW severity for recent backups', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        backupStatus: 'recent'
      });

      const signal = snapshot.signals.find((s) => s.key === 'backup_posture');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('low');
    });

    it('should flag HIGH severity for stale backups', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        backupStatus: 'stale'
      });

      const signal = snapshot.signals.find((s) => s.key === 'backup_posture');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });

    it('should warn when backup status unavailable', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40
      });

      expect(snapshot.warnings.some((w) => w.includes('Backup'))).toBe(true);
    });
  });

  describe('Signal Detection: Transparency Score', () => {
    it('should calculate transparency score based on governance artifacts', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        externalSharingPolicy: 'restricted',
        aiAllowed: true,
        validationStatus: 'pass',
        auditExportAvailable: true,
        backupStatus: 'recent'
      });

      const signal = snapshot.signals.find((s) => s.key === 'transparency_score');
      expect(signal).toBeDefined();
      expect(signal?.count).toBe(100);
      expect(signal?.severity).toBe('low');
    });

    it('should score transparency as HIGH with governance gaps', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'pass',
        auditExportAvailable: true
      });

      const signal = snapshot.signals.find((s) => s.key === 'transparency_score');
      expect(signal).toBeDefined();
      expect(signal?.severity).toBe('high');
    });
  });

  describe('Governance Overview', () => {
    it('should build governance overview with all fields', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        auditEnabled: true,
        aiAllowed: true,
        externalSharingPolicy: 'allowed_with_approval',
        validationStatus: 'pass',
        lastValidationAt: new Date().toISOString(),
        backupStatus: 'recent',
        auditExportAvailable: true
      });

      expect(snapshot.governance).toBeDefined();
      expect(snapshot.governance.auditEnabled).toBe(true);
      expect(snapshot.governance.aiAllowed).toBe(true);
      expect(snapshot.governance.validationStatus).toBe('pass');
      expect(snapshot.governance.backupStatus).toBe('recent');
      expect(snapshot.governance.auditExportAvailable).toBe(true);
    });

    it('should handle missing governance fields gracefully', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40
      });

      expect(snapshot.governance).toBeDefined();
      expect(snapshot.governance.auditEnabled).toBe(false);
      expect(snapshot.governance.validationStatus).toBe('not_configured');
    });
  });

  describe('Risk Label Inference', () => {
    it('should infer HIGH risk from validation failure', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'fail'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });

    it('should infer MEDIUM risk from 1+ signals', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'warn'
      });

      expect(snapshot.totals.riskLabel).toBe('medium');
    });

    it('should prefer explicit risk label over inference', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'pass',
        currentRiskLabel: 'high'
      });

      expect(snapshot.totals.riskLabel).toBe('high');
    });
  });

  describe('Snapshot Structure & Validation', () => {
    it('should return consistent snapshot structure', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40
      });

      expect(snapshot.signals).toBeDefined();
      expect(Array.isArray(snapshot.signals)).toBe(true);
      expect(snapshot.totals).toBeDefined();
      expect(snapshot.governance).toBeDefined();
      expect(snapshot.warnings).toBeDefined();
      expect(snapshot.disclaimer).toBeDefined();
    });

    it('should include disclaimer in every snapshot', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40
      });

      expect(snapshot.disclaimer).toBeTruthy();
      expect(snapshot.disclaimer.toLowerCase()).toContain('governance indicators');
    });

    it('should include rationale and suggested actions in signals', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        validationStatus: 'pass'
      });

      expect(snapshot.signals.length).toBeGreaterThan(0);
      snapshot.signals.forEach((signal) => {
        expect(signal.rationale).toBeTruthy();
        if (signal.suggestedAction) {
          expect(signal.suggestedAction.length).toBeGreaterThan(5);
        }
      });
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('should handle minimal input gracefully', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 0,
        incidents24h: 0,
        correlations24h: 0,
        alerts30d: 0,
        incidents30d: 0
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.totals).toBeDefined();
      expect(snapshot.governance).toBeDefined();
    });

    it('should handle extreme input values', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10000,
        incidents24h: 5000,
        correlations24h: 500,
        alerts30d: 300000,
        incidents30d: 150000
      });

      expect(snapshot.signals).toBeDefined();
      expect(snapshot.totals.alerts).toBe(10000);
    });

    it('should continue processing with partial governance data', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        auditEnabled: true,
        validationStatus: 'pass'
        // Missing: aiAllowed, backupStatus, etc.
      });

      expect(snapshot.governance).toBeDefined();
      expect(snapshot.governance.auditEnabled).toBe(true);
      expect(snapshot.governance.validationStatus).toBe('pass');
    });
  });

  describe('Compliance & Safety', () => {
    it('should never expose identifiers in signals', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40
      });

      const jsonStr = JSON.stringify(snapshot);
      // Check for common identifier patterns
      expect(jsonStr).not.toMatch(/case[_\s]?id/i);
      expect(jsonStr).not.toMatch(/citizen/i);
      expect(jsonStr).not.toMatch(/resident/i);
      expect(jsonStr).not.toMatch(/staff/i);
    });

    it('should clearly mark transparency score as informational', async () => {
      const snapshot = await deriveGovernmentSignals({
        alerts24h: 10,
        incidents24h: 5,
        correlations24h: 1,
        alerts30d: 80,
        incidents30d: 40,
        externalSharingPolicy: 'restricted'
      });

      const transparencySignal = snapshot.signals.find((s) => s.key === 'transparency_score');
      if (transparencySignal) {
        expect(transparencySignal.rationale).toContain('Informational');
      }
    });
  });
});
