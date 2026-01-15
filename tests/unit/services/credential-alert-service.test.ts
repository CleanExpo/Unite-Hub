/**
 * Unit Tests: CredentialAlertService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCredential, createMockAlert, createMockSupabaseClient } from '../../utils/test-helpers';

const mockSupabase = createMockSupabaseClient();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const { CredentialAlertService } = await import('@/cli/services/monitoring/credential-alerts');

describe('CredentialAlertService', () => {
  let alertService: InstanceType<typeof CredentialAlertService>;

  beforeEach(() => {
    vi.clearAllMocks();
    alertService = new CredentialAlertService();
  });

  describe('checkAndSendAlerts', () => {
    it('should generate alerts for expiring credentials', async () => {
      const expiringCredential = createMockCredential({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ data: [expiringCredential], error: null }),
          };
        }
        if (table === 'alerts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: createMockAlert(), error: null }),
          };
        }
        return {} as any;
      }) as any;

      const alerts = await alertService.checkAndSendAlerts();

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('expiring_7d');
    });

    it('should not create duplicate alerts within 24 hours', async () => {
      const credential = createMockCredential({
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const existingAlert = createMockAlert({
        sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      });

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ data: [credential], error: null }),
          };
        }
        if (table === 'alerts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [existingAlert], error: null }),
          };
        }
        return {} as any;
      }) as any;

      const alerts = await alertService.checkAndSendAlerts();

      expect(alerts.length).toBe(0); // No new alerts created
    });

    it('should classify alerts by severity correctly', async () => {
      const criticalCredential = createMockCredential({
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
      });

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'credentials') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ data: [criticalCredential], error: null }),
          };
        }
        if (table === 'alerts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: createMockAlert({ severity: 'critical', type: 'expiring_1d' }),
              error: null,
            }),
          };
        }
        return {} as any;
      }) as any;

      const alerts = await alertService.checkAndSendAlerts();

      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].type).toBe('expiring_1d');
    });
  });

  describe('configureAlertRule', () => {
    it('should create alert rule successfully', async () => {
      const ruleData = {
        workspaceId: 'workspace-uuid',
        alertType: 'expiring_7d' as const,
        channels: ['email' as const, 'slack' as const],
        emailRecipients: ['admin@example.com'],
        slackWebhookUrl: 'https://hooks.slack.com/...',
      };

      const mockRule = {
        id: 'rule-uuid',
        ...ruleData,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRule, error: null }),
      })) as any;

      const result = await alertService.configureAlertRule(ruleData);

      expect(result.alertType).toBe('expiring_7d');
      expect(result.channels).toContain('email');
      expect(result.channels).toContain('slack');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert successfully', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })) as any;

      await expect(alertService.acknowledgeAlert('alert-uuid')).resolves.not.toThrow();
    });
  });

  describe('getAlerts', () => {
    it('should retrieve unacknowledged alerts', async () => {
      const mockAlerts = [createMockAlert(), createMockAlert({ acknowledged: false })];

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockAlerts, error: null }),
      })) as any;

      const alerts = await alertService.getAlerts('workspace-uuid', false);

      expect(alerts.length).toBe(2);
      expect(alerts.every((a) => !a.acknowledged)).toBe(true);
    });
  });
});
