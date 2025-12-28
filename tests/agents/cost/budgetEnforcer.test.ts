/**
 * Tests for BudgetEnforcer
 * Part of Project Vend Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetEnforcer, getBudgetEnforcer } from '@/lib/agents/cost/budgetEnforcer';

// Mock Supabase
const mockUpsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockReturnThis();
const mockLt = vi.fn().mockReturnThis();
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  update: mockUpdate,
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
  lt: mockLt
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc
  }))
}));

// Mock MetricsCollector
vi.mock('@/lib/agents/metrics/metricsCollector', () => ({
  getMetricsCollector: vi.fn(() => ({}))
}));

describe('BudgetEnforcer', () => {
  let enforcer: BudgetEnforcer;

  beforeEach(() => {
    vi.clearAllMocks();
    enforcer = new BudgetEnforcer();
  });

  describe('checkBudget', () => {
    it('returns within budget when no budget exists', async () => {
      mockRpc.mockResolvedValue({
        data: [{ within_budget: true, daily_remaining: null, monthly_remaining: null, budget_type: 'none' }],
        error: null
      });

      const status = await enforcer.checkBudget('EmailAgent', 'ws-123', 0.05);

      expect(status.within_budget).toBe(true);
      expect(status.budget_type).toBe('none');
    });

    it('returns not within budget when daily limit exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: [{ within_budget: false, daily_remaining: -2.50, monthly_remaining: null, budget_type: 'daily' }],
        error: null
      });

      const status = await enforcer.checkBudget('ContentGenerator', 'ws-123', 5.00);

      expect(status.within_budget).toBe(false);
      expect(status.budget_type).toBe('daily');
      expect(status.message).toContain('Budget exceeded');
    });

    it('returns not within budget when monthly limit exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: [{ within_budget: false, daily_remaining: null, monthly_remaining: -10.00, budget_type: 'monthly' }],
        error: null
      });

      const status = await enforcer.checkBudget('Orchestrator', 'ws-123', 15.00);

      expect(status.within_budget).toBe(false);
      expect(status.budget_type).toBe('monthly');
    });

    it('returns not within budget when per-execution limit exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: [{ within_budget: false, daily_remaining: null, monthly_remaining: null, budget_type: 'per_execution' }],
        error: null
      });

      const status = await enforcer.checkBudget('ContentGenerator', 'ws-123', 1.00);

      expect(status.within_budget).toBe(false);
      expect(status.budget_type).toBe('per_execution');
    });

    it('fails open when database error occurs', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('DB error') });

      const status = await enforcer.checkBudget('TestAgent', 'ws-123', 0.01);

      expect(status.within_budget).toBe(true); // Fail open
      expect(status.message).toContain('Budget check failed');
    });
  });

  describe('getBudget', () => {
    it('returns budget when it exists', async () => {
      const mockBudget = {
        id: 'budget-1',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        daily_budget_usd: 10.00,
        monthly_budget_usd: 200.00,
        daily_spent_usd: 5.00,
        monthly_spent_usd: 75.00,
        pause_on_exceed: true,
        alert_at_percentage: 80
      };

      mockSingle.mockResolvedValue({ data: mockBudget, error: null });

      const budget = await enforcer.getBudget('EmailAgent', 'ws-123');

      expect(budget).toBeDefined();
      expect(budget?.daily_budget_usd).toBe(10.00);
      expect(budget?.daily_spent_usd).toBe(5.00);
    });

    it('returns null when budget does not exist', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const budget = await enforcer.getBudget('NewAgent', 'ws-123');

      expect(budget).toBeNull();
    });
  });

  describe('setBudget', () => {
    it('creates or updates budget', async () => {
      const mockBudget = {
        id: 'budget-1',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        daily_budget_usd: 15.00,
        monthly_budget_usd: 300.00
      };

      mockSingle.mockResolvedValue({ data: mockBudget, error: null });

      const result = await enforcer.setBudget('EmailAgent', 'ws-123', {
        daily_budget_usd: 15.00,
        monthly_budget_usd: 300.00
      });

      expect(result.daily_budget_usd).toBe(15.00);
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe('shouldAlert', () => {
    it('returns true when daily budget at alert threshold', async () => {
      const mockBudget = {
        daily_budget_usd: 10.00,
        daily_spent_usd: 8.50, // 85% of budget
        monthly_budget_usd: 200.00,
        monthly_spent_usd: 50.00,
        alert_at_percentage: 80
      };

      mockSingle.mockResolvedValue({ data: mockBudget, error: null });

      const shouldAlert = await enforcer.shouldAlert('EmailAgent', 'ws-123');

      expect(shouldAlert).toBe(true);
    });

    it('returns true when monthly budget at alert threshold', async () => {
      const mockBudget = {
        daily_budget_usd: 10.00,
        daily_spent_usd: 5.00,
        monthly_budget_usd: 200.00,
        monthly_spent_usd: 170.00, // 85% of budget
        alert_at_percentage: 80
      };

      mockSingle.mockResolvedValue({ data: mockBudget, error: null });

      const shouldAlert = await enforcer.shouldAlert('ContentGenerator', 'ws-123');

      expect(shouldAlert).toBe(true);
    });

    it('returns false when below alert threshold', async () => {
      const mockBudget = {
        daily_budget_usd: 10.00,
        daily_spent_usd: 5.00, // 50% of budget
        monthly_budget_usd: 200.00,
        monthly_spent_usd: 50.00, // 25% of budget
        alert_at_percentage: 80
      };

      mockSingle.mockResolvedValue({ data: mockBudget, error: null });

      const shouldAlert = await enforcer.shouldAlert('Orchestrator', 'ws-123');

      expect(shouldAlert).toBe(false);
    });

    it('returns false when no budget configured', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const shouldAlert = await enforcer.shouldAlert('UnknownAgent', 'ws-123');

      expect(shouldAlert).toBe(false);
    });
  });

  describe('getAllBudgets', () => {
    it('returns all budgets for workspace sorted by spend', async () => {
      const mockBudgets = [
        { agent_name: 'ContentGenerator', monthly_spent_usd: 150.00 },
        { agent_name: 'EmailAgent', monthly_spent_usd: 50.00 },
        { agent_name: 'Orchestrator', monthly_spent_usd: 25.00 }
      ];

      mockOrder.mockResolvedValue({ data: mockBudgets, error: null });

      const budgets = await enforcer.getAllBudgets('ws-123');

      expect(budgets).toHaveLength(3);
      expect(budgets[0].agent_name).toBe('ContentGenerator');
      expect(mockOrder).toHaveBeenCalledWith('monthly_spent_usd', { ascending: false });
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const instance1 = getBudgetEnforcer();
      const instance2 = getBudgetEnforcer();

      expect(instance1).toBe(instance2);
    });
  });
});
