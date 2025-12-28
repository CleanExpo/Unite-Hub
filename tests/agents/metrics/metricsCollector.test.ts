/**
 * Tests for MetricsCollector
 * Part of Project Vend Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsCollector, getMetricsCollector } from '@/lib/agents/metrics/metricsCollector';

// Mock Supabase
const mockInsert = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockNot = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  not: mockNot
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    vi.clearAllMocks();
    collector = new MetricsCollector();
  });

  describe('calculateCost', () => {
    it('calculates cost for Opus model correctly', () => {
      const cost = collector.calculateCost('opus-4-5-20251101', 1_000_000, 1_000_000);
      // $15/M input + $75/M output = $90 for 1M/1M tokens
      expect(cost).toBe(90);
    });

    it('calculates cost for Sonnet model correctly', () => {
      const cost = collector.calculateCost('sonnet-4-5-20250929', 1_000_000, 1_000_000);
      // $3/M input + $15/M output = $18 for 1M/1M tokens
      expect(cost).toBe(18);
    });

    it('calculates cost for Haiku model correctly', () => {
      const cost = collector.calculateCost('haiku-4-5-20251001', 1_000_000, 1_000_000);
      // $0.80/M input + $4/M output = $4.80 for 1M/1M tokens
      expect(cost).toBe(4.80);
    });

    it('handles partial token counts', () => {
      const cost = collector.calculateCost('sonnet', 500_000, 250_000);
      // $3/M * 0.5M + $15/M * 0.25M = $1.50 + $3.75 = $5.25
      expect(cost).toBe(5.25);
    });

    it('handles model aliases', () => {
      const costOpus = collector.calculateCost('opus', 1_000_000, 1_000_000);
      const costSonnet = collector.calculateCost('sonnet', 1_000_000, 1_000_000);
      const costHaiku = collector.calculateCost('haiku', 1_000_000, 1_000_000);

      expect(costOpus).toBe(90);
      expect(costSonnet).toBe(18);
      expect(costHaiku).toBe(4.80);
    });

    it('defaults to sonnet pricing for unknown models', () => {
      const cost = collector.calculateCost('unknown-model', 1_000_000, 1_000_000);
      expect(cost).toBe(18); // sonnet pricing
    });
  });

  describe('recordMetrics', () => {
    it('records metrics successfully', async () => {
      mockInsert.mockResolvedValue({ error: null });

      await collector.recordMetrics({
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        execution_time_ms: 1500,
        success: true,
        model_used: 'sonnet',
        input_tokens: 100,
        output_tokens: 50,
        confidence_score: 0.95
      });

      expect(mockFrom).toHaveBeenCalledWith('agent_execution_metrics');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('auto-calculates cost when tokens provided', async () => {
      mockInsert.mockResolvedValue({ error: null });

      await collector.recordMetrics({
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        execution_time_ms: 2500,
        success: true,
        model_used: 'opus',
        input_tokens: 10_000,
        output_tokens: 5_000
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          cost_usd: expect.any(Number)
        })
      );
    });

    it('handles failure metrics', async () => {
      mockInsert.mockResolvedValue({ error: null });

      await collector.recordMetrics({
        workspace_id: 'ws-123',
        agent_name: 'Orchestrator',
        execution_time_ms: 500,
        success: false,
        error_type: 'TimeoutError',
        retry_count: 2
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error_type: 'TimeoutError',
          retry_count: 2
        })
      );
    });

    it('does not throw on database errors', async () => {
      mockInsert.mockResolvedValue({ error: new Error('DB error') });

      // Should not throw
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

  describe('getAgentMetrics', () => {
    it('calculates metrics correctly with data', async () => {
      const mockData = [
        {
          success: true,
          execution_time_ms: 1000,
          cost_usd: '0.05'
        },
        {
          success: true,
          execution_time_ms: 1500,
          cost_usd: '0.07'
        },
        {
          success: false,
          execution_time_ms: 500,
          cost_usd: '0.02'
        }
      ];

      mockGte.mockResolvedValue({ data: mockData, error: null });

      const metrics = await collector.getAgentMetrics('EmailAgent', 'ws-123', 24);

      expect(metrics.total_executions).toBe(3);
      expect(metrics.success_rate).toBeCloseTo(66.67, 1);
      expect(metrics.avg_execution_time_ms).toBe(1000);
      expect(metrics.error_rate).toBeCloseTo(33.33, 1);
      expect(metrics.total_cost_usd).toBeCloseTo(0.14, 2);
      expect(metrics.avg_cost_usd).toBeCloseTo(0.0467, 3);
    });

    it('handles no data gracefully', async () => {
      mockGte.mockResolvedValue({ data: [], error: null });

      const metrics = await collector.getAgentMetrics('NewAgent', 'ws-123', 24);

      expect(metrics.total_executions).toBe(0);
      expect(metrics.success_rate).toBe(0);
      expect(metrics.avg_execution_time_ms).toBe(0);
      expect(metrics.error_rate).toBe(0);
      expect(metrics.total_cost_usd).toBe(0);
      expect(metrics.avg_cost_usd).toBe(0);
    });
  });

  describe('getCostBreakdown', () => {
    it('aggregates cost by model', async () => {
      const mockData = [
        { model_used: 'opus-4-5-20251101', cost_usd: '0.50' },
        { model_used: 'opus-4-5-20251101', cost_usd: '0.30' },
        { model_used: 'sonnet-4-5-20250929', cost_usd: '0.10' },
        { model_used: 'haiku-4-5-20251001', cost_usd: '0.02' }
      ];

      // Add not() to the mock chain
      mockGte.mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const breakdown = await collector.getCostBreakdown('ws-123', 24);

      expect(breakdown['opus-4-5-20251101']).toBe(0.80);
      expect(breakdown['sonnet-4-5-20250929']).toBe(0.10);
      expect(breakdown['haiku-4-5-20251001']).toBe(0.02);
    });
  });

  describe('getTopExpensiveAgents', () => {
    it('returns agents sorted by cost', async () => {
      const mockData = [
        { agent_name: 'ContentGenerator', cost_usd: '0.50' },
        { agent_name: 'ContentGenerator', cost_usd: '0.30' },
        { agent_name: 'EmailAgent', cost_usd: '0.10' },
        { agent_name: 'Orchestrator', cost_usd: '0.05' },
        { agent_name: 'Orchestrator', cost_usd: '0.05' }
      ];

      mockGte.mockResolvedValue({ data: mockData, error: null });

      const topAgents = await collector.getTopExpensiveAgents('ws-123', 24, 3);

      expect(topAgents).toHaveLength(3);
      expect(topAgents[0].agent_name).toBe('ContentGenerator');
      expect(topAgents[0].total_cost_usd).toBe(0.80);
      expect(topAgents[1].agent_name).toBe('EmailAgent');
      expect(topAgents[1].total_cost_usd).toBe(0.10);
      expect(topAgents[2].agent_name).toBe('Orchestrator');
      expect(topAgents[2].total_cost_usd).toBe(0.10);
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const instance1 = getMetricsCollector();
      const instance2 = getMetricsCollector();

      expect(instance1).toBe(instance2);
    });
  });
});
