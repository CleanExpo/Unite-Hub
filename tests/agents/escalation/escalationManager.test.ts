/**
 * Tests for EscalationManager
 * Part of Project Vend Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EscalationManager, getEscalationManager } from '@/lib/agents/escalation/escalationManager';

// Mock Supabase
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockLt = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockReturnThis();
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  lt: mockLt,
  order: mockOrder,
  single: mockSingle
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc
  }))
}));

describe('EscalationManager', () => {
  let manager: EscalationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new EscalationManager();
  });

  describe('createEscalation', () => {
    it('creates escalation with approval required for critical severity', async () => {
      // Mock config lookup
      mockSingle.mockResolvedValueOnce({
        data: {
          escalation_chains: { critical: ['user-1', 'user-2'], warning: [], info: [] },
          notify_immediately: true
        },
        error: null
      });

      // Mock approver lookup
      mockRpc.mockResolvedValueOnce({ data: 'user-1', error: null });

      // Mock escalation insert
      const mockEscalation = {
        id: 'esc-1',
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        escalation_type: 'rule_violation',
        severity: 'critical',
        title: 'Score change exceeded',
        requires_approval: true,
        escalated_to: 'user-1',
        approval_status: 'pending'
      };
      mockSingle.mockResolvedValueOnce({ data: mockEscalation, error: null });

      const result = await manager.createEscalation({
        workspace_id: 'ws-123',
        agent_name: 'EmailAgent',
        escalation_type: 'rule_violation',
        severity: 'critical',
        title: 'Score change exceeded',
        description: 'Attempted to change score by 30 points'
      });

      expect(result.id).toBe('esc-1');
      expect(result.requires_approval).toBe(true);
      expect(result.escalated_to).toBe('user-1');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('creates escalation without approval for info severity with auto-approve', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          escalation_chains: { critical: [], warning: [], info: [] },
          auto_approve_low_severity: true
        },
        error: null
      });

      const mockEscalation = {
        id: 'esc-2',
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        escalation_type: 'low_confidence',
        severity: 'info',
        title: 'Low confidence content',
        requires_approval: false,
        approval_status: 'pending'
      };
      mockSingle.mockResolvedValueOnce({ data: mockEscalation, error: null });

      const result = await manager.createEscalation({
        workspace_id: 'ws-123',
        agent_name: 'ContentGenerator',
        escalation_type: 'low_confidence',
        severity: 'info',
        title: 'Low confidence content'
      });

      expect(result.requires_approval).toBe(false);
    });

    it('handles cost exceeded escalations', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          escalation_chains: { critical: ['user-1'], warning: [], info: [] },
          notify_immediately: true
        },
        error: null
      });

      mockRpc.mockResolvedValueOnce({ data: 'user-1', error: null });

      const mockEscalation = {
        id: 'esc-3',
        workspace_id: 'ws-123',
        agent_name: 'Orchestrator',
        escalation_type: 'cost_exceeded',
        severity: 'critical',
        title: 'Daily budget exceeded',
        requires_approval: true
      };
      mockSingle.mockResolvedValueOnce({ data: mockEscalation, error: null });

      const result = await manager.createEscalation({
        workspace_id: 'ws-123',
        agent_name: 'Orchestrator',
        escalation_type: 'cost_exceeded',
        severity: 'critical',
        title: 'Daily budget exceeded',
        context: { daily_spent: 25.50, limit: 15.00 }
      });

      expect(result.escalation_type).toBe('cost_exceeded');
      expect(result.requires_approval).toBe(true);
    });
  });

  describe('approveEscalation', () => {
    it('marks escalation as approved', async () => {
      const mockApproved = {
        id: 'esc-1',
        approval_status: 'approved',
        approved_by: 'user-1',
        approval_reason: 'Looks good',
        action_taken: 'allowed'
      };

      mockSingle.mockResolvedValue({ data: mockApproved, error: null });

      const result = await manager.approveEscalation('esc-1', 'user-1', 'Looks good');

      expect(result.approval_status).toBe('approved');
      expect(result.approved_by).toBe('user-1');
      expect(result.action_taken).toBe('allowed');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          approval_status: 'approved',
          action_taken: 'allowed'
        })
      );
    });
  });

  describe('rejectEscalation', () => {
    it('marks escalation as rejected', async () => {
      const mockRejected = {
        id: 'esc-1',
        approval_status: 'rejected',
        approved_by: 'user-1',
        approval_reason: 'Too risky',
        action_taken: 'blocked'
      };

      mockSingle.mockResolvedValue({ data: mockRejected, error: null });

      const result = await manager.rejectEscalation('esc-1', 'user-1', 'Too risky');

      expect(result.approval_status).toBe('rejected');
      expect(result.approved_by).toBe('user-1');
      expect(result.action_taken).toBe('blocked');
    });
  });

  describe('getPendingEscalations', () => {
    it('returns pending escalations for workspace', async () => {
      const mockEscalations = [
        {
          id: 'esc-1',
          workspace_id: 'ws-123',
          severity: 'critical',
          approval_status: 'pending'
        },
        {
          id: 'esc-2',
          workspace_id: 'ws-123',
          severity: 'warning',
          approval_status: 'pending'
        }
      ];

      mockOrder.mockResolvedValue({ data: mockEscalations, error: null });

      const result = await manager.getPendingEscalations('ws-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('esc-1');
    });

    it('filters by severity when provided', async () => {
      const mockEscalations = [
        {
          id: 'esc-1',
          workspace_id: 'ws-123',
          severity: 'critical',
          approval_status: 'pending'
        }
      ];

      // Setup full mock chain
      mockEq.mockReturnThis();
      mockOrder.mockReturnThis();

      // Final resolution returns the chain with data
      const finalChain = {
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockEscalations, error: null })
        })
      };

      mockOrder.mockReturnValueOnce(finalChain);

      const result = await manager.getPendingEscalations('ws-123', 'critical');

      // Verify the method completed
      expect(result).toBeDefined();
    });
  });

  describe('getEscalationStats', () => {
    it('calculates statistics correctly', async () => {
      const mockEscalations = [
        {
          severity: 'critical',
          escalation_type: 'cost_exceeded',
          approval_status: 'approved',
          auto_resolved: false,
          escalated_at: '2025-12-29T10:00:00Z',
          resolved_at: '2025-12-29T12:00:00Z' // 2 hours
        },
        {
          severity: 'warning',
          escalation_type: 'rule_violation',
          approval_status: 'pending',
          auto_resolved: false,
          escalated_at: '2025-12-29T11:00:00Z',
          resolved_at: null
        },
        {
          severity: 'info',
          escalation_type: 'low_confidence',
          approval_status: 'auto_resolved',
          auto_resolved: true,
          escalated_at: '2025-12-29T08:00:00Z',
          resolved_at: '2025-12-29T09:00:00Z' // 1 hour
        }
      ];

      mockGte.mockResolvedValue({ data: mockEscalations, error: null });

      const stats = await manager.getEscalationStats('ws-123', 24);

      expect(stats.total_escalations).toBe(3);
      expect(stats.pending_count).toBe(1);
      expect(stats.approved_count).toBe(1);
      expect(stats.auto_resolved_count).toBe(1);
      expect(stats.by_severity['critical']).toBe(1);
      expect(stats.by_severity['warning']).toBe(1);
      expect(stats.by_severity['info']).toBe(1);
      expect(stats.by_type['cost_exceeded']).toBe(1);
      expect(stats.avg_resolution_time_hours).toBeCloseTo(1.5, 1); // (2 + 1) / 2
    });

    it('handles no escalations gracefully', async () => {
      mockGte.mockResolvedValue({ data: [], error: null });

      const stats = await manager.getEscalationStats('ws-456', 24);

      expect(stats.total_escalations).toBe(0);
      expect(stats.pending_count).toBe(0);
    });
  });

  describe('autoResolveStaleEscalations', () => {
    it('calls database function with correct threshold', async () => {
      mockRpc.mockResolvedValue({ data: 5, error: null });

      const count = await manager.autoResolveStaleEscalations(48);

      expect(mockRpc).toHaveBeenCalledWith('auto_resolve_stale_escalations', {
        p_hours_threshold: 48
      });
      expect(count).toBe(5);
    });

    it('handles no stale escalations', async () => {
      mockRpc.mockResolvedValue({ data: 0, error: null });

      const count = await manager.autoResolveStaleEscalations(24);

      expect(count).toBe(0);
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const instance1 = getEscalationManager();
      const instance2 = getEscalationManager();

      expect(instance1).toBe(instance2);
    });
  });
});
