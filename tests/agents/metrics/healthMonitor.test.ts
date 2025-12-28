/**
 * Tests for HealthMonitor
 * Part of Project Vend Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthMonitor, getHealthMonitor } from '@/lib/agents/metrics/healthMonitor';

// Mock Supabase
const mockUpsert = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockIn = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  order: mockOrder,
  limit: mockLimit,
  in: mockIn
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

// Mock MetricsCollector
const mockGetAgentMetrics = vi.fn();
vi.mock('@/lib/agents/metrics/metricsCollector', () => ({
  getMetricsCollector: vi.fn(() => ({
    getAgentMetrics: mockGetAgentMetrics
  }))
}));

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new HealthMonitor();
  });

  describe('calculateHealthStatus', () => {
    it('returns critical for low success rate', () => {
      const status = monitor.calculateHealthStatus(65, 10, 0);
      expect(status).toBe('critical');
    });

    it('returns critical for high error rate', () => {
      const status = monitor.calculateHealthStatus(90, 35, 0);
      expect(status).toBe('critical');
    });

    it('returns critical for 5+ consecutive failures', () => {
      const status = monitor.calculateHealthStatus(90, 5, 5);
      expect(status).toBe('critical');
    });

    it('returns degraded for moderately low success rate', () => {
      const status = monitor.calculateHealthStatus(80, 10, 0);
      expect(status).toBe('degraded');
    });

    it('returns degraded for moderately high error rate', () => {
      const status = monitor.calculateHealthStatus(90, 20, 0);
      expect(status).toBe('degraded');
    });

    it('returns degraded for 3-4 consecutive failures', () => {
      const status = monitor.calculateHealthStatus(90, 5, 3);
      expect(status).toBe('degraded');
    });

    it('returns healthy for good metrics', () => {
      const status = monitor.calculateHealthStatus(95, 5, 0);
      expect(status).toBe('healthy');
    });

    it('returns healthy at exact thresholds', () => {
      const status = monitor.calculateHealthStatus(85, 15, 2);
      expect(status).toBe('healthy');
    });
  });

  describe('updateAgentHealth', () => {
    it('calculates and upserts health status correctly', async () => {
      // Setup mocks
      mockGetAgentMetrics
        .mockResolvedValueOnce({
          total_executions: 100,
          success_rate: 95,
          avg_execution_time_ms: 1500,
          error_rate: 5,
          total_cost_usd: 2.50,
          avg_cost_usd: 0.025
        })
        .mockResolvedValueOnce({
          total_executions: 1000,
          success_rate: 90,
          avg_execution_time_ms: 1400,
          error_rate: 10,
          total_cost_usd: 50.00,
          avg_cost_usd: 0.05
        });

      const mockExecutions = [
        { success: true, executed_at: '2025-12-29T10:00:00Z', error_type: null },
        { success: true, executed_at: '2025-12-29T09:00:00Z', error_type: null }
      ];
      mockLimit.mockResolvedValue({ data: mockExecutions, error: null });
      mockUpsert.mockResolvedValue({ error: null });

      const health = await monitor.updateAgentHealth('EmailAgent', 'ws-123');

      expect(health.status).toBe('healthy');
      expect(health.success_rate_24h).toBe(95);
      expect(health.avg_execution_time_24h).toBe(1500);
      expect(health.consecutive_failures).toBe(0);
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('tracks consecutive failures correctly', async () => {
      mockGetAgentMetrics
        .mockResolvedValueOnce({
          total_executions: 10,
          success_rate: 70,
          avg_execution_time_ms: 1000,
          error_rate: 30,
          total_cost_usd: 0.50,
          avg_cost_usd: 0.05
        })
        .mockResolvedValueOnce({
          total_executions: 100,
          success_rate: 75,
          avg_execution_time_ms: 1100,
          error_rate: 25,
          total_cost_usd: 5.00,
          avg_cost_usd: 0.05
        });

      const mockExecutions = [
        { success: false, executed_at: '2025-12-29T10:00:00Z', error_type: 'TimeoutError' },
        { success: false, executed_at: '2025-12-29T09:30:00Z', error_type: 'TimeoutError' },
        { success: false, executed_at: '2025-12-29T09:00:00Z', error_type: 'APIError' },
        { success: true, executed_at: '2025-12-29T08:00:00Z', error_type: null }
      ];
      mockLimit.mockResolvedValue({ data: mockExecutions, error: null });
      mockUpsert.mockResolvedValue({ error: null });

      const health = await monitor.updateAgentHealth('FailingAgent', 'ws-123');

      expect(health.consecutive_failures).toBe(3);
      expect(health.status).toBe('degraded');
      expect(health.last_error).toBe('TimeoutError');
    });

    it('handles agents with no execution history', async () => {
      mockGetAgentMetrics
        .mockResolvedValueOnce({
          total_executions: 0,
          success_rate: 0,
          avg_execution_time_ms: 0,
          error_rate: 0,
          total_cost_usd: 0,
          avg_cost_usd: 0
        })
        .mockResolvedValueOnce({
          total_executions: 0,
          success_rate: 0,
          avg_execution_time_ms: 0,
          error_rate: 0,
          total_cost_usd: 0,
          avg_cost_usd: 0
        });

      mockLimit.mockResolvedValue({ data: [], error: null });
      mockUpsert.mockResolvedValue({ error: null });

      await expect(
        monitor.updateAgentHealth('NewAgent', 'ws-123')
      ).resolves.toBeDefined();
    });
  });

  describe('getHealthDashboard', () => {
    it('returns summary with all agents', async () => {
      const mockAgents = [
        {
          agent_name: 'EmailAgent',
          workspace_id: 'ws-123',
          status: 'healthy',
          success_rate_24h: 95,
          cost_24h_usd: 1.50,
          total_executions_24h: 100
        },
        {
          agent_name: 'ContentGenerator',
          workspace_id: 'ws-123',
          status: 'degraded',
          success_rate_24h: 80,
          cost_24h_usd: 2.00,
          total_executions_24h: 50
        },
        {
          agent_name: 'Orchestrator',
          workspace_id: 'ws-123',
          status: 'critical',
          success_rate_24h: 60,
          cost_24h_usd: 0.50,
          total_executions_24h: 30
        }
      ];

      mockOrder.mockResolvedValue({ data: mockAgents, error: null });

      const dashboard = await monitor.getHealthDashboard('ws-123');

      expect(dashboard.agents).toHaveLength(3);
      expect(dashboard.summary.total_agents).toBe(3);
      expect(dashboard.summary.healthy_count).toBe(1);
      expect(dashboard.summary.degraded_count).toBe(1);
      expect(dashboard.summary.critical_count).toBe(1);
      expect(dashboard.summary.total_cost_24h_usd).toBe(4.00);
      expect(dashboard.summary.total_executions_24h).toBe(180);
      expect(dashboard.summary.overall_success_rate).toBeCloseTo(78.33, 1);
    });

    it('handles no agents gracefully', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const dashboard = await monitor.getHealthDashboard('ws-456');

      expect(dashboard.agents).toHaveLength(0);
      expect(dashboard.summary.total_agents).toBe(0);
      expect(dashboard.summary.healthy_count).toBe(0);
    });
  });

  describe('detectDegradation', () => {
    it('returns degraded and critical agents only', async () => {
      const mockDegraded = [
        {
          agent_name: 'Agent1',
          status: 'degraded',
          success_rate_24h: 80,
          error_rate_24h: 20,
          consecutive_failures: 3,
          last_error: 'TimeoutError'
        },
        {
          agent_name: 'Agent2',
          status: 'critical',
          success_rate_24h: 60,
          error_rate_24h: 40,
          consecutive_failures: 5,
          last_error: 'APIError'
        }
      ];

      mockIn.mockResolvedValue({ data: mockDegraded, error: null });

      const degraded = await monitor.detectDegradation('ws-123');

      expect(degraded).toHaveLength(2);
      expect(degraded[0].status).toBe('degraded');
      expect(degraded[1].status).toBe('critical');
      expect(degraded[0].reason).toContain('3 consecutive failures');
      expect(degraded[1].reason).toContain('5 consecutive failures');
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const instance1 = getHealthMonitor();
      const instance2 = getHealthMonitor();

      expect(instance1).toBe(instance2);
    });
  });
});
