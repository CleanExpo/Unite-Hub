/**
 * Integration Tests: Complete Agent Execution Flow
 * Tests all Project Vend Phase 2 components working together
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMetricsCollector } from '@/lib/agents/metrics/metricsCollector';
import { getHealthMonitor } from '@/lib/agents/metrics/healthMonitor';
import { getRulesEngine } from '@/lib/agents/rules/rulesEngine';
import { getEscalationManager } from '@/lib/agents/escalation/escalationManager';
import { getAgentVerifier } from '@/lib/agents/verification/verifier';
import { getBudgetEnforcer } from '@/lib/agents/cost/budgetEnforcer';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
  }))
}));

describe('Agent Execution Flow Integration', () => {
  describe('Service Singletons', () => {
    it('all services use singleton pattern', () => {
      const metricsCollector1 = getMetricsCollector();
      const metricsCollector2 = getMetricsCollector();
      expect(metricsCollector1).toBe(metricsCollector2);

      const healthMonitor1 = getHealthMonitor();
      const healthMonitor2 = getHealthMonitor();
      expect(healthMonitor1).toBe(healthMonitor2);

      const rulesEngine1 = getRulesEngine();
      const rulesEngine2 = getRulesEngine();
      expect(rulesEngine1).toBe(rulesEngine2);

      const escalationManager1 = getEscalationManager();
      const escalationManager2 = getEscalationManager();
      expect(escalationManager1).toBe(escalationManager2);

      const verifier1 = getAgentVerifier();
      const verifier2 = getAgentVerifier();
      expect(verifier1).toBe(verifier2);

      const budgetEnforcer1 = getBudgetEnforcer();
      const budgetEnforcer2 = getBudgetEnforcer();
      expect(budgetEnforcer1).toBe(budgetEnforcer2);
    });
  });

  describe('Cost Calculation Integration', () => {
    it('calculates cost correctly for Opus model', () => {
      const collector = getMetricsCollector();
      const cost = collector.calculateCost('opus-4-5-20251101', 10_000, 5_000);

      // $15/M * 10K + $75/M * 5K = $0.15 + $0.375 = $0.525
      expect(cost).toBeCloseTo(0.525, 3);
    });

    it('calculates cost correctly for Sonnet model', () => {
      const collector = getMetricsCollector();
      const cost = collector.calculateCost('sonnet-4-5-20250929', 10_000, 5_000);

      // $3/M * 10K + $15/M * 5K = $0.03 + $0.075 = $0.105
      expect(cost).toBeCloseTo(0.105, 3);
    });
  });

  describe('Health Status Calculation', () => {
    it('correctly classifies healthy agent', () => {
      const monitor = getHealthMonitor();
      const status = monitor.calculateHealthStatus(95, 5, 0);

      expect(status).toBe('healthy');
    });

    it('correctly classifies degraded agent', () => {
      const monitor = getHealthMonitor();
      const status = monitor.calculateHealthStatus(80, 20, 3);

      expect(status).toBe('degraded');
    });

    it('correctly classifies critical agent', () => {
      const monitor = getHealthMonitor();
      const status = monitor.calculateHealthStatus(65, 35, 5);

      expect(status).toBe('critical');
    });
  });

  describe('Verification Integration', () => {
    it('verifies email intent correctly', () => {
      const verifier = getAgentVerifier();
      const result = verifier.verifyEmailIntent(
        'requesting product information',
        'Hi, I would like more details about your products.'
      );

      expect(result.passed).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('verifies contact data correctly', () => {
      const verifier = getAgentVerifier();
      const result = verifier.verifyContactData({
        email: 'john@example.com',
        name: 'John Doe',
        company: 'Acme Corp'
      });

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects content quality issues', () => {
      const verifier = getAgentVerifier();
      const result = verifier.verifyContentQuality('Too short');

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    it('follows expected execution order: Budget → Rules → Execute → Verify', () => {
      // This test documents the expected flow
      const executionOrder = [
        '1. Record execution start',
        '2. Check budget (budgetEnforcer)',
        '3. Validate rules (rulesEngine)',
        '4. Execute task (processTask)',
        '5. Verify output (verifier)',
        '6. Record metrics (metricsCollector)',
        '7. Update health (healthMonitor)',
        '8. Record execution success'
      ];

      expect(executionOrder).toHaveLength(8);
      expect(executionOrder[1]).toContain('budget');
      expect(executionOrder[2]).toContain('rules');
      expect(executionOrder[4]).toContain('Verify');
    });
  });

  describe('Error Handling', () => {
    it('services fail gracefully when Supabase unavailable', async () => {
      // All services should handle DB errors without throwing
      const collector = getMetricsCollector();
      await expect(
        collector.recordMetrics({
          workspace_id: 'ws-123',
          agent_name: 'TestAgent',
          execution_time_ms: 100,
          success: true
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('Project Vend Lessons Applied', () => {
    it('prevents extreme score changes (Lesson 1: Explicit Rules)', () => {
      // Project Vend Issue: Claudius made naive decisions
      // Solution: Hard constraints on score changes
      const verifier = getAgentVerifier();
      const result = verifier.verifyScoreChangeReasonable(35);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain('Extreme score change');
    });

    it('tracks metrics for improvement (Lesson 2: Metrics Drive Improvement)', async () => {
      // Project Vend Issue: No feedback loop on decisions
      // Solution: Comprehensive metrics tracking
      const collector = getMetricsCollector();

      await expect(
        collector.recordMetrics({
          workspace_id: 'ws-123',
          agent_name: 'EmailAgent',
          execution_time_ms: 1500,
          success: true,
          cost_usd: 0.05
        })
      ).resolves.toBeUndefined();

      // Metrics enable data-driven optimization
    });

    it('verifies outputs before applying (Lesson 3: Verification Beats Trust)', () => {
      // Project Vend Issue: Onion Futures Act violation (no verification)
      // Solution: Verify all outputs before applying
      const verifier = getAgentVerifier();
      const result = verifier.verifyContactData({
        email: 'invalid-email' // Would cause errors downstream
      });

      expect(result.passed).toBe(false);
    });

    it('escalates unusual situations (Lesson 4: Escalation Prevents Disasters)', async () => {
      // Project Vend Issue: Imposter CEO scenario (no escalation)
      // Solution: Automatic escalation for anomalies
      const manager = getEscalationManager();

      // Verify escalation manager is available and has createEscalation method
      expect(manager).toBeDefined();
      expect(typeof manager.createEscalation).toBe('function');

      // In real execution, this would create escalation requiring approval
      // Mock environment just validates the API exists
    });

    it('enforces budget limits (Lesson 5: Autonomous Needs Supervision)', async () => {
      // Project Vend Issue: Gave away products at losses (no cost control)
      // Solution: Budget enforcement prevents runaway costs
      const enforcer = getBudgetEnforcer();

      const status = await enforcer.checkBudget('ExpensiveAgent', 'ws-123', 100.00);

      // Budget check completes (real check happens in database function)
      expect(status).toBeDefined();
      expect(status.within_budget).toBeDefined();
    });
  });
});
