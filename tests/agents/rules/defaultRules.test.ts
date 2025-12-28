/**
 * Tests for Default Rules Configuration
 * Part of Project Vend Phase 2
 */

import { describe, it, expect } from 'vitest';
import {
  EMAIL_AGENT_RULES,
  CONTENT_GENERATOR_RULES,
  ORCHESTRATOR_RULES,
  getAllDefaultRules,
  getDefaultRulesForAgent
} from '@/lib/agents/rules/defaultRules';

describe('DefaultRules', () => {
  describe('EMAIL_AGENT_RULES', () => {
    it('includes all expected rules', () => {
      expect(EMAIL_AGENT_RULES).toHaveLength(6);

      const ruleNames = EMAIL_AGENT_RULES.map(r => r.rule_name);
      expect(ruleNames).toContain('max_score_change_constraint');
      expect(ruleNames).toContain('min_confidence_for_important');
      expect(ruleNames).toContain('cannot_create_duplicate_contacts');
      expect(ruleNames).toContain('must_validate_email_format');
      expect(ruleNames).toContain('escalate_on_extreme_score_change');
      expect(ruleNames).toContain('daily_cost_limit');
    });

    it('has correct constraint values', () => {
      const maxScoreRule = EMAIL_AGENT_RULES.find(r => r.rule_name === 'max_score_change_constraint');
      expect(maxScoreRule?.config.max_score_change).toBe(20);
      expect(maxScoreRule?.enforcement_level).toBe('block');

      const confidenceRule = EMAIL_AGENT_RULES.find(r => r.rule_name === 'min_confidence_for_important');
      expect(confidenceRule?.config.min_confidence).toBe(0.8);

      const costRule = EMAIL_AGENT_RULES.find(r => r.rule_name === 'daily_cost_limit');
      expect(costRule?.config.daily_budget_usd).toBe(10.00);
    });

    it('has valid priorities', () => {
      EMAIL_AGENT_RULES.forEach(rule => {
        expect(rule.priority).toBeGreaterThan(0);
        expect(rule.enabled).toBe(true);
      });
    });
  });

  describe('CONTENT_GENERATOR_RULES', () => {
    it('includes all expected rules', () => {
      expect(CONTENT_GENERATOR_RULES).toHaveLength(8);

      const ruleNames = CONTENT_GENERATOR_RULES.map(r => r.rule_name);
      expect(ruleNames).toContain('min_confidence_validation');
      expect(ruleNames).toContain('max_content_length');
      expect(ruleNames).toContain('require_personalization_tokens');
      expect(ruleNames).toContain('require_cta');
      expect(ruleNames).toContain('cannot_use_all_caps');
      expect(ruleNames).toContain('daily_cost_limit');
      expect(ruleNames).toContain('per_execution_cost_limit');
    });

    it('has correct validation requirements', () => {
      const confidenceRule = CONTENT_GENERATOR_RULES.find(r => r.rule_name === 'min_confidence_validation');
      expect(confidenceRule?.config.min_confidence).toBe(0.7);
      expect(confidenceRule?.enforcement_level).toBe('block');

      const lengthRule = CONTENT_GENERATOR_RULES.find(r => r.rule_name === 'max_content_length');
      expect(lengthRule?.config.max_content_length).toBe(300);

      const tokensRule = CONTENT_GENERATOR_RULES.find(r => r.rule_name === 'require_personalization_tokens');
      expect(tokensRule?.config.require_personalization_tokens).toBe(true);
    });

    it('has appropriate cost limits', () => {
      const dailyCost = CONTENT_GENERATOR_RULES.find(r => r.rule_name === 'daily_cost_limit');
      expect(dailyCost?.config.daily_budget_usd).toBe(25.00);

      const perExecCost = CONTENT_GENERATOR_RULES.find(r => r.rule_name === 'per_execution_cost_limit');
      expect(perExecCost?.config.per_execution_limit_usd).toBe(0.50);
    });
  });

  describe('ORCHESTRATOR_RULES', () => {
    it('includes all expected rules', () => {
      expect(ORCHESTRATOR_RULES).toHaveLength(4);

      const ruleNames = ORCHESTRATOR_RULES.map(r => r.rule_name);
      expect(ruleNames).toContain('max_enrollment_delay');
      expect(ruleNames).toContain('max_condition_depth');
      expect(ruleNames).toContain('cannot_skip_campaign_steps');
      expect(ruleNames).toContain('daily_cost_limit');
    });

    it('has correct constraint values', () => {
      const delayRule = ORCHESTRATOR_RULES.find(r => r.rule_name === 'max_enrollment_delay');
      expect(delayRule?.config.max_enrollment_delay_hours).toBe(24);

      const depthRule = ORCHESTRATOR_RULES.find(r => r.rule_name === 'max_condition_depth');
      expect(depthRule?.config.max_condition_depth).toBe(5);
      expect(depthRule?.enforcement_level).toBe('block');

      const skipRule = ORCHESTRATOR_RULES.find(r => r.rule_name === 'cannot_skip_campaign_steps');
      expect(skipRule?.config.cannot_skip_campaign_steps).toBe(true);
      expect(skipRule?.enforcement_level).toBe('block');
    });
  });

  describe('getAllDefaultRules', () => {
    it('returns rules for all agent types', () => {
      const allRules = getAllDefaultRules();

      expect(allRules).toHaveProperty('EmailAgent');
      expect(allRules).toHaveProperty('ContentGenerator');
      expect(allRules).toHaveProperty('Orchestrator');
    });

    it('includes aliases for agent names', () => {
      const allRules = getAllDefaultRules();

      expect(allRules).toHaveProperty('email-processor');
      expect(allRules).toHaveProperty('email-intelligence-agent');
      expect(allRules).toHaveProperty('content-personalization');
      expect(allRules).toHaveProperty('orchestrator-router');
    });

    it('aliases point to same rule sets', () => {
      const allRules = getAllDefaultRules();

      expect(allRules['EmailAgent']).toBe(allRules['email-processor']);
      expect(allRules['ContentGenerator']).toBe(allRules['content-personalization']);
      expect(allRules['Orchestrator']).toBe(allRules['orchestrator-router']);
    });
  });

  describe('getDefaultRulesForAgent', () => {
    it('returns rules for known agent', () => {
      const rules = getDefaultRulesForAgent('EmailAgent');

      expect(rules).toHaveLength(6);
      expect(rules).toBe(EMAIL_AGENT_RULES);
    });

    it('returns rules for agent aliases', () => {
      const rules = getDefaultRulesForAgent('email-processor');

      expect(rules).toHaveLength(6);
      expect(rules).toBe(EMAIL_AGENT_RULES);
    });

    it('returns empty array for unknown agent', () => {
      const rules = getDefaultRulesForAgent('UnknownAgent');

      expect(rules).toHaveLength(0);
    });
  });

  describe('Rule Structure Validation', () => {
    it('all rules have required fields', () => {
      const allRules = [
        ...EMAIL_AGENT_RULES,
        ...CONTENT_GENERATOR_RULES,
        ...ORCHESTRATOR_RULES
      ];

      allRules.forEach(rule => {
        expect(rule).toHaveProperty('rule_name');
        expect(rule).toHaveProperty('rule_type');
        expect(rule).toHaveProperty('config');
        expect(rule).toHaveProperty('enabled');
        expect(rule).toHaveProperty('priority');
        expect(rule).toHaveProperty('enforcement_level');
        expect(rule).toHaveProperty('escalate_on_violation');
        expect(rule).toHaveProperty('description');

        // Validate types
        expect(typeof rule.rule_name).toBe('string');
        expect(['constraint', 'validation', 'escalation', 'cost_limit']).toContain(rule.rule_type);
        expect(typeof rule.config).toBe('object');
        expect(typeof rule.enabled).toBe('boolean');
        expect(typeof rule.priority).toBe('number');
        expect(['block', 'warn', 'log']).toContain(rule.enforcement_level);
        expect(typeof rule.escalate_on_violation).toBe('boolean');
        expect(typeof rule.description).toBe('string');
      });
    });

    it('all rule names are unique per agent', () => {
      const checkUniqueness = (rules: any[]) => {
        const names = rules.map(r => r.rule_name);
        const uniqueNames = new Set(names);
        expect(names.length).toBe(uniqueNames.size);
      };

      checkUniqueness(EMAIL_AGENT_RULES);
      checkUniqueness(CONTENT_GENERATOR_RULES);
      checkUniqueness(ORCHESTRATOR_RULES);
    });

    it('priorities are positive integers', () => {
      const allRules = [
        ...EMAIL_AGENT_RULES,
        ...CONTENT_GENERATOR_RULES,
        ...ORCHESTRATOR_RULES
      ];

      allRules.forEach(rule => {
        expect(rule.priority).toBeGreaterThan(0);
        expect(Number.isInteger(rule.priority)).toBe(true);
      });
    });
  });
});
