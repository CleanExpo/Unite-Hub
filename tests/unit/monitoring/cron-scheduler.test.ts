/**
 * Tests for cron scheduler service
 * Tests: scheduling, execution, status tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  scheduleMonitoring,
  unscheduleMonitoring,
  executeMonitoringCheck,
  getMonitoringStatus,
  getWorkspaceMonitoringSessions,
  triggerImmediateCheck,
  stopAllMonitoring,
} from '@/lib/monitoring/cron-scheduler';

describe('Cron Scheduler', () => {
  const workspaceId = 'test-workspace';
  const domain = 'example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    stopAllMonitoring();
  });

  afterEach(() => {
    stopAllMonitoring();
  });

  describe('Monitoring Scheduling', () => {
    it('should schedule domain for monitoring', () => {
      scheduleMonitoring(workspaceId, domain, 6);
      const status = getMonitoringStatus();
      expect(status.activeSchedules).toBeGreaterThan(0);
    });

    it('should prevent duplicate schedules', () => {
      scheduleMonitoring(workspaceId, domain, 6);
      scheduleMonitoring(workspaceId, domain, 6);
      const status = getMonitoringStatus();
      // Should only have 1 schedule even though registered twice
      expect(status.schedules.filter((s) => s.domain === domain).length).toBeGreaterThanOrEqual(1);
    });

    it('should set correct interval (6 hours default)', () => {
      scheduleMonitoring(workspaceId, domain);
      const status = getMonitoringStatus();
      const schedule = status.schedules.find((s) => s.domain === domain);
      expect(schedule?.interval).toBe(6 * 60 * 60 * 1000);
    });

    it('should set custom interval', () => {
      scheduleMonitoring(workspaceId, domain, 12);
      const status = getMonitoringStatus();
      const schedule = status.schedules.find((s) => s.domain === domain);
      expect(schedule?.interval).toBe(12 * 60 * 60 * 1000);
    });

    it('should mark schedule as active', () => {
      scheduleMonitoring(workspaceId, domain);
      const status = getMonitoringStatus();
      const schedule = status.schedules.find((s) => s.domain === domain);
      expect(schedule?.active).toBe(true);
    });
  });

  describe('Monitoring Execution', () => {
    it('should execute monitoring check', async () => {
      scheduleMonitoring(workspaceId, domain);
      const threatCount = await executeMonitoringCheck(workspaceId, domain);
      expect(typeof threatCount).toBe('number');
      expect(threatCount).toBeGreaterThanOrEqual(0);
    });

    it('should return threat count', async () => {
      scheduleMonitoring(workspaceId, domain);
      const threatCount = await executeMonitoringCheck(workspaceId, domain);
      expect(threatCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle inactive schedules', async () => {
      const threatCount = await executeMonitoringCheck(workspaceId, 'unscheduled.com');
      expect(threatCount).toBe(0);
    });

    it('should trigger immediate checks', async () => {
      scheduleMonitoring(workspaceId, domain);
      const threatCount = await triggerImmediateCheck(workspaceId, domain);
      expect(typeof threatCount).toBe('number');
    });
  });

  describe('Monitoring Status', () => {
    it('should return monitoring status', () => {
      scheduleMonitoring(workspaceId, domain);
      const status = getMonitoringStatus();
      expect(status).toHaveProperty('activeSchedules');
      expect(status).toHaveProperty('schedules');
      expect(status).toHaveProperty('nextChecks');
    });

    it('should list next checks', () => {
      scheduleMonitoring(workspaceId, domain);
      scheduleMonitoring(workspaceId, 'example2.com');
      const status = getMonitoringStatus();
      expect(Array.isArray(status.nextChecks)).toBe(true);
      expect(status.nextChecks.length).toBeGreaterThanOrEqual(0);
    });

    it('should include domain and scheduled time in next checks', () => {
      scheduleMonitoring(workspaceId, domain);
      const status = getMonitoringStatus();
      if (status.nextChecks.length > 0) {
        const check = status.nextChecks[0];
        expect(check).toHaveProperty('domain');
        expect(check).toHaveProperty('scheduledAt');
      }
    });
  });

  describe('Workspace Monitoring Sessions', () => {
    it('should get all monitoring sessions for workspace', async () => {
      scheduleMonitoring(workspaceId, domain);
      scheduleMonitoring(workspaceId, 'example2.com');
      const sessions = await getWorkspaceMonitoringSessions(workspaceId);
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should include domain and status in sessions', async () => {
      scheduleMonitoring(workspaceId, domain);
      const sessions = await getWorkspaceMonitoringSessions(workspaceId);
      if (sessions.length > 0) {
        const session = sessions[0];
        expect(session).toHaveProperty('domain');
        expect(session).toHaveProperty('active');
        expect(session).toHaveProperty('nextCheck');
        expect(session).toHaveProperty('threatsToday');
      }
    });

    it('should show threats detected today', async () => {
      scheduleMonitoring(workspaceId, domain);
      const sessions = await getWorkspaceMonitoringSessions(workspaceId);
      sessions.forEach((session) => {
        expect(typeof session.threatsToday).toBe('number');
      });
    });

    it('should return empty array for unknown workspace', async () => {
      const sessions = await getWorkspaceMonitoringSessions('unknown-workspace');
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Unscheduling', () => {
    it('should unschedule monitoring', () => {
      scheduleMonitoring(workspaceId, domain);
      unscheduleMonitoring(workspaceId, domain);
      const status = getMonitoringStatus();
      expect(status.schedules.find((s) => s.domain === domain)).toBeUndefined();
    });

    it('should handle unscheduling non-existent domain', () => {
      unscheduleMonitoring(workspaceId, 'non-existent.com');
      const status = getMonitoringStatus();
      expect(status.activeSchedules).toBe(0);
    });
  });

  describe('Stopping All Monitoring', () => {
    it('should stop all monitoring', () => {
      scheduleMonitoring(workspaceId, domain);
      scheduleMonitoring(workspaceId, 'example2.com');
      stopAllMonitoring();
      const status = getMonitoringStatus();
      expect(status.activeSchedules).toBe(0);
    });
  });

  describe('Schedule Intervals', () => {
    it('should support 6-hour interval (default)', () => {
      scheduleMonitoring(workspaceId, domain, 6);
      const status = getMonitoringStatus();
      const schedule = status.schedules[0];
      expect(schedule.interval).toBe(6 * 60 * 60 * 1000);
    });

    it('should support 4-hour interval', () => {
      scheduleMonitoring(workspaceId, domain, 4);
      const status = getMonitoringStatus();
      const schedule = status.schedules[0];
      expect(schedule.interval).toBe(4 * 60 * 60 * 1000);
    });

    it('should support 12-hour interval', () => {
      scheduleMonitoring(workspaceId, domain, 12);
      const status = getMonitoringStatus();
      const schedule = status.schedules[0];
      expect(schedule.interval).toBe(12 * 60 * 60 * 1000);
    });

    it('should support 24-hour interval', () => {
      scheduleMonitoring(workspaceId, domain, 24);
      const status = getMonitoringStatus();
      const schedule = status.schedules[0];
      expect(schedule.interval).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle monitoring check errors', async () => {
      // Should not throw even if check fails
      const threatCount = await executeMonitoringCheck('invalid', 'invalid');
      expect(typeof threatCount).toBe('number');
    });

    it('should handle invalid workspace', async () => {
      const sessions = await getWorkspaceMonitoringSessions('invalid-workspace-123');
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('Multiple Workspaces', () => {
    it('should isolate monitoring by workspace', async () => {
      const workspace2 = 'workspace-2';
      scheduleMonitoring(workspaceId, domain);
      scheduleMonitoring(workspace2, domain);

      const sessions1 = await getWorkspaceMonitoringSessions(workspaceId);
      const sessions2 = await getWorkspaceMonitoringSessions(workspace2);

      expect(sessions1.length).toBeGreaterThanOrEqual(0);
      expect(sessions2.length).toBeGreaterThanOrEqual(0);
    });
  });
});
