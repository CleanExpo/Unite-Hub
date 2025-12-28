/**
 * Tests for RulesEngine
 * Part of Project Vend Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RulesEngine, getRulesEngine, ValidationContext } from '@/lib/agents/rules/rulesEngine';

// Mock Supabase
const mockInsert = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  order: mockOrder
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

describe('RulesEngine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new RulesEngine();
  });

  describe('validateAction - Constraint Rules', () => {
    it('blocks action when score change exceeds max', async () => {
      const mockRules = [{
        id: 'rule-1',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        rule_name: 'max_score_change',
        rule_type: 'constraint',
        config: { max_score_change: 20 },
        enabled: true,
        priority: 10,
        enforcement_level: 'block',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'EmailAgent',
        workspace_id: 'ws-123',
        action_type: 'update_score',
        action_data: { score_change: 30 }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false);
      expect(result.enforcement).toBe('block');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].violation_type).toBe('constraint_exceeded');
      expect(result.violations[0].severity).toBe('high');
    });

    it('allows action when score change within limit', async () => {
      const mockRules = [{
        id: 'rule-1',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        rule_name: 'max_score_change',
        rule_type: 'constraint',
        config: { max_score_change: 20 },
        enabled: true,
        priority: 10,
        enforcement_level: 'block',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });

      const context: ValidationContext = {
        agent_name: 'EmailAgent',
        workspace_id: 'ws-123',
        action_type: 'update_score',
        action_data: { score_change: 15 }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('blocks duplicate contact creation', async () => {
      const mockRules = [{
        id: 'rule-2',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        rule_name: 'no_duplicates',
        rule_type: 'constraint',
        config: { cannot_create_duplicate_contacts: true },
        enabled: true,
        priority: 10,
        enforcement_level: 'block',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'EmailAgent',
        workspace_id: 'ws-123',
        action_type: 'create_contact',
        action_data: { email: 'test@example.com', duplicate_detected: true }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('duplicate contact');
    });
  });

  describe('validateAction - Validation Rules', () => {
    it('blocks low confidence actions', async () => {
      const mockRules = [{
        id: 'rule-3',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        rule_name: 'min_confidence',
        rule_type: 'validation',
        config: { min_confidence: 0.7 },
        enabled: true,
        priority: 20,
        enforcement_level: 'block',
        escalate_on_violation: true
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: { confidence_score: 0.5 }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false);
      expect(result.should_escalate).toBe(true);
      expect(result.violations[0].message).toContain('Confidence 0.5 below minimum 0.7');
    });

    it('detects missing personalization tokens', async () => {
      const mockRules = [{
        id: 'rule-4',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        rule_name: 'require_tokens',
        rule_type: 'validation',
        config: { require_personalization_tokens: true },
        enabled: true,
        priority: 10,
        enforcement_level: 'block',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: { content: 'Hello! This is generic content without tokens.' }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false);
      expect(result.violations[0].message).toContain('missing personalization tokens');
    });

    it('allows content with personalization tokens', async () => {
      const mockRules = [{
        id: 'rule-4',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        rule_name: 'require_tokens',
        rule_type: 'validation',
        config: { require_personalization_tokens: true },
        enabled: true,
        priority: 10,
        enforcement_level: 'block',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: { content: 'Hi {firstName}, check out this offer!' }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('detects missing CTA', async () => {
      const mockRules = [{
        id: 'rule-5',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        rule_name: 'require_cta',
        rule_type: 'validation',
        config: { require_cta: true },
        enabled: true,
        priority: 20,
        enforcement_level: 'warn',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: { content: 'Just some info about {company}.' }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(true); // warn level allows through
      expect(result.violations).toHaveLength(1);
      expect(result.enforcement).toBe('warn');
    });

    it('validates email format', async () => {
      const mockRules = [{
        id: 'rule-6',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        rule_name: 'email_format',
        rule_type: 'validation',
        config: { must_validate_email_format: true },
        enabled: true,
        priority: 5,
        enforcement_level: 'block',
        escalate_on_violation: false
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'EmailAgent',
        workspace_id: 'ws-123',
        action_type: 'process_email',
        action_data: { email: 'invalid-email' }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false);
      expect(result.violations[0].severity).toBe('high');
      expect(result.violations[0].message).toContain('Invalid email format');
    });
  });

  describe('validateAction - Cost Limit Rules', () => {
    it('blocks when daily budget exceeded', async () => {
      const mockRules = [{
        id: 'rule-7',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        rule_name: 'daily_budget',
        rule_type: 'cost_limit',
        config: { daily_budget_usd: 10.00 },
        enabled: true,
        priority: 5,
        enforcement_level: 'block',
        escalate_on_violation: true
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });

      // Mock cost data showing $9 already spent
      const mockCosts = [
        { cost_usd: '5.00' },
        { cost_usd: '4.00' }
      ];
      mockGte.mockResolvedValue({ data: mockCosts, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: { estimated_cost_usd: 2.00 } // Would exceed $10 daily limit
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false);
      expect(result.should_escalate).toBe(true);
      expect(result.violations[0].violation_type).toBe('cost_limit_exceeded');
    });

    it('allows when within daily budget', async () => {
      const mockRules = [{
        id: 'rule-7',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        rule_name: 'daily_budget',
        rule_type: 'cost_limit',
        config: { daily_budget_usd: 10.00 },
        enabled: true,
        priority: 5,
        enforcement_level: 'block',
        escalate_on_violation: true
      }];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });

      // Mock cost data showing $5 already spent
      const mockCosts = [{ cost_usd: '5.00' }];
      mockGte.mockResolvedValue({ data: mockCosts, error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: { estimated_cost_usd: 3.00 } // Total $8, within $10 limit
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('validateAction - Multiple Rules', () => {
    it('checks all rules and returns most severe enforcement', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          workspace_id: 'ws-123',
          agent_name: 'ContentGenerator',
          rule_name: 'min_confidence',
          rule_type: 'validation',
          config: { min_confidence: 0.7 },
          enabled: true,
          priority: 20,
          enforcement_level: 'warn',
          escalate_on_violation: false
        },
        {
          id: 'rule-2',
          workspace_id: 'ws-123',
          agent_name: 'ContentGenerator',
          rule_name: 'require_tokens',
          rule_type: 'validation',
          config: { require_personalization_tokens: true },
          enabled: true,
          priority: 10,
          enforcement_level: 'block',
          escalate_on_violation: false
        }
      ];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });
      mockInsert.mockResolvedValue({ error: null });

      const context: ValidationContext = {
        agent_name: 'ContentGenerator',
        workspace_id: 'ws-123',
        action_type: 'generate_content',
        action_data: {
          confidence_score: 0.6, // Violates rule 1 (warn)
          content: 'No tokens here' // Violates rule 2 (block)
        }
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(false); // Block wins over warn
      expect(result.enforcement).toBe('block');
      expect(result.violations).toHaveLength(2);
    });

    it('respects rule priority order', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          workspace_id: 'ws-123',
          agent_name: 'EmailAgent',
          rule_name: 'high_priority_rule',
          rule_type: 'constraint',
          config: { max_score_change: 15 },
          enabled: true,
          priority: 5, // Higher priority (lower number)
          enforcement_level: 'block',
          escalate_on_violation: false
        },
        {
          id: 'rule-2',
          workspace_id: 'ws-123',
          agent_name: 'EmailAgent',
          rule_name: 'low_priority_rule',
          rule_type: 'constraint',
          config: { max_score_change: 20 },
          enabled: true,
          priority: 100, // Lower priority
          enforcement_level: 'warn',
          escalate_on_violation: false
        }
      ];

      mockOrder.mockResolvedValue({ data: mockRules, error: null });

      const result = await engine.validateAction({
        agent_name: 'EmailAgent',
        workspace_id: 'ws-123',
        action_type: 'update_score',
        action_data: { score_change: 10 }
      });

      expect(mockOrder).toHaveBeenCalledWith('priority', { ascending: true });
    });
  });

  describe('validateAction - No Rules', () => {
    it('allows action when no rules exist', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const context: ValidationContext = {
        agent_name: 'NewAgent',
        workspace_id: 'ws-123',
        action_type: 'some_action',
        action_data: {}
      };

      const result = await engine.validateAction(context);

      expect(result.allowed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.enforcement).toBe('none');
    });
  });

  describe('getViolationStats', () => {
    it('aggregates violation statistics correctly', async () => {
      const mockViolations = [
        {
          severity: 'high',
          violation_type: 'constraint_exceeded',
          action_taken: 'blocked'
        },
        {
          severity: 'high',
          violation_type: 'constraint_exceeded',
          action_taken: 'blocked'
        },
        {
          severity: 'medium',
          violation_type: 'validation_failed',
          action_taken: 'allowed_with_warning'
        },
        {
          severity: 'critical',
          violation_type: 'cost_limit_exceeded',
          action_taken: 'escalated'
        }
      ];

      mockGte.mockResolvedValue({ data: mockViolations, error: null });

      const stats = await engine.getViolationStats('EmailAgent', 'ws-123', 24);

      expect(stats.total_violations).toBe(4);
      expect(stats.by_severity['high']).toBe(2);
      expect(stats.by_severity['medium']).toBe(1);
      expect(stats.by_severity['critical']).toBe(1);
      expect(stats.by_type['constraint_exceeded']).toBe(2);
      expect(stats.by_type['validation_failed']).toBe(1);
      expect(stats.blocked_count).toBe(2);
      expect(stats.escalated_count).toBe(1);
    });

    it('handles no violations gracefully', async () => {
      mockGte.mockResolvedValue({ data: [], error: null });

      const stats = await engine.getViolationStats('CleanAgent', 'ws-123', 24);

      expect(stats.total_violations).toBe(0);
      expect(stats.blocked_count).toBe(0);
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const instance1 = getRulesEngine();
      const instance2 = getRulesEngine();

      expect(instance1).toBe(instance2);
    });
  });
});
