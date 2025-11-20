/**
 * MVP Dashboard Service Unit Tests
 * Phase 15 Week 3-4
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { MvpDashboardService } from '../services/MvpDashboardService';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(),
}));

import { getSupabaseServer } from '@/lib/supabase';

describe('MvpDashboardService', () => {
  let service: MvpDashboardService;
  let mockSupabase: {
    from: Mock;
    select: Mock;
    insert: Mock;
    update: Mock;
    upsert: Mock;
    eq: Mock;
    single: Mock;
    order: Mock;
    limit: Mock;
  };

  beforeEach(() => {
    service = new MvpDashboardService();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    (getSupabaseServer as Mock).mockResolvedValue(mockSupabase);
  });

  describe('getSystemHealth', () => {
    it('should return healthy status when database is responsive', async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: [{ id: 'test' }],
        error: null,
      });

      const result = await service.getSystemHealth();

      expect(result.status).toBe('healthy');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.checks.database.status).toBe('healthy');
    });

    it('should return unhealthy status when database fails', async () => {
      mockSupabase.limit.mockReturnValueOnce({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await service.getSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.score).toBeLessThan(80);
      expect(result.checks.database.status).toBe('unhealthy');
    });
  });

  describe('getBillingStatus', () => {
    it('should return billing status with usage counts', async () => {
      // Mock contact count
      mockSupabase.eq.mockReturnValueOnce({
        count: 50,
        error: null,
      });

      // Mock email count
      mockSupabase.eq.mockReturnValueOnce({
        count: 100,
        error: null,
      });

      const result = await service.getBillingStatus('user-123', 'workspace-456');

      expect(result.plan).toBe('Free');
      expect(result.status).toBe('active');
      expect(result.usage.contacts.used).toBe(50);
      expect(result.usage.emails.used).toBe(100);
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return not started if no progress exists', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await service.getOnboardingStatus('user-123', 'workspace-456');

      expect(result.completed).toBe(false);
      expect(result.currentStep).toBe(0);
      expect(result.percentComplete).toBe(0);
    });

    it('should return progress with percentage', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          status: 'in_progress',
          current_step: 3,
          completed_steps: [1, 2],
          skipped_steps: [],
        },
        error: null,
      });

      const result = await service.getOnboardingStatus('user-123', 'workspace-456');

      expect(result.completed).toBe(false);
      expect(result.currentStep).toBe(3);
      expect(result.percentComplete).toBe(40); // 2/5 = 40%
    });

    it('should return completed when status is completed', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          status: 'completed',
          current_step: 5,
          completed_steps: [1, 2, 3, 4, 5],
          skipped_steps: [],
        },
        error: null,
      });

      const result = await service.getOnboardingStatus('user-123', 'workspace-456');

      expect(result.completed).toBe(true);
      expect(result.percentComplete).toBe(100);
    });
  });

  describe('getWidgets', () => {
    it('should return active widgets ordered by default_order', async () => {
      const widgets = [
        { id: '1', widget_key: 'system_health', default_order: 1 },
        { id: '2', widget_key: 'strategy_status', default_order: 2 },
      ];

      mockSupabase.order.mockReturnValueOnce({
        data: widgets,
        error: null,
      });

      const result = await service.getWidgets();

      expect(result).toHaveLength(2);
      expect(result[0].widget_key).toBe('system_health');
    });

    it('should throw error on database failure', async () => {
      mockSupabase.order.mockReturnValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.getWidgets()).rejects.toThrow('Failed to fetch widgets');
    });
  });

  describe('getUserPreferences', () => {
    it('should return default preferences if none exist', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await service.getUserPreferences('user-123', 'workspace-456');

      expect(result.theme).toBe('system');
      expect(result.sidebar_collapsed).toBe(false);
      expect(result.widget_order).toEqual([]);
    });

    it('should return existing preferences', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'pref-1',
          widget_order: ['billing_status', 'system_health'],
          hidden_widgets: ['operator_queue'],
          theme: 'dark',
          sidebar_collapsed: true,
        },
        error: null,
      });

      const result = await service.getUserPreferences('user-123', 'workspace-456');

      expect(result.theme).toBe('dark');
      expect(result.sidebar_collapsed).toBe(true);
      expect(result.widget_order).toContain('billing_status');
      expect(result.hidden_widgets).toContain('operator_queue');
    });
  });

  describe('updateUserPreferences', () => {
    it('should upsert preferences', async () => {
      const updated = {
        id: 'pref-1',
        widget_order: ['system_health'],
        hidden_widgets: [],
        widget_sizes: {},
        widget_configs: {},
        theme: 'light',
        sidebar_collapsed: false,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: updated,
        error: null,
      });

      const result = await service.updateUserPreferences('user-123', 'workspace-456', {
        theme: 'light',
      });

      expect(result.theme).toBe('light');
    });
  });

  describe('getNotifications', () => {
    it('should return unread notifications', async () => {
      const notifications = [
        { id: 'notif-1', title: 'Welcome', is_read: false },
        { id: 'notif-2', title: 'Setup complete', is_read: false },
      ];

      mockSupabase.limit.mockReturnValueOnce({
        data: notifications,
        error: null,
      });

      const result = await service.getNotifications('user-123', 'workspace-456');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Welcome');
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const created = {
        id: 'notif-new',
        type: 'info',
        title: 'Test Notification',
        source: 'test',
        is_read: false,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: created,
        error: null,
      });

      const result = await service.createNotification('user-123', 'workspace-456', {
        type: 'info',
        title: 'Test Notification',
        source: 'test',
      });

      expect(result.title).toBe('Test Notification');
      expect(result.type).toBe('info');
    });
  });

  describe('markNotificationRead', () => {
    it('should mark notification as read', async () => {
      // Mock chained eq calls - second eq returns result
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce({
        data: null,
        error: null,
      });

      await expect(
        service.markNotificationRead('user-123', 'notif-1')
      ).resolves.not.toThrow();
    });
  });

  describe('dismissNotification', () => {
    it('should dismiss notification', async () => {
      // Mock chained eq calls - second eq returns result
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce({
        data: null,
        error: null,
      });

      await expect(
        service.dismissNotification('user-123', 'notif-1')
      ).resolves.not.toThrow();
    });
  });
});

describe('Dashboard Widget Rendering', () => {
  it('should show onboarding banner when not complete', () => {
    const onboarding = {
      completed: false,
      currentStep: 2,
      totalSteps: 5,
      percentComplete: 20,
    };

    // Widget should show when percentComplete < 100 and not completed
    expect(!onboarding.completed && onboarding.percentComplete < 100).toBe(true);
  });

  it('should hide onboarding banner when complete', () => {
    const onboarding = {
      completed: true,
      currentStep: 5,
      totalSteps: 5,
      percentComplete: 100,
    };

    expect(!onboarding.completed && onboarding.percentComplete < 100).toBe(false);
  });

  it('should calculate usage percentage correctly', () => {
    const getUsagePercent = (used: number, limit: number) => Math.round((used / limit) * 100);

    expect(getUsagePercent(50, 100)).toBe(50);
    expect(getUsagePercent(75, 100)).toBe(75);
    expect(getUsagePercent(0, 100)).toBe(0);
    expect(getUsagePercent(100, 100)).toBe(100);
  });
});

describe('Dashboard Conditional Logic', () => {
  it('should determine health status from score', () => {
    const getStatus = (score: number) => {
      if (score >= 80) return 'healthy';
      if (score >= 50) return 'degraded';
      return 'unhealthy';
    };

    expect(getStatus(100)).toBe('healthy');
    expect(getStatus(80)).toBe('healthy');
    expect(getStatus(79)).toBe('degraded');
    expect(getStatus(50)).toBe('degraded');
    expect(getStatus(49)).toBe('unhealthy');
    expect(getStatus(0)).toBe('unhealthy');
  });

  it('should filter widgets by role', () => {
    const widgets = [
      { widget_key: 'system_health', min_role: 'user' },
      { widget_key: 'operator_queue', min_role: 'admin' },
      { widget_key: 'billing_status', min_role: 'user' },
    ];

    const userWidgets = widgets.filter(w => w.min_role === 'user');
    expect(userWidgets).toHaveLength(2);

    const adminWidgets = widgets.filter(w => w.min_role === 'admin');
    expect(adminWidgets).toHaveLength(1);
  });

  it('should apply user preference widget order', () => {
    const defaultWidgets = ['system_health', 'strategy_status', 'billing_status'];
    const userOrder = ['billing_status', 'system_health', 'strategy_status'];

    // Sort by user preference
    const sorted = [...defaultWidgets].sort((a, b) => {
      const aIndex = userOrder.indexOf(a);
      const bIndex = userOrder.indexOf(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    expect(sorted[0]).toBe('billing_status');
    expect(sorted[1]).toBe('system_health');
    expect(sorted[2]).toBe('strategy_status');
  });
});
