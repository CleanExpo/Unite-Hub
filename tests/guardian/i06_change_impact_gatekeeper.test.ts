/**
 * Guardian I06: Change Impact Gatekeeper Tests
 *
 * Test coverage:
 * - Change diff collection and classification
 * - Impact planning for different change types
 * - Gate decision logic
 * - Orchestrator flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  collectRuleDiff,
  collectPlaybookDiff,
  collectThresholdDiff,
  mergeDiffs,
  generateImpactHints,
  type GuardianChangeDiff,
  type GuardianRuleSnapshot,
  type GuardianPlaybookSnapshot,
  type GuardianThresholdSnapshot,
} from '@/lib/guardian/simulation/changeDiffCollector';
import {
  applyDecisionLogic,
  formatGateDecision,
  DEFAULT_GATE_CONFIG,
  type GuardianGateEvaluationResult,
} from '@/lib/guardian/simulation/gateEvaluationEngine';

describe('Guardian I06: Change Impact Gatekeeper', () => {
  // ===== DIFF COLLECTION TESTS =====
  describe('Change Diff Collection', () => {
    it('should detect added rules', () => {
      const before: GuardianRuleSnapshot[] = [
        { key: 'auth_failure', name: 'Auth Failure', severity: 'high', enabled: true },
      ];

      const after: GuardianRuleSnapshot[] = [
        { key: 'auth_failure', name: 'Auth Failure', severity: 'high', enabled: true },
        { key: 'new_rule', name: 'New Rule', severity: 'critical', enabled: true },
      ];

      const diff = collectRuleDiff(before, after);

      expect(diff.rules?.added).toContain('new_rule');
      expect(diff.rules?.removed).toEqual([]);
      expect(diff.rules?.modified).toEqual([]);
    });

    it('should detect removed rules', () => {
      const before: GuardianRuleSnapshot[] = [
        { key: 'old_rule', name: 'Old Rule', severity: 'low', enabled: true },
        { key: 'keep_rule', name: 'Keep', severity: 'medium', enabled: true },
      ];

      const after: GuardianRuleSnapshot[] = [
        { key: 'keep_rule', name: 'Keep', severity: 'medium', enabled: true },
      ];

      const diff = collectRuleDiff(before, after);

      expect(diff.rules?.removed).toContain('old_rule');
      expect(diff.rules?.added).toEqual([]);
    });

    it('should detect modified rules (severity change)', () => {
      const before: GuardianRuleSnapshot[] = [
        { key: 'cpu_spike', name: 'CPU Spike', severity: 'medium', enabled: true },
      ];

      const after: GuardianRuleSnapshot[] = [
        { key: 'cpu_spike', name: 'CPU Spike', severity: 'critical', enabled: true },
      ];

      const diff = collectRuleDiff(before, after);

      expect(diff.rules?.modified).toContain('cpu_spike');
      expect(diff.rules?.added).toEqual([]);
      expect(diff.rules?.removed).toEqual([]);
    });

    it('should detect modified rules (enabled state change)', () => {
      const before: GuardianRuleSnapshot[] = [
        { key: 'rule1', name: 'Rule 1', severity: 'high', enabled: true },
      ];

      const after: GuardianRuleSnapshot[] = [
        { key: 'rule1', name: 'Rule 1', severity: 'high', enabled: false },
      ];

      const diff = collectRuleDiff(before, after);

      expect(diff.rules?.modified).toContain('rule1');
    });

    it('should detect added playbooks', () => {
      const before: GuardianPlaybookSnapshot[] = [];
      const after: GuardianPlaybookSnapshot[] = [
        { key: 'auto_remediate', name: 'Auto Remediate', enabled: true },
      ];

      const diff = collectPlaybookDiff(before, after);

      expect(diff.playbooks?.added).toContain('auto_remediate');
    });

    it('should detect modified playbooks (actions change)', () => {
      const before: GuardianPlaybookSnapshot[] = [
        {
          key: 'escalate',
          name: 'Escalate',
          enabled: true,
          actions: ['notify_slack'],
        },
      ];

      const after: GuardianPlaybookSnapshot[] = [
        {
          key: 'escalate',
          name: 'Escalate',
          enabled: true,
          actions: ['notify_slack', 'create_jira_ticket'],
        },
      ];

      const diff = collectPlaybookDiff(before, after);

      expect(diff.playbooks?.modified).toContain('escalate');
    });

    it('should detect threshold changes', () => {
      const before: GuardianThresholdSnapshot[] = [
        { key: 'alert_threshold', value: 100, severity: 'high' },
      ];

      const after: GuardianThresholdSnapshot[] = [
        { key: 'alert_threshold', value: 150, severity: 'high' },
      ];

      const diff = collectThresholdDiff(before, after);

      expect(diff.thresholds?.modified).toContain('alert_threshold');
    });
  });

  // ===== DIFF MERGING AND HINTS =====
  describe('Diff Merging and Impact Hints', () => {
    it('should merge multiple diff categories', () => {
      const ruleDiff = collectRuleDiff([], [
        { key: 'new_rule', severity: 'high', enabled: true },
      ]);
      const playbookDiff = collectPlaybookDiff([], [
        { key: 'auto_remediate', enabled: true },
      ]);

      const merged = mergeDiffs(ruleDiff, playbookDiff);

      expect(merged.rules?.added).toContain('new_rule');
      expect(merged.playbooks?.added).toContain('auto_remediate');
    });

    it('should generate impact hints for rule additions', () => {
      const diff: GuardianChangeDiff = {
        rules: { added: ['rule1', 'rule2'], removed: [], modified: [] },
      };

      const hints = generateImpactHints(diff);

      expect(hints).toContain('added_2_rules');
    });

    it('should generate impact hints for playbook modifications', () => {
      const diff: GuardianChangeDiff = {
        playbooks: { added: [], removed: [], modified: ['playbook1'] },
      };

      const hints = generateImpactHints(diff);

      expect(hints).toContain('modified_playbooks');
    });

    it('should generate impact hints for threshold changes', () => {
      const diff: GuardianChangeDiff = {
        thresholds: { added: [], removed: [], modified: ['threshold1', 'threshold2'] },
      };

      const hints = generateImpactHints(diff);

      expect(hints).toContain('threshold_changes');
    });
  });

  // ===== GATE DECISION LOGIC =====
  describe('Gate Decision Logic', () => {
    it('should allow on no drift and no failures', () => {
      const { decision, flags } = applyDecisionLogic(null, false);

      expect(decision).toBe('allow');
      expect(flags).toHaveLength(0);
    });

    it('should block on regression failure', () => {
      const { decision, flags } = applyDecisionLogic(null, true, {
        failureOnRegressionFail: true,
      });

      expect(decision).toBe('block');
      expect(flags).toContain('Regression pack execution failed');
    });

    it('should block on critical drift', () => {
      const drift = {
        severity: 'critical',
        deltas: {},
        flags: [],
        summaryMarkdown: '',
      };

      const { decision, flags } = applyDecisionLogic(drift, false, {
        failureOnCriticalDrift: true,
      });

      expect(decision).toBe('block');
      expect(flags).toContain('Critical drift detected in impact assessment');
    });

    it('should warn on warning-level drift', () => {
      const drift = {
        severity: 'warning',
        deltas: {},
        flags: [],
        summaryMarkdown: '',
      };

      const { decision, flags } = applyDecisionLogic(drift, false);

      expect(decision).toBe('warn');
      expect(flags).toContain('Warning-level drift detected');
    });

    it('should allow on info-level drift', () => {
      const drift = {
        severity: 'info',
        deltas: {},
        flags: [],
        summaryMarkdown: '',
      };

      const { decision, flags } = applyDecisionLogic(drift, false);

      expect(decision).toBe('allow');
    });

    it('should prioritize block over warn', () => {
      const drift = {
        severity: 'critical',
        deltas: {},
        flags: [],
        summaryMarkdown: '',
      };

      const { decision } = applyDecisionLogic(drift, false, {
        failureOnCriticalDrift: true,
      });

      expect(decision).toBe('block');
    });
  });

  // ===== DECISION FORMATTING =====
  describe('Decision Formatting', () => {
    it('should format allow decision', () => {
      const result: GuardianGateEvaluationResult = {
        decision: 'allow',
        reason: 'No issues detected',
        flags: [],
        summary: {},
      };

      const formatted = formatGateDecision(result);

      expect(formatted).toContain('ALLOW');
      expect(formatted).toContain('No issues detected');
    });

    it('should format block decision with flags', () => {
      const result: GuardianGateEvaluationResult = {
        decision: 'block',
        reason: 'Critical drift detected',
        flags: ['Alert volume increased', 'New high-severity rule'],
        summary: {},
      };

      const formatted = formatGateDecision(result);

      expect(formatted).toContain('BLOCK');
      expect(formatted).toContain('Alert volume increased');
      expect(formatted).toContain('New high-severity rule');
    });

    it('should format warn decision', () => {
      const result: GuardianGateEvaluationResult = {
        decision: 'warn',
        reason: 'Review recommended',
        flags: ['Playbook simulation enabled'],
        summary: {},
      };

      const formatted = formatGateDecision(result);

      expect(formatted).toContain('WARN');
      expect(formatted).toContain('Review recommended');
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Gatekeeper Integration', () => {
    it('should handle mixed change types', () => {
      const ruleDiff = collectRuleDiff([], [
        { key: 'new_rule', severity: 'critical', enabled: true },
      ]);
      const playbookDiff = collectPlaybookDiff(
        [],
        [{ key: 'remediate', enabled: true }]
      );
      const thresholdDiff = collectThresholdDiff([], [
        { key: 'risk_threshold', value: 8.5, severity: 'high' },
      ]);

      const merged = mergeDiffs(ruleDiff, playbookDiff, thresholdDiff);
      const hints = generateImpactHints(merged);

      expect(merged.rules?.added).toHaveLength(1);
      expect(merged.playbooks?.added).toHaveLength(1);
      expect(merged.thresholds?.added).toHaveLength(1);
      expect(hints.length).toBeGreaterThan(0);
    });

    it('should handle empty before/after snapshots', () => {
      const diff = collectRuleDiff([], []);

      expect(diff.rules?.added).toEqual([]);
      expect(diff.rules?.removed).toEqual([]);
      expect(diff.rules?.modified).toEqual([]);
    });

    it('should use default gate config when not provided', () => {
      expect(DEFAULT_GATE_CONFIG.failureOnCriticalDrift).toBe(true);
      expect(DEFAULT_GATE_CONFIG.failureOnRegressionFail).toBe(true);
      expect(DEFAULT_GATE_CONFIG.warnOnPlaybookExplosionFactor).toBe(1.5);
    });
  });
});
